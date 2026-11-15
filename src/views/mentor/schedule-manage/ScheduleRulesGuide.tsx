/**
 * @file ScheduleRulesGuide.tsx
 * @description "Quy chế đặt lịch" — explains how availability, weekly schedules, edits and
 * revocation work for mentors. Numbers come from the live scheduling APIs when available:
 * `GET /api/me/mentor-booking-policy`, `GET /api/me/mentor-scheduling-constraints`,
 * `GET /api/me/mentor-services/constraints`.
 */

import {
  CalendarClock,
  CalendarX2,
  Clock3,
  HelpCircle,
  Layers,
  PencilLine,
  Repeat,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface ScheduleRulesGuideProps {
  /** `minimumBookingLeadTimeMinutes` of the mentor booking policy. */
  leadTimeMinutes?: number;
  /** `maximumBookingHorizonDays` of the mentor booking policy. */
  horizonDays?: number;
  /** `maximumParentSlotDurationMinutes` of the scheduling constraints. */
  maxSlotMinutes?: number;
  /** `allowedDurationMinutes` of the mentor service constraints. */
  allowedDurations?: number[];
  timezone?: string;
}

function formatMinutes(minutes?: number) {
  if (minutes === undefined || minutes === null || !Number.isFinite(minutes)) return undefined;
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours >= 24 && rest === 0 && hours % 24 === 0) return `${hours / 24} ngày`;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-solid border-border-color bg-surface p-4">
      <h3 className="m-0 mb-2 flex items-center gap-2 text-base font-bold text-text-main">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-6 text-text-muted [&_strong]:text-text-main [&_ul]:m-0 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function ScheduleRulesGuide({
  leadTimeMinutes,
  horizonDays,
  maxSlotMinutes,
  allowedDurations = [],
  timezone,
}: ScheduleRulesGuideProps) {
  const leadTime = formatMinutes(leadTimeMinutes);
  const maxSlot = formatMinutes(maxSlotMinutes);
  const durations = allowedDurations.length
    ? [...allowedDurations]
        .sort((a, b) => a - b)
        .map((value) => `${value} phút`)
        .join(', ')
    : undefined;

  return (
    <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
      <p className="m-0 text-sm leading-6 text-text-muted">
        Tổng hợp cách SkillSwap xử lý lịch rảnh của bạn. Các con số bên dưới lấy trực tiếp từ cấu
        hình hiện tại của tài khoản.
      </p>

      <Section icon={Layers} title="1. Hai cách mở lịch rảnh">
        <ul>
          <li>
            <strong>Lịch rảnh lẻ</strong> (tab “Lịch” → “Thêm lịch rảnh”): mở một khung giờ cho một
            ngày cụ thể.
          </li>
          <li>
            <strong>Lịch lặp hằng tuần</strong> (tab “Lịch lặp” → “Tạo lịch hàng tuần”): chọn các
            thứ trong tuần, khung giờ, ngày bắt đầu/kết thúc áp dụng. Hệ thống tự tạo khung giờ cho
            từng tuần.
          </li>
          <li>
            Mỗi khung giờ phải gắn <strong>ít nhất một dịch vụ đang bật</strong>. Dịch vụ bị tạm
            dừng sẽ không được mentee nhìn thấy.
          </li>
        </ul>
      </Section>

      <Section icon={Clock3} title="2. Giới hạn thời gian">
        <ul>
          {maxSlot && (
            <li>
              Một khung giờ rảnh dài tối đa <strong>{maxSlot}</strong>.
            </li>
          )}
          {durations && (
            <li>
              Thời lượng một buổi tư vấn: <strong>{durations}</strong> (tùy dịch vụ).
            </li>
          )}
          <li>
            Mentee phải đặt trước ít nhất{' '}
            <strong>{leadTime ?? 'khoảng thời gian bạn cài đặt'}</strong> so với giờ bắt đầu, và chỉ
            đặt được trong vòng{' '}
            <strong>
              {horizonDays !== undefined ? `${horizonDays} ngày` : 'số ngày bạn cài đặt'}
            </strong>{' '}
            tới. Khung giờ ngoài khoảng này sẽ không hiện cho mentee.
          </li>
          <li>
            Giờ trên lịch tính theo múi giờ <strong>{timezone ?? 'Asia/Ho_Chi_Minh'}</strong>.
          </li>
        </ul>
      </Section>

      <Section icon={CalendarClock} title="3. Mentee đặt lịch trong khung giờ như thế nào">
        <ul>
          <li>
            Một khung giờ rảnh có thể gắn nhiều dịch vụ. Mentee chọn dịch vụ, rồi chọn giờ bắt đầu
            nằm gọn trong khung đó.
          </li>
          <li>
            Khi một buổi đã được chốt (đã thanh toán), phần thời gian đó bị khóa cho mọi dịch vụ
            khác, nên không thể bị đặt trùng.
          </li>
          <li>
            Yêu cầu đặt lịch mới ở trạng thái <strong>chờ bạn xác nhận</strong>. Bạn có thể chấp
            nhận hoặc từ chối trong mục “Lịch đặt”.
          </li>
        </ul>
      </Section>

      <Section icon={PencilLine} title="4. Sửa khung giờ rảnh">
        <ul>
          <li>
            Chỉ sửa được ngày giờ khi khung giờ <strong>chưa có buổi nào được chốt</strong>. Ghi chú
            vẫn có thể sửa nếu hệ thống cho phép.
          </li>
          <li>
            Nếu khung giờ đang có yêu cầu chờ xác nhận, hệ thống sẽ hỏi lại: tiếp tục nghĩa là{' '}
            <strong>các yêu cầu đó sẽ bị từ chối</strong>.
          </li>
          <li>
            Gặp thông báo “Lịch này vừa có thay đổi từ nơi khác” nghĩa là dữ liệu bạn đang xem đã cũ
            (ví dụ vừa có mentee đặt lịch). Trang sẽ tải lại, bạn kiểm tra rồi thao tác lại.
          </li>
        </ul>
      </Section>

      <Section icon={CalendarX2} title="5. Thu hồi lịch rảnh">
        <ul>
          <li>
            “Thu hồi lịch rảnh” làm khung giờ <strong>ngừng nhận booking mới</strong>. Đây là thao
            tác kết thúc, không hoàn tác được — muốn mở lại bạn cần tạo khung giờ mới.
          </li>
          <li>
            <strong>Không thể thu hồi</strong> khi khung giờ đã có buổi được chốt. Hãy xử lý buổi đó
            trong mục “Lịch đặt” trước.
          </li>
          <li>
            Nếu còn yêu cầu chờ xác nhận, bạn sẽ được hỏi lại; đồng ý thu hồi thì các yêu cầu này bị
            từ chối và mentee được thông báo.
          </li>
          <li>
            Khung giờ <strong>sinh ra từ lịch lặp hằng tuần</strong>: nếu chỉ muốn nghỉ một ngày,
            dùng tab “Lịch lặp” → mở lịch → “Bỏ qua một ngày”. Cách này có thể “Khôi phục” lại sau.
          </li>
        </ul>
      </Section>

      <Section icon={Repeat} title="6. Quản lý lịch lặp hằng tuần">
        <ul>
          <li>
            <strong>Bỏ qua một ngày</strong>: nghỉ đúng ngày đó, các tuần khác giữ nguyên. Có thể
            khôi phục.
          </li>
          <li>
            <strong>Tạm dừng</strong>: ngừng tạo khung giờ mới nhưng giữ cấu hình; bấm “Tiếp tục” để
            bật lại.
          </li>
          <li>
            <strong>Lưu trữ</strong>: dừng hẳn lịch lặp này. Chỉ dùng khi chắc chắn không cần nữa.
          </li>
          <li>Các buổi đã được đặt trước đó không bị ảnh hưởng khi bạn tạm dừng hay lưu trữ.</li>
        </ul>
      </Section>

      <Section icon={Settings2} title="7. Cài đặt lịch & Google Calendar">
        <ul>
          <li>
            Thay đổi trong “Cài đặt lịch” (thời gian đặt trước tối thiểu, số ngày mở lịch tối đa)
            chỉ áp dụng cho <strong>booking mới</strong>; booking đã tạo giữ nguyên.
          </li>
          <li>
            Không thể ngắt kết nối Google Calendar khi bạn còn dịch vụ đang bật hoặc còn buổi đã
            thanh toán sắp diễn ra.
          </li>
        </ul>
      </Section>

      <Section icon={HelpCircle} title="Câu hỏi thường gặp">
        <p className="m-0">
          <strong>Vì sao mentee không thấy lịch của tôi?</strong> Kiểm tra: khung giờ còn nằm trong
          khoảng đặt trước tối thiểu/tối đa, có gắn dịch vụ đang bật, và hồ sơ mentor đang được hiển
          thị công khai.
        </p>
        <p className="m-0">
          <strong>Vì sao không thu hồi được lịch?</strong> Khung giờ đã có buổi được chốt, dữ liệu
          trên trang đã cũ (tải lại trang), hoặc khung giờ thuộc lịch lặp hằng tuần — khi đó hãy
          dùng “Bỏ qua một ngày”.
        </p>
      </Section>
    </div>
  );
}
