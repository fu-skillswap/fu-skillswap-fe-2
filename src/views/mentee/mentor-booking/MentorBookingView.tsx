'use client';

import type { CreateBookingRequest } from '@/models/auth';
import type { Mentor, MentorService } from '@/models/entities';
import { Modal } from '@/components/ui/Modal';
import { BookingFlow } from '@/components/domain/booking-flow/BookingFlow';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { MentorCard } from '@/components/domain/mentor-card/MentorCard';
import { MentorDetail } from '@/components/domain/mentor-detail/MentorDetail';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useMentorBooking } from './useMentorBooking';
import { mentorRepo } from '@/repositories/mentorRepo';

/**
 * @file MentorBookingView.tsx
 * @description React Component màn hình Danh sách & Đặt lịch Mentor (Mentor Discovery & Booking Page View).
 * Cung cấp ô tìm kiếm (gọi API GET /api/mentors?keyword=...), bộ lọc danh mục,
 * xem hồ sơ chi tiết Mentor và bật Modal quy trình Đặt lịch tư vấn 1:1.
 */

/** Bản đồ từ khóa lĩnh vực phục vụ việc lọc Mentor */
const categoryKeywords = {
  PM: ['product'],
  Tech: ['react', 'typescript', 'system design'],
  Design: ['ui/ux', 'figma', 'ux design', 'product design'],
  Data: ['machine learning', 'python'],
  Marketing: ['marketing', 'brand'],
  Leadership: ['leadership', 'team management'],
} as const;

/** Kiểm tra Mentor có thuộc danh mục kỹ năng tìm kiếm hay không */
function matchesCategory(mentor: Mentor, category: NonNullable<Mentor['category']>) {
  if (mentor.category) return mentor.category === category;
  return mentor.expertise.some((skill) =>
    categoryKeywords[category].some((keyword) => skill.toLocaleLowerCase().includes(keyword)),
  );
}

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
  const [detailMentor, setDetailMentor] = useState<Mentor>();
  const [bookingMentor, setBookingMentor] = useState<Mentor>();
  const [bookingService, setBookingService] = useState<MentorService>();
  const [slot, setSlot] = useState<string>();
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Mentor['category']>();
  const [mentorList, setMentorList] = useState<Mentor[]>(mentors);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialMountRef = useRef(true);

  const { book, error, isSubmitting } = useMentorBooking();
  const { setHeaderTitle } = useMenteeShell();
  const categoryOptions = ['PM', 'Tech', 'Design', 'Data', 'Marketing', 'Leadership'] as const;

  // Cập nhật danh sách từ prop ban đầu khi mentors prop thay đổi
  useEffect(() => {
    setMentorList(mentors);
  }, [mentors]);

  // Gọi API backend GET /api/mentors với param keyword khi ô tìm kiếm thay đổi
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    let isMounted = true;
    const timer = setTimeout(() => {
      setIsLoading(true);
      mentorRepo
        .list({ keyword: query.trim() || undefined })
        .then((data) => {
          if (isMounted) setMentorList(data);
        })
        .catch(() => {
          if (isMounted) setMentorList([]);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  const filteredMentors = useMemo(() => {
    if (!category) return mentorList;
    return mentorList.filter((mentor) => matchesCategory(mentor, category));
  }, [category, mentorList]);

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

  return (
    <>
      {detailMentor ? (
        <MentorDetail
          mentor={detailMentor}
          mentorUserId={detailMentor.mentorUserId || detailMentor.id}
          onBack={() => setDetailMentor(undefined)}
          onBook={(service) => openBooking(detailMentor, service)}
        />
      ) : (
        <section className="mx-auto max-w-7xl space-y-5" aria-label="Tìm Mentor">
          <div className="flex flex-col items-stretch gap-4 rounded-3xl border border-solid border-border-light bg-white p-4 shadow-xs sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative w-full lg:max-w-[460px]">
              <Search
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              />
              <input
                className="h-12 w-full rounded-xl border border-solid border-border-color bg-surface-subtle pl-12 pr-4 text-sm text-text-main outline-none transition-all placeholder:text-text-muted focus:border-primary focus:bg-white focus:ring-3 focus:ring-primary/15"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc kỹ năng..."
                aria-label="Tìm theo tên hoặc kỹ năng"
              />
            </label>
            <div
              className="flex items-center gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0"
              aria-label="Lọc Mentor theo lĩnh vực"
            >
              <button
                type="button"
                onClick={() => setCategory(undefined)}
                aria-pressed={!category}
                className={`h-10 shrink-0 rounded-xl border border-solid px-4 text-sm font-semibold outline-none transition-all focus-visible:ring-3 focus-visible:ring-primary/20 ${
                  !category
                    ? 'bg-primary border-primary text-white shadow-xs'
                    : 'bg-surface-subtle border-border-color text-text-secondary hover:bg-border-strong/20 hover:border-border-strong'
                }`}
              >
                Tất cả
              </button>
              {categoryOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setCategory(option)}
                  aria-pressed={category === option}
                  className={`h-10 shrink-0 rounded-xl border border-solid px-4 text-sm font-semibold outline-none transition-all focus-visible:ring-3 focus-visible:ring-primary/20 ${
                    category === option
                      ? 'bg-primary border-primary text-white shadow-xs'
                      : 'bg-surface-subtle border-border-color text-text-secondary hover:bg-border-strong/20 hover:border-border-strong'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {!isLoading && (
            <p
              className="relative -top-2 m-0 px-1 text-sm font-medium text-text-muted"
              aria-live="polite"
            >
              {filteredMentors.length} mentor phù hợp
            </p>
          )}
          {isLoading ? (
            <div
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              aria-label="Đang tìm Mentor"
            >
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="mx-auto h-[430px] w-full max-w-[280px] animate-pulse rounded-2xl border border-solid border-border-light bg-white shadow-xs"
                />
              ))}
            </div>
          ) : filteredMentors.length ? (
            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMentors.map((mentor) => (
                <MentorCard mentor={mentor} key={mentor.id} onSelect={setDetailMentor} />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-solid border-border-light bg-white p-12 text-center text-sm text-text-muted shadow-xs">
              Không tìm thấy Mentor phù hợp với tìm kiếm của bạn.
            </p>
          )}
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
