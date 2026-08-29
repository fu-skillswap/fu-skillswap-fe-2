'use client';

import type { PublicAvailabilitySlotResponse } from '@/models/auth';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
  /** Danh sách availability slots công khai trả về từ API (GET /api/mentors/{mentorUserId}/availability-slots) */
  slots?: PublicAvailabilitySlotResponse[];
  /** Service ID được chọn để lọc slot hỗ trợ */
  selectedServiceId?: string;
  /** Tên gói dịch vụ được chọn (dùng hiển thị trên thẻ event) */
  selectedServiceName?: string;
  /** Slot ISO string / slotId đang được chọn */
  value?: string;
  /** Callback khi người dùng click chọn slot */
  onSelectSlot: (slot: PublicAvailabilitySlotResponse, slotTimeStr: string) => void;
  /** Callback khi đổi khoảng ngày xem lịch tuần */
  onRangeChange?: (fromDate: string, toDate: string) => void;
  /** Cờ trạng thái đang tải slots từ API */
  isLoading?: boolean;
}

const ROW_HEIGHT_PX = 60; // Chiều cao mỗi ô 1 giờ trong bảng grid

/**
 * Component hiển thị Lịch dạng Google Calendar tuần (Pick a Time Slot - Google Calendar Weekly View).
 */
export function BookingCalendar({
  slots = [],
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

  // Lọc danh sách slots theo selectedServiceId nếu có
  const filteredSlots = useMemo(() => {
    if (!selectedServiceId) return slots;
    return slots.filter((s) => {
      if (!Array.isArray(s.services) || s.services.length === 0) return true;
      const matchesService = s.services.some(
        (srv) =>
          srv.serviceId === selectedServiceId ||
          selectedServiceId.includes(srv.serviceId) ||
          srv.serviceId.includes(selectedServiceId),
      );
      if (!matchesService && selectedServiceId.startsWith('service-')) return true;
      return matchesService;
    });
  }, [slots, selectedServiceId]);

  // Tính toán dải giờ hiển thị (mặc định từ 08:00 tới 21:00 hoặc tự mở rộng theo slots)
  const { gridHours, startGridHour } = useMemo(() => {
    let minHour = 8;
    let maxHour = 21;

    filteredSlots.forEach((s) => {
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
  }, [filteredSlots]);

  // Gom các slot theo từng ngày YYYY-MM-DD
  const slotsByDay = useMemo(() => {
    const map = new Map<string, PublicAvailabilitySlotResponse[]>();

    filteredSlots.forEach((slot) => {
      if (!slot.startTime) return;
      const d = new Date(slot.startTime);
      if (Number.isNaN(d.getTime())) return;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const existing = map.get(dateStr) || [];
      existing.push(slot);
      map.set(dateStr, existing);
    });

    return map;
  }, [filteredSlots]);

  return (
    <section className="gcal-booking-wrapper" aria-label="Pick a Time Slot - Google Calendar View" style={{ background: '#fff', border: '1px solid var(--figma-border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header Controls (Nút chuyển tuần & Thông tin ngày) */}
      <div className="gcal-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="gcal-nav-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => changeWeek(weekOffset - 1)}
            style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--figma-border)', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--figma-text)' }}
            title="Tuần trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => changeWeek(0)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--figma-blue)', background: '#fff', color: 'var(--figma-blue)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => changeWeek(weekOffset + 1)}
            style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--figma-border)', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--figma-text)' }}
            title="Tuần sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {isLoading && (
            <span style={{ fontSize: '13px', color: 'var(--figma-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải lịch…
            </span>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{dateRangeHeader}</div>
          <div style={{ fontSize: '12px', color: 'var(--figma-muted)' }}>Asia/Ho_Chi_Minh</div>
        </div>
      </div>

      {/* Grid Google Calendar Tuần (Hiển thị thẻ sự kiện theo vị trí & thời lượng chính xác) */}
      <div className="gcal-grid-scroll" style={{ width: '100%', overflowX: 'auto', border: '1px solid var(--figma-border)', borderRadius: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '55px repeat(7, minmax(0, 1fr))', width: '100%', minWidth: '680px', background: '#fff' }}>
          {/* Header hàng 1: Cột trống + 7 cột Ngày */}
          <div style={{ padding: '8px 4px', borderBottom: '1px solid var(--figma-border)', borderRight: '1px solid var(--figma-border)', background: '#f8fafc' }} />
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
              <div style={{ fontSize: '11px', color: 'var(--figma-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{day.shortLabel}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '1px' }}>{day.dayMonth}</div>
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

          {/* 7 Cột ngày chứa các đường kẻ ngang và các thẻ Event định vị chính xác theo thời lượng */}
          {weekDays.map((day) => {
            const daySlots = slotsByDay.get(day.dateStr) || [];
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

                {/* Các Thẻ Event Lịch Rảnh (Google Calendar Event Blocks) được vẽ đè lên theo toạ độ tuyệt đối */}
                {daySlots.map((slotItem) => {
                  const startD = new Date(slotItem.startTime);
                  const endD = slotItem.endTime ? new Date(slotItem.endTime) : new Date(startD.getTime() + 60 * 60 * 1000);

                  const startHours = startD.getHours() + startD.getMinutes() / 60;
                  const endHours = endD.getHours() + endD.getMinutes() / 60;

                  // Tính toạ độ Top và Height theo thời lượng thực tế của Slot
                  const topPx = Math.max(0, (startHours - startGridHour) * ROW_HEIGHT_PX);
                  const durationHours = Math.max(0.5, endHours - startHours); // Tối thiểu 30 phút
                  const heightPx = durationHours * ROW_HEIGHT_PX;

                  const startTimeStr = formatTimeHHmm(slotItem.startTime);
                  const endTimeStr = formatTimeHHmm(slotItem.endTime) || 'End';

                  const isSelected =
                    value === slotItem.slotId ||
                    value === `${day.dateStr}T${startTimeStr}` ||
                    value === slotItem.startTime;

                  const serviceTitle =
                    slotItem.services?.[0]?.title || selectedServiceName || 'Review CV cho OJT';

                  return (
                    <button
                      key={slotItem.slotId || slotItem.startTime}
                      type="button"
                      onClick={() => onSelectSlot(slotItem, `${day.dateStr}T${startTimeStr}`)}
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
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: isSelected ? '2px solid var(--figma-blue)' : '1px solid #93c5fd',
                        background: isSelected ? 'var(--figma-blue)' : '#eff6ff',
                        color: isSelected ? '#ffffff' : '#0369a1',
                        boxShadow: isSelected
                          ? '0 6px 16px rgba(0,149,246,0.4)'
                          : '0 2px 6px rgba(147,197,253,0.3)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: '700', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px', lineHeight: '1.2' }}>
                        <span style={{ fontSize: '10px', opacity: isSelected ? 0.9 : 0.8 }}>Lịch rảnh</span>
                        <span>{startTimeStr}–{endTimeStr}</span>
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          marginTop: '3px',
                          color: isSelected ? '#ffffff' : '#0284c7',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {serviceTitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
