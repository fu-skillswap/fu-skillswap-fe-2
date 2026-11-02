/**
 * @file MentorStepMocks.tsx
 * @description Static mini mocks of the mentor app screens, one per step of "Trở thành mentor trong
 * 6 bước". They reuse the in-app look (sky buttons, toggles, chips) with sample data only: nothing
 * inside is interactive, and fake controls are hidden from assistive tech.
 */

import { Check, FileText, Repeat, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  LANDING_SAMPLE_WALLET,
  SAMPLE_BOOKED_LABEL,
  SAMPLE_BOOKING_DETAIL,
  SAMPLE_EVIDENCE_FILES,
  SAMPLE_MENTOR_SERVICES,
  SAMPLE_REGISTRATION_CURRENT_STEP,
  SAMPLE_REGISTRATION_STEPS,
  SAMPLE_REVIEW_TIMELINE,
  SAMPLE_WEEK_DAYS,
  SAMPLE_WEEK_ROWS,
  SAMPLE_WEEK_TODAY_INDEX,
  type BecomeMentorStepId,
} from '@/components/domain/landing/becomeMentor.constants';

const MOCK_CARD =
  'flex flex-col rounded-[20px] bg-white shadow-[0_12px_32px_rgba(30,58,138,0.1)] font-site-body text-site-body';
const MOCK_TITLE = 'm-0 font-site-ui text-lg font-bold text-slate-900';
/** Look of an in-app button, rendered as a non-interactive span. */
const FAKE_BUTTON =
  'inline-flex min-h-10 items-center justify-center rounded-xl px-4 font-site-ui text-sm font-semibold whitespace-nowrap';
const STATUS_PILL = 'rounded-full px-2.5 py-1 text-[12.5px] font-semibold whitespace-nowrap';

function FakeButton({ children, outline }: { children: ReactNode; outline?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`${FAKE_BUTTON} ${
        outline
          ? 'border-[1.5px] border-solid border-site-chip-border text-site-navy'
          : 'bg-sky-700 text-white'
      }`}
    >
      {children}
    </span>
  );
}

function FakeToggle() {
  return (
    <span aria-hidden="true" className="relative h-5 w-[34px] shrink-0 rounded-full bg-sky-500">
      <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-white" />
    </span>
  );
}

function RegistrationMock() {
  return (
    <div className={`${MOCK_CARD} gap-4 p-[22px]`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={MOCK_TITLE}>Đăng ký làm mentor</p>
        <span className="text-[13px] text-site-muted">Thời gian hoàn thành: ~5 phút</span>
      </div>
      <ol
        aria-hidden="true"
        className="m-0 grid list-none grid-cols-5 gap-1.5 p-0 text-center text-[11.5px] text-site-muted"
      >
        {SAMPLE_REGISTRATION_STEPS.map((label, index) => {
          const isDone = index < SAMPLE_REGISTRATION_CURRENT_STEP;
          const isCurrent = index === SAMPLE_REGISTRATION_CURRENT_STEP;
          return (
            <li
              key={label}
              className={`flex flex-col items-center gap-1.5 ${isCurrent ? 'font-semibold text-site-ink' : ''}`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${
                  isDone
                    ? 'bg-sky-700 text-white'
                    : isCurrent
                      ? 'bg-site-blue text-white ring-4 ring-blue-100'
                      : 'border-[1.5px] border-solid border-site-line-strong font-normal'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
      <p className="m-0 flex items-center gap-2.5 rounded-xl bg-site-bubble px-3 py-2.5 text-[13px] text-site-navy">
        <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-site-blue" aria-hidden="true" />
        Minh chứng chỉ dùng để xác minh, không hiển thị công khai.
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {SAMPLE_EVIDENCE_FILES.map((file) => (
          <li
            key={file.name}
            className="flex items-center gap-3 rounded-xl border border-solid border-site-line px-3 py-2.5 text-[13.5px]"
          >
            <span
              aria-hidden="true"
              className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] text-[10px] font-bold ${
                file.kind === 'PDF' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-800'
              }`}
            >
              {file.kind}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate font-semibold text-slate-900">{file.name}</b>
              <span className="text-xs text-site-muted">{file.meta}</span>
            </span>
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
              Đã tải lên
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between gap-2.5">
        <FakeButton outline>Lưu nháp</FakeButton>
        <FakeButton>Tiếp tục</FakeButton>
      </div>
    </div>
  );
}

function ReviewMock() {
  return (
    <div className={`${MOCK_CARD} gap-[18px] p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={MOCK_TITLE}>Hồ sơ mentor của bạn</p>
        <span className={`${STATUS_PILL} bg-amber-100 text-amber-800`}>Đang xem xét</span>
      </div>
      <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
        {SAMPLE_REVIEW_TIMELINE.map((item) => (
          <li key={item.title} className="flex gap-3.5 text-sm leading-[21px]">
            <span
              aria-hidden="true"
              className={`mt-[3px] h-3.5 w-3.5 shrink-0 rounded-full ${
                item.done
                  ? 'bg-sky-500 ring-4 ring-sky-100'
                  : 'border-2 border-solid border-site-line-strong'
              }`}
            />
            <span>
              <b
                className={`block font-semibold ${item.done ? 'text-slate-900' : 'text-site-muted'}`}
              >
                {item.title}
              </b>
              <span className="text-site-muted">{item.meta}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="m-0 rounded-xl bg-slate-50 px-3.5 py-3 text-[13.5px] leading-5">
        Quản trị viên kiểm tra minh chứng sinh viên khớp họ tên, MSSV và minh chứng chuyên môn đúng
        lĩnh vực bạn đăng ký. AI không tự quyết định việc duyệt.
      </p>
    </div>
  );
}

function ServicesMock() {
  return (
    <div className="flex flex-col gap-3.5 font-site-body text-site-body">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0">
          <b className="block font-site-ui text-xl text-slate-900">Dịch vụ của tôi</b>
          <span className="text-[13px] text-site-muted">3 dịch vụ · 3 đang hoạt động</span>
        </p>
        <FakeButton>+ Thêm dịch vụ</FakeButton>
      </div>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3 p-0">
        {SAMPLE_MENTOR_SERVICES.map((service) => (
          <li
            key={service.name}
            className="flex flex-col gap-2.5 rounded-2xl border border-solid border-site-line bg-white p-4"
          >
            <div className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-site-bubble"
              >
                <FileText className="h-[18px] w-[18px] text-sky-500" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block font-site-ui text-[14.5px] leading-[19px] font-semibold text-slate-900">
                  {service.name}
                </b>
                <span className="text-xs text-site-muted">{service.meta}</span>
              </span>
              <FakeToggle />
            </div>
            <b className="font-site-ui text-[15px] text-sky-700">{service.price}</b>
          </li>
        ))}
      </ul>
      <p className="m-0 text-[13.5px] leading-5 text-site-muted">
        Gợi ý giá: buổi 30 phút 25.000–39.000 S-coins, buổi 60 phút 49.000–89.000 S-coins. Bạn có
        thể giữ 1 dịch vụ miễn phí ngắn để mentee làm quen.
      </p>
    </div>
  );
}

function AvailabilityMock() {
  return (
    <div className={`${MOCK_CARD} min-w-0 gap-3 p-[18px]`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span
          aria-hidden="true"
          className="inline-flex rounded-xl bg-slate-100 p-[3px] font-site-ui text-[13px] font-semibold"
        >
          <span className="rounded-[9px] bg-white px-3.5 py-[7px] text-sky-700">Lịch</span>
          <span className="px-3.5 py-[7px] text-site-muted">Lịch lặp</span>
        </span>
        <FakeButton>+ Thêm lịch rảnh</FakeButton>
      </div>
      {/* The grid keeps its width; the panel scrolls sideways on small screens. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] table-fixed border-separate border-spacing-0 overflow-hidden rounded-xl border border-solid border-site-line text-xs">
          <caption className="sr-only">Lịch rảnh mẫu trong tuần</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[52px] bg-slate-50">
                <span className="sr-only">Giờ</span>
              </th>
              {SAMPLE_WEEK_DAYS.map(({ day, date }, index) => (
                <th
                  key={day}
                  scope="col"
                  className={`px-1 py-2 text-center font-normal ${
                    index === SAMPLE_WEEK_TODAY_INDEX
                      ? 'bg-site-bubble text-sky-700'
                      : 'bg-slate-50 text-site-muted'
                  }`}
                >
                  {day}
                  <b className="block text-[13px]">{date}</b>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_WEEK_ROWS.map((row) => (
              <tr key={row.time}>
                <th
                  scope="row"
                  className="border-0 border-t border-solid border-slate-100 bg-slate-50 px-1.5 py-2.5 text-left font-normal text-site-muted"
                >
                  {row.time}
                </th>
                {row.cells.map((cell, index) => (
                  <td
                    key={`${row.time}-${index}`}
                    className="border-0 border-t border-l border-solid border-slate-100 p-[5px]"
                  >
                    {cell && (
                      <span
                        className={`block rounded-lg px-1 py-1.5 text-center text-[11px] font-semibold whitespace-nowrap ${
                          cell === SAMPLE_BOOKED_LABEL
                            ? 'bg-sky-700 text-white'
                            : 'border border-dashed border-sky-300 bg-site-bubble text-sky-700'
                        }`}
                      >
                        {cell}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 flex items-center gap-2 text-[13px] text-site-muted">
        <Repeat className="h-3.5 w-3.5 shrink-0 text-sky-700" aria-hidden="true" />
        Khung lặp hàng tuần, tô xanh là khung còn trống. Mentee chỉ đặt được trong các khung này.
      </p>
    </div>
  );
}

function BookingMock() {
  const detail = SAMPLE_BOOKING_DETAIL;
  return (
    <div className={`${MOCK_CARD} gap-3 p-5`}>
      <p className={MOCK_TITLE}>Chi tiết lịch đặt</p>
      <div className="flex flex-wrap justify-between gap-3 rounded-[14px] border border-solid border-blue-100 bg-site-bubble px-4 py-3.5">
        <p className="m-0">
          <span className="block text-[11.5px] tracking-[0.03em] text-site-muted">
            Dịch vụ mentoring
          </span>
          <b className="block font-site-ui text-[17px] text-slate-900">{detail.service}</b>
          <span className="text-[13.5px] text-site-muted">
            với <b className="text-slate-900">{detail.mentee}</b>
          </span>
        </p>
        <span
          className={`${STATUS_PILL} self-start border border-solid border-sky-300 bg-sky-100 text-sky-800`}
        >
          {detail.status}
        </span>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-2.5 text-[13px]">
        {detail.fields.map((field) => (
          <div
            key={field.label}
            className="rounded-xl border border-solid border-site-line px-3 py-2.5"
          >
            <dt className="text-site-muted">{field.label}</dt>
            <dd
              className={`m-0 font-bold ${'accent' in field ? 'text-sky-700' : 'text-slate-900'}`}
            >
              {field.value}
            </dd>
          </div>
        ))}
        <div className="col-span-2 rounded-xl border border-solid border-site-line px-3 py-2.5">
          <dt className="text-site-muted">Mục tiêu buổi mentoring</dt>
          <dd className="m-0 font-bold text-slate-900">{detail.goal}</dd>
        </div>
      </dl>
      <FakeButton>Mở liên kết buổi mentoring</FakeButton>
    </div>
  );
}

function PayoutMock() {
  return (
    <div className={`${MOCK_CARD} gap-3.5 p-[22px]`}>
      <p className="m-0 rounded-2xl bg-gradient-to-r from-sky-700 to-sky-600 px-5 py-[18px] text-white">
        <span className="block text-[13px] opacity-90">Số dư khả dụng</span>
        <b className="font-site-ui text-[30px] font-extrabold">{LANDING_SAMPLE_WALLET.available}</b>
      </p>
      <p className="m-0 text-[14.5px] leading-[22px]">
        Sau khi buổi học hoàn thành, S-coin được cộng vào ví. Xem đầy đủ giao dịch và cách rút tiền
        ngay bên dưới.
      </p>
      <a
        href="#vi-scoin"
        className="inline-flex min-h-11 items-center self-start font-site-ui text-sm font-semibold text-site-blue hover:text-site-navy"
      >
        Xem ví S-coin mẫu
      </a>
    </div>
  );
}

export const MENTOR_STEP_MOCKS: Record<BecomeMentorStepId, () => ReactNode> = {
  register: RegistrationMock,
  review: ReviewMock,
  services: ServicesMock,
  availability: AvailabilityMock,
  booking: BookingMock,
  payout: PayoutMock,
};
