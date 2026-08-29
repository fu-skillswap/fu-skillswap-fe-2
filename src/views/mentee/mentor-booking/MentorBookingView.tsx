'use client';

import type { Mentor, MentorService } from '@/models/entities';
import { Modal } from '@/components/ui/Modal';
import { BookingFlow } from '@/components/domain/booking-flow/BookingFlow';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { MentorCard } from '@/components/domain/mentor-card/MentorCard';
import { MentorDetail } from '@/components/domain/mentor-detail/MentorDetail';
import { useEffect, useMemo, useRef, useState } from 'react';
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
    if (!bookingMentor || !slot) return;
    if (await book(bookingMentor.id, slot)) setBookingSuccess(true);
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
        <section className="figma-mentor-directory" aria-label="Mentor discovery">
          <div className="figma-mentor-toolbar">
            <label className="figma-mentor-search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.25 4.25" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or skill..."
                aria-label="Search mentors"
              />
            </label>
            <div className="figma-filter-chips" aria-label="Filter mentors by category">
              <button
                type="button"
                onClick={() => setCategory(undefined)}
                className={
                  category ? 'figma-filter-chip' : 'figma-filter-chip figma-filter-chip-active'
                }
              >
                All
              </button>
              {categoryOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setCategory(option)}
                  className={
                    category === option
                      ? 'figma-filter-chip figma-filter-chip-active'
                      : 'figma-filter-chip'
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {!isLoading && (
            <p className="figma-mentor-count">
              {filteredMentors.length} mentor
              {filteredMentors.length === 1 ? '' : 's'} found
            </p>
          )}
          {isLoading ? (
            <p className="figma-mentor-empty">Searching mentors...</p>
          ) : filteredMentors.length ? (
            <div className="figma-mentor-grid">
              {filteredMentors.map((mentor) => (
                <MentorCard mentor={mentor} key={mentor.id} onSelect={setDetailMentor} />
              ))}
            </div>
          ) : (
            <p className="figma-mentor-empty">No mentors match your search.</p>
          )}
        </section>
      )}
      <Modal
        open={Boolean(bookingMentor && bookingService)}
        title="Book a mentoring session"
        onClose={closeBooking}
        className="figma-booking-modal"
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
