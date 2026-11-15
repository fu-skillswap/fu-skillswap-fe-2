/**
 * @file MentorVisibilityNotice.tsx
 * @description Explains to a mentor why mentees cannot see their profile (the BE answers 404
 * "Mentor hiện chưa sẵn sàng hiển thị trên discovery" on the public mentor endpoints).
 */

'use client';

import type { MentorProfileResponse, MentorViolationItemResponse } from '@/models/auth';
import { mentorProfileRepo } from '@/repositories/mentorProfileRepo';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const VIOLATION_LABELS: Record<string, string> = {
  LATE_CANCELLATION: 'Hủy lịch sát giờ',
  COMPLETION_OVERDUE: 'Quá hạn xác nhận hoàn thành buổi học',
  MENTOR_NO_SHOW: 'Vắng mặt trong buổi học',
  BOOKING_POLICY_BREACH: 'Vi phạm quy chế đặt lịch',
  CHAT_POLICY_BREACH: 'Vi phạm quy định trò chuyện',
  FORUM_POLICY_BREACH: 'Vi phạm quy định diễn đàn',
  VERIFICATION_FRAUD: 'Gian lận hồ sơ xác minh',
  ADMIN_CONFIRMED_BREACH: 'Vi phạm do quản trị viên xác nhận',
};

const MENTOR_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'bản nháp',
  PENDING_VERIFICATION: 'đang chờ duyệt',
  PAUSED: 'tạm dừng',
  REJECTED: 'bị từ chối',
  SUSPENDED: 'bị tạm ngưng',
};

const MAX_VIOLATIONS_SHOWN = 3;

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function isFuture(value?: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time > Date.now();
}

export function MentorVisibilityNotice({
  profile,
  profileHref,
}: {
  profile: MentorProfileResponse | null | undefined;
  /** Where the "Sẵn sàng nhận lịch" switch lives; omit when the notice is already on that page. */
  profileHref?: string;
}) {
  const suspendedUntil = profile?.bookingSuspendedUntil;
  const isSuspended = isFuture(suspendedUntil);
  const [violations, setViolations] = useState<MentorViolationItemResponse[]>([]);

  useEffect(() => {
    if (!isSuspended) {
      setViolations([]);
      return;
    }
    let isMounted = true;
    mentorProfileRepo
      .getMyViolations()
      .then((response) => {
        if (!isMounted) return;
        setViolations(
          (response.history?.content ?? [])
            .filter((item) => !item.reversedAt)
            .slice(0, MAX_VIOLATIONS_SHOWN),
        );
      })
      // The suspension date alone is enough to explain the state; the history is optional.
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, [isSuspended]);

  if (!profile || profile.exists === false) return null;

  const isInactive = Boolean(profile.mentorStatus) && profile.mentorStatus !== 'ACTIVE';
  const isPaused = !profile.isAvailable;
  if (!isSuspended && !isInactive && !isPaused) return null;

  return (
    <section
      className="flex gap-3 rounded-2xl border border-solid border-amber-200 bg-warning-soft p-4 sm:p-5"
      role="status"
      aria-labelledby="mentor-visibility-notice-title"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-2 text-sm leading-6 text-text-secondary">
        <h2
          id="mentor-visibility-notice-title"
          className="m-0 text-sm font-extrabold text-text-main"
        >
          Mentee hiện không thấy hồ sơ và lịch của bạn
        </h2>
        <ul className="m-0 list-disc space-y-1 pl-5">
          {isSuspended && suspendedUntil && (
            <li>
              Tài khoản đang bị{' '}
              <strong>tạm khóa nhận lịch đến {formatDateTime(suspendedUntil)}</strong>. Hồ sơ sẽ
              hiển thị lại sau thời điểm này.
            </li>
          )}
          {isInactive && (
            <li>
              Hồ sơ mentor đang ở trạng thái{' '}
              <strong>{MENTOR_STATUS_LABELS[profile.mentorStatus] ?? profile.mentorStatus}</strong>.
            </li>
          )}
          {isPaused && (
            <li>
              Công tắc <strong>“Sẵn sàng nhận lịch từ mentee”</strong> đang tắt.{' '}
              {profileHref ? (
                <Link href={profileHref} className="font-bold text-primary underline">
                  Bật lại trong Hồ sơ của tôi
                </Link>
              ) : (
                'Bật lại ở công tắc bên dưới.'
              )}
            </li>
          )}
        </ul>
        {violations.length > 0 && (
          <div>
            <p className="m-0 text-xs font-bold text-text-main">Vi phạm gần đây</p>
            <ul className="m-0 mt-1 list-none space-y-1 p-0 text-xs">
              {violations.map((item) => (
                <li key={item.violationId}>
                  <strong>{VIOLATION_LABELS[item.type] ?? item.type}</strong>
                  {item.occurredAt ? ` · ${formatDateTime(item.occurredAt)}` : ''}
                  {item.reason ? ` — ${item.reason}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        {isSuspended && (
          <p className="m-0 text-xs">
            Nếu bạn cho rằng việc tạm khóa là nhầm lẫn, hãy liên hệ quản trị viên để được xem xét
            lại.
          </p>
        )}
      </div>
    </section>
  );
}
