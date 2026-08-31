'use client';

import type { CandidateSegmentResponse } from '@/models/auth';
import { CalendarX2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/** Danh sách nhãn ngày đầy đủ chuẩn Google Calendar */
const dayNameMap: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

/** Tạo mảng 7 ngày trong tuần (từ Thứ 2 tới Chủ nhật) dựa trên ngày tham chiếu */
function getWeekDays(referenceDate = new Date()) {
  const current = new Date(referenceDate);
  const dayOfWeek = current.getDay(); // 0 là Chủ nhật, 1 là Thứ 2...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return labels.map((label, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      label: dayNameMap[label] || label,
      shortLabel: label,
      dateStr: `${year}-${month}-${day}`,
      dayMonth: `${day}/${month}`,
      fullDate: d,
    };
  });
}

/** Format thời gian hiển thị HH:mm từ ISO String */
function formatTimeHHmm(isoString?: string) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Props của Google Calendar Style BookingCalendar Component */
interface BookingCalendarProps {
  /** Danh sách candidate segments trả về từ Candidate API (GET /api/mentors/{mentorUserId}/availability-slots/{slotId}/candidates?serviceId={serviceId}) */
  candidates?: CandidateSegmentResponse[];
  /** Alias tương thích ngược với candidateSegments */
  candidateSegments?: CandidateSegmentResponse[];
  /** Service ID được chọn để lọc segment hỗ trợ */
  selectedServiceId?: string;
  /** Tên gói dịch vụ được chọn (dùng hiển thị trên thẻ event) */
  selectedServiceName?: string;
  /** Slot ISO string / slotId / segmentId đang được chọn */
  value?: string;
  /** Callback khi người dùng click chọn candidate segment */
  onSelectSlot: (candidate: CandidateSegmentResponse, slotTimeStr: string) => void;
  /** Callback khi đổi khoảng ngày xem lịch tuần */
  onRangeChange?: (fromDate: string, toDate: string) => void;
  /** Cờ trạng thái đang tải candidates từ API */
  isLoading?: boolean;
}

const ROW_HEIGHT_PX = 60; // Chiều cao mỗi ô 1 giờ trong bảng grid

/**
 * Component hiển thị Lịch dạng Google Calendar tuần (Pick a Candidate Segment - Google Calendar Weekly View).
 */
export function BookingCalendar({
  candidates = [],
  candidateSegments = [],
  selectedServiceId,
  selectedServiceName,
  value,
  onSelectSlot,
  onRangeChange,
  isLoading = false,
}: BookingCalendarProps) {
  // Trạng thái offset tuần (0: tuần hiện tại, -1: tuần trước, +1: tuần sau)
  const [weekOffset, setWeekOffset] = useState(0);

  // Tính 7 ngày trong tuần theo weekOffset
  const weekDays = useMemo(() => {
    const refDate = new Date();
    refDate.setDate(refDate.getDate() + weekOffset * 7);
    return getWeekDays(refDate);
  }, [weekOffset]);

  // Thông báo khoảng ngày hiển thị góc trên bên phải (Ví dụ: "24/08 - 30/08/2026")
  const dateRangeHeader = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const endYear = end.fullDate.getFullYear();
    return `${start.dayMonth} - ${end.dayMonth}/${endYear}`;
  }, [weekDays]);

  // Chuyển đổi tuần và thông báo khoảng ngày mới nếu có callback
  const changeWeek = (nextOffset: number) => {
    setWeekOffset(nextOffset);
    if (onRangeChange) {
      const refDate = new Date();
      refDate.setDate(refDate.getDate() + nextOffset * 7);
      const newWeekDays = getWeekDays(refDate);
      onRangeChange(newWeekDays[0].dateStr, newWeekDays[6].dateStr);
    }
  };

  // Danh sách các candidate segments hiển thị trên lịch từ API candidates
  const displaySegments = useMemo<CandidateSegmentResponse[]>(() => {
    const list = candidates.length > 0 ? candidates : candidateSegments;
    if (!selectedServiceId) return list;
    return list.filter((s) => {
      if (!s.serviceId) return true;
      return (
        s.serviceId === selectedServiceId ||
        selectedServiceId.includes(s.serviceId) ||
        s.serviceId.includes(selectedServiceId)
      );
    });
  }, [candidates, candidateSegments, selectedServiceId]);

  const hasSelectableSegments = displaySegments.some(
    (segment) =>
      segment.isSelectable !== false &&
      !segment.blockedByAcceptedBooking &&
      !segment.blockedBySameService &&
      !segment.blockedByDifferentService &&
      !segment.isBlocked,
  );

  // Tính toán dải giờ hiển thị (mặc định từ 08:00 tới 21:00 hoặc tự mở rộng theo slots/candidateSegments)
  const { gridHours, startGridHour } = useMemo(() => {
    let minHour = 8;
    let maxHour = 21;

    displaySegments.forEach((s) => {
      if (!s.startTime) return;
      const startD = new Date(s.startTime);
      if (!Number.isNaN(startD.getTime())) {
        minHour = Math.min(minHour, startD.getHours());
      }
      if (s.endTime) {
        const endD = new Date(s.endTime);
        if (!Number.isNaN(endD.getTime())) {
          maxHour = Math.max(maxHour, Math.ceil(endD.getHours() + endD.getMinutes() / 60));
        }
      }
    });

    const hoursArr: string[] = [];
    for (let h = minHour; h <= maxHour; h++) {
      hoursArr.push(`${String(h).padStart(2, '0')}:00`);
    }

    return { gridHours: hoursArr, startGridHour: minHour };
  }, [displaySegments]);

  // Gom các candidate segment theo từng ngày YYYY-MM-DD
  const segmentsByDay = useMemo(() => {
    const map = new Map<string, CandidateSegmentResponse[]>();

    displaySegments.forEach((segment) => {
      if (!segment.startTime) return;
      const d = new Date(segment.startTime);
      if (Number.isNaN(d.getTime())) return;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const existing = map.get(dateStr) || [];
      existing.push(segment);
      map.set(dateStr, existing);
    });

    return map;
  }, [displaySegments]);

  return (
    <section
      className="gcal-booking-wrapper"
      aria-label="Pick a Time Slot - Google Calendar View"
      style={{
        background: '#fff',
        border: '1px solid var(--figma-border)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Top Header Controls (Nút chuyển tuần & Thông tin ngày) */}
      <div
        className="gcal-header-bar"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div
          className="gcal-nav-buttons"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <button
            type="button"
            onClick={() => changeWeek(weekOffset - 1)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid var(--figma-border)',
              background: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--figma-text)',
            }}
            title="Tuần trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => changeWeek(0)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--figma-blue)',
              background: '#fff',
              color: 'var(--figma-blue)',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => changeWeek(weekOffset + 1)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid var(--figma-border)',
              background: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--figma-text)',
            }}
            title="Tuần sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {isLoading && (
            <span
              style={{
                fontSize: '13px',
                color: 'var(--figma-blue)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: '8px',
              }}
            >
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải candidate segments…
            </span>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            {dateRangeHeader}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--figma-muted)' }}>Asia/Ho_Chi_Minh</div>
        </div>
      </div>

      {/* Grid Google Calendar Tuần (Hiển thị các candidate segment theo vị trí & trạng thái rảnh / bị khóa) */}
      <div
        className="gcal-grid-scroll"
        style={{
          width: '100%',
          overflowX: 'auto',
          border: '1px solid var(--figma-border)',
          borderRadius: '12px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '55px repeat(7, minmax(0, 1fr))',
            width: '100%',
            minWidth: '680px',
            background: '#fff',
          }}
        >
          {/* Header hàng 1: Cột trống + 7 cột Ngày */}
          <div
            style={{
              padding: '8px 4px',
              borderBottom: '1px solid var(--figma-border)',
              borderRight: '1px solid var(--figma-border)',
              background: '#f8fafc',
            }}
          />
          {weekDays.map((day) => (
            <div
              key={day.dateStr}
              style={{
                padding: '8px 4px',
                textAlign: 'center',
                borderBottom: '1px solid var(--figma-border)',
                borderRight: '1px solid var(--figma-border)',
                background: '#f8fafc',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--figma-muted)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}
              >
                {day.shortLabel}
              </div>
              <div
                style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '1px' }}
              >
                {day.dayMonth}
              </div>
            </div>
          ))}

          {/* Phần Thân Lịch: Cột nhãn giờ Y-Axis & 7 Cột Ngày dạng container position relative */}
          <div style={{ gridColumn: '1', display: 'flex', flexDirection: 'column' }}>
            {gridHours.map((hourText) => (
              <div
                key={hourText}
                style={{
                  height: `${ROW_HEIGHT_PX}px`,
                  boxSizing: 'border-box',
                  padding: '4px 2px',
                  fontSize: '11px',
                  color: 'var(--figma-muted)',
                  textAlign: 'center',
                  borderBottom: '1px solid #f1f5f9',
                  borderRight: '1px solid var(--figma-border)',
                  fontWeight: '600',
                  background: '#fafafa',
                }}
              >
                {hourText}
              </div>
            ))}
          </div>

          {/* 7 Cột ngày chứa các đường kẻ ngang và các thẻ Candidate Segment được vẽ đè lên theo toạ độ */}
          {weekDays.map((day) => {
            const daySegments = segmentsByDay.get(day.dateStr) || [];
            const totalGridHeight = gridHours.length * ROW_HEIGHT_PX;

            return (
              <div
                key={day.dateStr}
                style={{
                  position: 'relative',
                  height: `${totalGridHeight}px`,
                  borderRight: '1px solid var(--figma-border)',
                  background: '#fff',
                }}
              >
                {/* Đường kẻ ngang ô làm nền cho từng giờ */}
                {gridHours.map((hourText) => (
                  <div
                    key={`${day.dateStr}_bg_${hourText}`}
                    style={{
                      height: `${ROW_HEIGHT_PX}px`,
                      boxSizing: 'border-box',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  />
                ))}

                {/* Thẻ Candidate Segment Lịch Rảnh / Blocked */}
                {daySegments.map((segmentItem, idx) => {
                  const startD = new Date(segmentItem.startTime);
                  const endD = segmentItem.endTime
                    ? new Date(segmentItem.endTime)
                    : new Date(startD.getTime() + 60 * 60 * 1000);

                  const startHours = startD.getHours() + startD.getMinutes() / 60;
                  const endHours = endD.getHours() + endD.getMinutes() / 60;

                  // Tính toạ độ Top và Height theo thời lượng thực tế của Candidate Segment
                  const topPx = Math.max(0, (startHours - startGridHour) * ROW_HEIGHT_PX);
                  const durationHours = Math.max(0.5, endHours - startHours); // Tối thiểu 30 phút
                  const heightPx = durationHours * ROW_HEIGHT_PX;

                  const startTimeStr = formatTimeHHmm(segmentItem.startTime);
                  const endTimeStr = formatTimeHHmm(segmentItem.endTime) || 'End';

                  const isBlocked =
                    segmentItem.isSelectable === false ||
                    Boolean(
                      segmentItem.blockedByAcceptedBooking ||
                      segmentItem.blockedBySameService ||
                      segmentItem.blockedByDifferentService ||
                      segmentItem.isBlocked,
                    );

                  const blockedReasonText =
                    segmentItem.reasonIfBlocked ||
                    segmentItem.bookingConflictNote ||
                    segmentItem.blockedReason ||
                    'Candidate segment này bị block bởi booking đã được chốt';

                  const keyId =
                    segmentItem.segmentId ||
                    segmentItem.candidateId ||
                    `${segmentItem.slotId}_${segmentItem.startTime}_${idx}`;

                  const isSelected =
                    !isBlocked &&
                    (value === segmentItem.segmentId ||
                      value === segmentItem.candidateId ||
                      value === segmentItem.slotId ||
                      value === `${day.dateStr}T${startTimeStr}` ||
                      value === segmentItem.startTime);

                  const serviceTitle =
                    segmentItem.title || selectedServiceName || 'Mentoring Session';

                  return (
                    <button
                      key={keyId}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => {
                        if (!isBlocked) {
                          onSelectSlot(segmentItem, `${day.dateStr}T${startTimeStr}`);
                        }
                      }}
                      title={isBlocked ? blockedReasonText : undefined}
                      style={{
                        position: 'absolute',
                        top: `${topPx + 2}px`,
                        height: `${Math.max(36, heightPx - 4)}px`,
                        left: '4px',
                        right: '4px',
                        zIndex: isSelected ? 20 : 10,
                        textAlign: 'left',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        cursor: isBlocked ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isBlocked ? 0.7 : 1,
                        border: isBlocked
                          ? '1px dashed #cbd5e1'
                          : isSelected
                            ? '2px solid var(--figma-blue)'
                            : '1px solid #93c5fd',
                        background: isBlocked
                          ? '#f1f5f9'
                          : isSelected
                            ? 'var(--figma-blue)'
                            : '#eff6ff',
                        color: isBlocked ? '#64748b' : isSelected ? '#ffffff' : '#0369a1',
                        boxShadow: isBlocked
                          ? 'none'
                          : isSelected
                            ? '0 6px 16px rgba(0,149,246,0.4)'
                            : '0 2px 6px rgba(147,197,253,0.3)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          lineHeight: '1.2',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {startTimeStr}–{endTimeStr}
                      </div>
                      {isBlocked && (
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            marginTop: '2px',
                            opacity: 0.85,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Bị khóa
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {!isLoading && !hasSelectableSegments && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '48px',
            padding: '12px 16px',
            border: '1px solid #dbeafe',
            borderRadius: '10px',
            background: '#f0f9ff',
            color: '#475569',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          <CalendarX2 size={18} color="#119CF7" aria-hidden="true" />
          Không còn lịch rảnh phù hợp với buổi chia sẻ này trong tuần đang xem.
        </div>
      )}
    </section>
  );
}
