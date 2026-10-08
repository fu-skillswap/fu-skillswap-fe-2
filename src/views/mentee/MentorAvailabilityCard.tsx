/**
 * @file MentorAvailabilityCard.tsx
 * @description Công tắc "Sẵn sàng nhận lịch" của Mentor trên trang Hồ sơ của tôi.
 */

'use client';

import type { MentorProfileResponse, SaveMentorProfileRequest } from '@/models/auth';
import { mentorProfileRepo } from '@/repositories/mentorProfileRepo';
import { showError, showSuccess } from '@/utils/toast';
import { CalendarCheck2 } from 'lucide-react';
import { useState } from 'react';

/**
 * Builds the full PUT `/api/me/mentor-profile` body from the current profile. The endpoint
 * replaces the whole profile, so every field must be sent back; `overrides` changes only
 * what the caller edits.
 */
export function toMentorProfileRequest(
  profile: MentorProfileResponse,
  overrides: Partial<SaveMentorProfileRequest> = {},
): SaveMentorProfileRequest {
  return {
    headline: profile.headline || 'Mentor',
    expertiseDescription: profile.expertiseDescription || '',
    isAvailable: profile.isAvailable ?? true,
    subjectResults: profile.subjectResults || [],
    foundationSupportLevel: profile.foundationSupportLevel || 5,
    outputReviewSupportLevel: profile.outputReviewSupportLevel || 5,
    directionSupportLevel: profile.directionSupportLevel || 5,
    githubUrl: profile.githubUrl || undefined,
    portfolioUrl: profile.portfolioUrl || undefined,
    phoneNumber: profile.phoneNumber || '',
    minimumBookingLeadTimeMinutes: profile.minimumBookingLeadTimeMinutes || 60,
    maximumBookingHorizonDays: profile.maximumBookingHorizonDays || 30,
    bookingTimezone: profile.bookingTimezone || 'Asia/Ho_Chi_Minh',
    ...overrides,
  };
}

export function MentorAvailabilityCard({
  profile,
  onUpdated,
}: {
  profile: MentorProfileResponse;
  onUpdated: (profile: MentorProfileResponse) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const isAvailable = Boolean(profile.isAvailable);

  const toggle = async () => {
    const next = !isAvailable;
    setIsSaving(true);
    try {
      onUpdated(
        await mentorProfileRepo.save(toMentorProfileRequest(profile, { isAvailable: next })),
      );
      showSuccess(
        next
          ? 'Đã bật nhận lịch. Dịch vụ của bạn đang hiển thị với mentee.'
          : 'Đã tạm dừng nhận lịch. Mentee sẽ không đặt được lịch mới.',
      );
    } catch (reason) {
      showError(reason, { title: 'Không thể cập nhật trạng thái nhận lịch' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-solid border-border-light bg-white p-5 shadow-xs sm:flex-nowrap"
      aria-labelledby="mentor-availability-title"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isAvailable ? 'bg-success-soft text-success' : 'bg-surface-subtle text-text-muted'}`}
        aria-hidden="true"
      >
        <CalendarCheck2 className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="mentor-availability-title"
            className="m-0 text-base font-extrabold text-text-main"
          >
            Sẵn sàng nhận lịch từ mentee
          </h2>
          <span
            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${isAvailable ? 'bg-success-soft text-success' : 'bg-surface-subtle text-text-secondary'}`}
          >
            {isAvailable ? 'Đang nhận lịch' : 'Tạm dừng'}
          </span>
        </div>
        <p className="mb-0 mt-1 text-sm leading-6 text-text-secondary">
          {isAvailable
            ? 'Dịch vụ và lịch trống của bạn đang hiển thị để mentee đặt lịch.'
            : 'Mentee chưa thấy dịch vụ của bạn và không đặt được lịch mới. Bật lên khi bạn sẵn sàng.'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isAvailable}
        aria-labelledby="mentor-availability-title"
        disabled={isSaving}
        onClick={() => void toggle()}
        className={`relative inline-flex h-7 w-12 min-w-12 shrink-0 cursor-pointer items-center overflow-hidden rounded-full border border-solid border-transparent p-0 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-wait disabled:opacity-60 ${isAvailable ? 'bg-primary' : 'bg-slate-300'}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isAvailable ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </section>
  );
}
