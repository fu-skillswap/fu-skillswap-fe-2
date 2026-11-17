'use client';

import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { MentorBookingResponse } from '@/models/auth';
import { showError, showSuccess } from '@/utils/toast';
import {
  formatFullDate,
  formatTime,
  formatTimeRange,
  getMentorName,
  getPlatformLabel,
  getBookingStatusConfig,
  toDate,
} from '../bookingStatusConfig';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="m-0 text-sm text-text-main break-words">{children}</dd>
    </div>
  );
}

/** Read-only booking details, including the meeting link before the join window opens. */
export function BookingDetailModal({
  booking,
  onClose,
}: {
  booking?: MentorBookingResponse;
  onClose: () => void;
}) {
  if (!booking) return null;

  const start = toDate(booking.selectedStartTime);
  const joinAt = toDate(booking.joinAvailableAt);
  const platform = getPlatformLabel(booking);
  const link = booking.meetingLink?.trim();
  const isOffline = booking.meetingPlatform === 'OFFLINE';
  const goal = booking.learningGoalTitle?.trim();
  const goalDetail = booking.learningGoalDescription?.trim();
  const mentorNote = booking.mentorResponseNote?.trim();

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      showSuccess('Đã sao chép link phòng học');
    } catch (error) {
      showError(error, { title: 'Không sao chép được link', description: link });
    }
  };

  return (
    <Modal open title={booking.serviceTitle || 'Chi tiết buổi học'} onClose={onClose}>
      <dl className="m-0 grid gap-4">
        <DetailRow label="Mentor">{getMentorName(booking)}</DetailRow>
        <DetailRow label="Trạng thái">{getBookingStatusConfig(booking).label}</DetailRow>
        {start && (
          <DetailRow label="Thời gian">
            {formatFullDate(start)} · {formatTimeRange(booking)}
          </DetailRow>
        )}
        {platform && <DetailRow label="Hình thức">{platform}</DetailRow>}
        {isOffline ? (
          booking.location?.trim() && (
            <DetailRow label="Địa điểm">{booking.location.trim()}</DetailRow>
          )
        ) : (
          <DetailRow label="Link phòng học">
            {link ? (
              <div className="grid gap-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary underline underline-offset-2 break-all"
                >
                  {link}
                </a>
                {joinAt && joinAt.getTime() > Date.now() && (
                  <span className="text-xs text-text-secondary">
                    Phòng mở lúc {formatTime(joinAt)}. Bạn có thể lưu link trước.
                  </span>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={copyLink}>
                    <Copy aria-hidden="true" className="h-4 w-4" />
                    Sao chép link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    Mở link
                  </Button>
                </div>
              </div>
            ) : (
              <span className="text-text-secondary">
                Chưa có link. Link sẽ hiện ở đây khi mentor nhận lịch và tạo phòng.
              </span>
            )}
          </DetailRow>
        )}
        {goal && (
          <DetailRow label="Mục tiêu buổi học">
            <strong>{goal}</strong>
            {goalDetail && <p className="m-0 mt-1 whitespace-pre-line">{goalDetail}</p>}
          </DetailRow>
        )}
        {mentorNote && (
          <DetailRow label="Lời nhắn từ mentor">
            <p className="m-0 whitespace-pre-line">{mentorNote}</p>
          </DetailRow>
        )}
      </dl>
      <footer className="mt-6 flex justify-end border-t border-border-light pt-4">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </footer>
    </Modal>
  );
}
