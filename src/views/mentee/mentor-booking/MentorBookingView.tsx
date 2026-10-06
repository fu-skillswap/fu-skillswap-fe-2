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
import styles from './MentorBookingView.module.css';

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
        <section className={`${styles.discoveryPage} space-y-0`} aria-label="Tìm Mentor">
          <div className="grid items-center gap-4 rounded-[20px] border border-solid border-[#e1ecf6] bg-white/95 p-4 shadow-[0_5px_18px_rgba(29,76,122,0.035)] sm:p-5 xl:grid-cols-[minmax(360px,1.2fr)_auto] xl:gap-7">
            <label className="relative block w-full">
              <span className="pointer-events-none absolute top-1/2 left-3 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#e9f5ff]">
                <Search className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <input
                className="h-14 w-full rounded-[14px] border border-solid border-[#dce7f2] bg-[#f8fbff] pr-4 pl-16 text-[15px] text-text-main outline-none transition-all placeholder:text-[#71849d] hover:border-primary/35 focus:border-primary focus:bg-white focus:ring-3 focus:ring-primary/10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc kỹ năng..."
                aria-label="Tìm theo tên hoặc kỹ năng"
              />
            </label>
            <div
              className={`${styles.filterScroller} flex items-center gap-2 overflow-x-auto pb-1 xl:justify-end xl:overflow-visible xl:pb-0`}
              aria-label="Lọc Mentor theo lĩnh vực"
            >
              <button
                type="button"
                onClick={() => setCategory(undefined)}
                aria-pressed={!category}
                className={`h-12 shrink-0 rounded-[13px] border border-solid px-5 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-primary/20 ${
                  !category
                    ? 'border-primary bg-primary text-white'
                    : 'border-[#dce6f1] bg-white text-[#465a73] hover:border-primary/30 hover:bg-[#f7fbff]'
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
                  className={`h-12 shrink-0 rounded-[13px] border border-solid px-5 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-primary/20 ${
                    category === option
                      ? 'border-primary bg-primary text-white'
                      : 'border-[#dce6f1] bg-white text-[#465a73] hover:border-primary/30 hover:bg-[#f7fbff]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {!isLoading && (
            <p
              className="m-0 px-2 pt-7 pb-5 text-lg font-bold text-[#0b2554] sm:text-xl"
              aria-live="polite"
            >
              <strong className="text-primary">{filteredMentors.length}</strong> mentor phù hợp
            </p>
          )}
          {isLoading ? (
            <div
              className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
              aria-label="Đang tìm Mentor"
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[470px] w-full animate-pulse rounded-[18px] border border-solid border-border-light bg-white shadow-xs"
                />
              ))}
            </div>
          ) : filteredMentors.length ? (
            <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
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
