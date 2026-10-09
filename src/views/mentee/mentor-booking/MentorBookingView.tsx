'use client';

import type { CreateBookingRequest } from '@/models/auth';
import type { Mentor, MentorService } from '@/models/entities';
import { Modal } from '@/components/ui/Modal';
import { BookingFlow } from '@/components/domain/booking-flow/BookingFlow';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { MentorCard, MentorCardSkeleton } from '@/components/domain/mentor-card/MentorCard';
import { MentorDetail } from '@/components/domain/mentor-detail/MentorDetail';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMentorBooking } from './useMentorBooking';
import { mentorRepo } from '@/repositories/mentorRepo';
import { studentProfileRepo } from '@/repositories/studentProfileRepo';
import { useMentorRecommendations } from '@/views/mentee/dashboard/useMentorRecommendations';
import { AskKouKouCard } from './components/AskKouKouCard';
import { FewMentorsBanner, MatchPanel, type MatchProfile } from './components/MatchPanel';
import { isMentorSort, MentorFilters, type MentorSort } from './components/MentorFilters';
import styles from './MentorBookingView.module.css';

/**
 * @file MentorBookingView.tsx
 * @description React Component màn hình Danh sách & Đặt lịch Mentor (Mentor Discovery & Booking Page View).
 * Gợi ý "Mentor hợp với bạn", bộ lọc (từ khóa, cơ sở, chuyên ngành, sắp xếp – đồng bộ lên URL),
 * xem hồ sơ chi tiết Mentor và bật Modal quy trình Đặt lịch tư vấn 1:1.
 */

/** Panel/banner switch: with this many mentors or fewer the match panel would repeat the list. */
const FEW_MENTORS = 3;
const RECOMMENDATION_LIMIT = 3;

const mentorKey = (mentor: Mentor) => mentor.mentorUserId || mentor.id;

/** Props cho MentorBookingView Component */
interface MentorBookingViewProps {
  /** Danh sách Mentor ban đầu */
  mentors: Mentor[];
  /** Mã locale ngôn ngữ */
  locale: string;
}

/**
 * Component trang Tìm kiếm và Đặt lịch hẹn với Mentor.
 */
export function MentorBookingView({ mentors, locale }: MentorBookingViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [detailMentor, setDetailMentor] = useState<Mentor>();
  const [bookingMentor, setBookingMentor] = useState<Mentor>();
  const [bookingService, setBookingService] = useState<MentorService>();
  const [slot, setSlot] = useState<string>();
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [keyword, setKeyword] = useState(() => (searchParams.get('q') ?? '').trim());
  const [campusId, setCampusId] = useState(() => searchParams.get('campusId') || undefined);
  const [specializationId, setSpecializationId] = useState(
    () => searchParams.get('specializationId') || undefined,
  );
  const [sort, setSort] = useState<MentorSort>(() => {
    const value = searchParams.get('sort');
    return isMentorSort(value) ? value : 'match';
  });
  const [mentorList, setMentorList] = useState<Mentor[]>(mentors);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<MatchProfile>();
  const isInitialMountRef = useRef(true);

  const { book, error, isSubmitting } = useMentorBooking();
  const { setHeaderTitle } = useMenteeShell();
  const { isAuthenticated } = useAuth();
  const recommendations = useMentorRecommendations(RECOMMENDATION_LIMIT);

  // Cập nhật danh sách từ prop ban đầu khi mentors prop thay đổi
  useEffect(() => {
    setMentorList(mentors);
  }, [mentors]);

  // Deep link `?mentorId=` (e.g. from dashboard recommendations) opens that mentor's profile.
  // MentorDetail loads the full profile by id, so a minimal entity is enough when the mentor
  // is not in the first page of the list.
  const linkedMentorId = searchParams.get('mentorId');
  useEffect(() => {
    if (!linkedMentorId) return;
    setDetailMentor(
      mentors.find((mentor) => (mentor.mentorUserId || mentor.id) === linkedMentorId) ?? {
        id: linkedMentorId,
        mentorUserId: linkedMentorId,
        name: 'Mentor',
        expertise: [],
        bio: '',
        rating: null,
      },
    );
  }, [linkedMentorId, mentors]);

  const closeDetail = () => {
    setDetailMentor(undefined);
    if (linkedMentorId) router.replace(pathname, { scroll: false });
  };

  // Debounce typing (300 ms) before it becomes the search keyword.
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Gọi API backend GET /api/mentors với keyword/campusId/specializationId khi bộ lọc thay đổi.
  // The server already rendered the unfiltered list, so the first run only fetches for URL filters.
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      if (!keyword && !campusId && !specializationId) return;
    }

    let isMounted = true;
    setIsLoading(true);
    mentorRepo
      .list({ keyword: keyword || undefined, campusId, specializationId })
      .then((data) => {
        if (isMounted) setMentorList(data);
      })
      .catch(() => {
        if (isMounted) setMentorList([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [keyword, campusId, specializationId]);

  // Keep the filters in the URL so the page can be shared (other params such as mentorId stay).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setParam = (key: string, value?: string) =>
      value ? params.set(key, value) : params.delete(key);
    setParam('q', keyword);
    setParam('campusId', campusId);
    setParam('specializationId', specializationId);
    setParam('sort', sort === 'match' ? undefined : sort);
    const next = params.toString();
    if (next === window.location.search.replace(/^\?/, '')) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [keyword, campusId, specializationId, sort, pathname, router]);

  // Program and semester for the match captions; mentees without a profile get the fallback.
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    studentProfileRepo
      .get()
      .then((data) => {
        if (isMounted && data?.program?.nameVi && data.semester) {
          setProfile({ programName: data.program.nameVi, semester: data.semester });
        }
      })
      .catch(() => {
        // The captions fall back to generic copy.
      });
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const recommendationItems = useMemo(
    () => recommendations.data?.items ?? [],
    [recommendations.data],
  );
  const reasonByMentor = useMemo(() => {
    const reasons = new Map<string, string>();
    recommendationItems.forEach((item) => {
      const reason = item.aiReason ?? item.matchReason;
      if (reason) reasons.set(mentorKey(item.mentor), reason);
    });
    return reasons;
  }, [recommendationItems]);

  const sortedMentors = useMemo(() => {
    const list = [...mentorList];
    if (sort === 'rating') {
      // Ratings are 0–5, so -1 keeps mentors without one at the end.
      return list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    }
    const rank = new Map(
      recommendationItems.map((item, index) => [mentorKey(item.mentor), index] as const),
    );
    const unranked = recommendationItems.length;
    return list.sort(
      (a, b) => (rank.get(mentorKey(a)) ?? unranked) - (rank.get(mentorKey(b)) ?? unranked),
    );
  }, [mentorList, recommendationItems, sort]);

  useEffect(() => {
    setHeaderTitle(detailMentor ? 'Hồ sơ Mentor' : undefined);
    return () => setHeaderTitle(undefined);
  }, [detailMentor, setHeaderTitle]);

  const openBooking = (mentor: Mentor, service: MentorService) => {
    setBookingMentor(mentor);
    setBookingService(service);
    setSlot(undefined);
    setBookingSuccess(false);
  };
  const closeBooking = () => {
    setBookingMentor(undefined);
    setBookingService(undefined);
    setSlot(undefined);
    setBookingSuccess(false);
  };
  const confirmBooking = async () => {
    if (!bookingMentor || !bookingService || !slot) return;
    const payload: CreateBookingRequest = {
      slotId: slot,
      serviceId: bookingService.id,
      startAt: slot.includes('T') ? slot : new Date().toISOString().replace(/Z$/, ''),
    };
    if (await book(payload)) setBookingSuccess(true);
  };

  // TODO: deep-link to schedule — MentorDetail's services section has no id/anchor yet; its
  // default "services" tab is the closest place, so this opens the profile like "Xem hồ sơ".
  const openSchedule = (mentor: Mentor) => setDetailMentor(mentor);

  const isFew = !isLoading && !keyword && sortedMentors.length <= FEW_MENTORS;
  const showMatchPanel =
    isAuthenticated &&
    !isFew &&
    mentors.length > FEW_MENTORS &&
    !recommendations.isError &&
    (recommendations.isPending || recommendationItems.length > 0);
  const resultCount = sortedMentors.length;

  return (
    <>
      {detailMentor ? (
        <MentorDetail
          mentor={detailMentor}
          mentorUserId={detailMentor.mentorUserId || detailMentor.id}
          onBack={closeDetail}
          onBook={(service) => openBooking(detailMentor, service)}
        />
      ) : (
        <section className={`${styles.discoveryPage} space-y-6`} aria-label="Tìm Mentor">
          {showMatchPanel && (
            <MatchPanel
              items={recommendationItems}
              reranked={Boolean(recommendations.data?.reranked)}
              isLoading={recommendations.isPending}
              profile={profile}
              locale={locale}
              onViewSchedule={openSchedule}
            />
          )}
          {isFew && (
            <FewMentorsBanner
              profile={profile}
              hasMatches={sortedMentors.some((mentor) => reasonByMentor.has(mentorKey(mentor)))}
            />
          )}

          <MentorFilters
            query={query}
            onQueryChange={setQuery}
            campusId={campusId}
            onCampusChange={setCampusId}
            specializationId={specializationId}
            onSpecializationChange={setSpecializationId}
            sort={sort}
            onSortChange={setSort}
          />

          <div className="space-y-4">
            <h2 className="m-0 text-xl font-extrabold text-text-main" aria-live="polite">
              {keyword ? `Kết quả cho “${keyword}”` : 'Tất cả mentor'}
              {!isLoading && <span className="font-bold text-slate-500"> · {resultCount}</span>}
            </h2>

            {isLoading ? (
              <div
                className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3"
                aria-busy="true"
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <MentorCardSkeleton key={index} />
                ))}
                <span className="sr-only" role="status">
                  Đang tìm Mentor…
                </span>
              </div>
            ) : resultCount === 0 && keyword ? (
              <AskKouKouCard
                locale={locale}
                title={`Chưa có mentor cho “${keyword}”`}
                className="max-w-[440px]"
              />
            ) : (
              <div className="grid grid-cols-1 items-stretch gap-[18px] md:grid-cols-2 xl:grid-cols-3">
                {sortedMentors.map((mentor) => (
                  <MentorCard
                    mentor={mentor}
                    key={mentor.id}
                    onSelect={setDetailMentor}
                    onViewSchedule={openSchedule}
                    matchReason={reasonByMentor.get(mentorKey(mentor))}
                  />
                ))}
                {isFew && <AskKouKouCard locale={locale} />}
              </div>
            )}
          </div>
        </section>
      )}
      <Modal
        open={Boolean(bookingMentor && bookingService)}
        title={
          bookingService ? `Đặt lịch tư vấn 1:1 — ${bookingService.name}` : 'Đặt lịch tư vấn 1:1'
        }
        onClose={closeBooking}
        className="w-[85vw] max-w-[85vw] md:max-w-5xl"
      >
        {bookingMentor && bookingService && (
          <BookingFlow
            mentor={bookingMentor}
            service={bookingService}
            slot={slot}
            onSlotChange={setSlot}
            onConfirm={() => {
              void confirmBooking();
            }}
            onConfirmWithPayload={async (payload) => {
              if (await book(payload)) setBookingSuccess(true);
            }}
            isSubmitting={isSubmitting}
            error={error}
            success={bookingSuccess}
            onClose={closeBooking}
          />
        )}
      </Modal>
    </>
  );
}
