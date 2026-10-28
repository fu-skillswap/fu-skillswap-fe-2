/**
 * @file becomeMentor.constants.ts
 * @description Copy and sample data for the landing "Dành cho mentor" section (#lam-mentor):
 * benefits, the 6-step stepper mocks and the sample S-coin wallet. Everything here is illustrative
 * (fictional names, fixed numbers); nothing is fetched from the API.
 */

/**
 * Hours a completed session's S-coin stays in "Chờ xác nhận" before it becomes withdrawable.
 * Confirmed by the team; the wallet API does not expose it yet.
 * TODO(api): read the hold period from the wallet/backend config once it is exposed.
 */
export const WITHDRAW_HOLD_HOURS = 24;

// TODO(copy): confirm the minimum withdrawal amount with the team.
export const WITHDRAW_MIN_SCOIN_LABEL = '50.000';

// TODO(copy): confirm how many working days a bank transfer takes.
export const WITHDRAW_PAYOUT_DAYS_LABEL = '1–3';

export const MENTOR_BENEFITS = [
  {
    id: 'income',
    title: 'Thu nhập từ môn mình giỏi',
    description:
      'Bạn tự đặt giá từng dịch vụ. Mentee trả bằng S-coin, bạn rút về tài khoản ngân hàng của mình.',
  },
  {
    id: 'schedule',
    title: 'Lịch do bạn quyết',
    description:
      'Chỉ mở những giờ bạn rảnh, lặp lại hàng tuần. Mentee chỉ đặt được vào đúng các giờ đó, không bị làm phiền ngoài giờ.',
  },
  {
    id: 'profile',
    title: 'Hồ sơ đẹp để ghi vào CV',
    description:
      'Huy hiệu mentor đã xác minh, số buổi đã chia sẻ và đánh giá từ mentee, dùng được khi ứng tuyển OJT hay đi làm.',
  },
  {
    id: 'commission',
    title: 'Nhận đủ 100% năm học này',
    description:
      'SkillSwap chưa thu phí nền tảng 15% trong năm học này. Mọi thay đổi được báo trước ít nhất 7 ngày.',
  },
] as const;

export type MentorBenefitId = (typeof MENTOR_BENEFITS)[number]['id'];

export const BECOME_MENTOR_STEPS = [
  {
    id: 'register',
    title: 'Đăng nhập Gmail, điền hồ sơ mentor',
    description:
      '5 bước, khoảng 5 phút, lưu nháp được. Tải minh chứng sinh viên FPTU và minh chứng chuyên môn.',
  },
  {
    id: 'review',
    title: 'Chờ quản trị viên duyệt',
    description: 'Hồ sơ được xem bởi người thật. Kết quả gửi qua thông báo và email, kèm lý do.',
  },
  {
    id: 'services',
    title: 'Tạo dịch vụ và đặt giá',
    description: 'Mỗi dịch vụ là một môn hoặc một việc cụ thể, có thời lượng và giá riêng.',
  },
  {
    id: 'availability',
    title: 'Mở lịch rảnh',
    description: 'Thêm khung giờ rảnh, đặt lặp hàng tuần, chọn dịch vụ áp dụng cho từng khung.',
  },
  {
    id: 'booking',
    title: 'Nhận lịch và chia sẻ',
    description: 'Mentee đặt vào giờ bạn mở. Bạn bấm Nhận lịch, rồi gặp mentee qua Google Meet.',
  },
  {
    id: 'payout',
    title: 'Nhận S-coin, rút về ngân hàng',
    description: 'Buổi học hoàn thành, S-coin vào ví. Rút về tài khoản ngân hàng khi bạn muốn.',
  },
] as const;

export type BecomeMentorStepId = (typeof BECOME_MENTOR_STEPS)[number]['id'];

/** Step 1 mock: the registration form's own 5-step header. */
export const SAMPLE_REGISTRATION_STEPS = [
  'Thông tin',
  'Kinh nghiệm',
  'Môn chia sẻ',
  'Minh chứng',
  'Gửi',
] as const;
export const SAMPLE_REGISTRATION_CURRENT_STEP = 3;

export const SAMPLE_EVIDENCE_FILES = [
  { name: 'Bảng điểm FPTU.pdf', kind: 'PDF', meta: 'Minh chứng sinh viên · 412 KB' },
  { name: 'Chứng chỉ SQL.jpg', kind: 'JPG', meta: 'Minh chứng chuyên môn · 1,2 MB' },
] as const;

export const SAMPLE_REVIEW_TIMELINE = [
  { title: 'Bạn gửi hồ sơ xác minh', meta: '26/10, 21:14', done: true },
  { title: 'Quản trị viên nhận xử lý hồ sơ', meta: '27/10, 09:02', done: true },
  {
    title: 'Kết quả: duyệt, yêu cầu bổ sung hoặc từ chối',
    meta: 'Luôn kèm ghi chú lý do, gửi qua thông báo và email',
    done: false,
  },
] as const;

export const SAMPLE_MENTOR_SERVICES = [
  { name: 'Ôn PE DBI201', meta: '60 phút · 1:1', price: '59.000 S-coins' },
  { name: 'Chữa đề SQL cấp tốc', meta: '30 phút · 1:1', price: '29.000 S-coins' },
  { name: 'Hỏi nhanh về chọn chuyên ngành', meta: '15 phút · 1:1', price: 'Miễn phí' },
] as const;

export const SAMPLE_WEEK_DAYS = [
  { day: 'T2', date: '26/10' },
  { day: 'T3', date: '27/10' },
  { day: 'T4', date: '28/10' },
  { day: 'T5', date: '29/10' },
  { day: 'T6', date: '30/10' },
  { day: 'T7', date: '31/10' },
  { day: 'CN', date: '01/11' },
] as const;
/** Highlighted column ("today") in the week grid mock. */
export const SAMPLE_WEEK_TODAY_INDEX = 2;
export const SAMPLE_BOOKED_LABEL = 'Đã đặt';

/** One row per start time; each cell is a slot label, `SAMPLE_BOOKED_LABEL` or empty. */
export const SAMPLE_WEEK_ROWS = [
  { time: '11:00', cells: ['11:00–12:30', '', '11:00–12:30', '11:00–12:30', '', '', ''] },
  { time: '19:30', cells: ['', '', '', '', '', '', ''] },
  {
    time: '20:00',
    cells: [
      '20:00–22:00',
      '20:00–22:00',
      '',
      SAMPLE_BOOKED_LABEL,
      '20:00–22:00',
      '',
      '09:00–11:00',
    ],
  },
] as const;

export const SAMPLE_BOOKING_DETAIL = {
  service: 'Ôn PE DBI201',
  mentee: 'Mai Linh',
  status: 'Sắp diễn ra',
  fields: [
    { label: 'Bắt đầu', value: 'Thứ 5, 29/10 · 20:00' },
    { label: 'Kết thúc', value: 'Thứ 5, 29/10 · 21:00' },
    { label: 'Nền tảng', value: 'Google Meet' },
    { label: 'Bạn nhận', value: '59.000 S-coins', accent: true },
  ],
  goal: 'Luyện câu JOIN và GROUP BY trước PE',
} as const;

export type WalletStatusTone = 'pending' | 'credited' | 'processing' | 'transferred';

/**
 * Sample wallet of a mentor after 2 weeks. Numbers stay consistent:
 * available 413.000 = withdrawable 354.000 + pending 59.000 (the 27/10 session, still on hold).
 */
export const LANDING_SAMPLE_WALLET = {
  available: '413.000 S-coins',
  withdrawable: '354.000 S-coins',
  pending: '59.000 S-coins',
  openRequests: '1 yêu cầu',
  bankAccount: 'Vietcombank •••• 4821',
  transactions: [
    {
      id: 'tx-1',
      direction: 'in',
      title: 'Buổi “Ôn PE DBI201” với Mai Linh',
      time: '27/10 · 21:05',
      amount: '+59.000 S-coins',
      status: 'Chờ xác nhận',
      tone: 'pending',
    },
    {
      id: 'tx-2',
      direction: 'in',
      title: 'Buổi “Chữa đề SQL cấp tốc” với Tuấn Kiệt',
      time: '25/10 · 20:40',
      amount: '+29.000 S-coins',
      status: 'Đã cộng',
      tone: 'credited',
    },
    {
      id: 'tx-3',
      direction: 'out',
      title: 'Rút về Vietcombank •••• 4821',
      time: '24/10 · 10:12',
      amount: '−200.000 S-coins',
      status: 'Đang xử lý',
      tone: 'processing',
    },
    {
      id: 'tx-4',
      direction: 'in',
      title: 'Buổi “Ôn PE DBI201” với Hải Yến',
      time: '22/10 · 21:03',
      amount: '+59.000 S-coins',
      status: 'Đã cộng',
      tone: 'credited',
    },
    {
      id: 'tx-5',
      direction: 'in',
      title: 'Buổi “Ôn PE DBI201” với Quang Minh',
      time: '20/10 · 21:02',
      amount: '+59.000 S-coins',
      status: 'Đã cộng',
      tone: 'credited',
    },
  ],
  withdrawals: [
    {
      id: 'wd-1',
      direction: 'out',
      title: 'Rút 200.000 S-coins về Vietcombank •••• 4821',
      time: 'Gửi 24/10 · 10:12',
      amount: '−200.000 S-coins',
      status: 'Đang xử lý',
      tone: 'processing',
    },
    {
      id: 'wd-2',
      direction: 'out',
      title: 'Rút 150.000 S-coins về Vietcombank •••• 4821',
      time: 'Gửi 15/10 · 09:30',
      amount: '−150.000 S-coins',
      status: 'Đã chuyển',
      tone: 'transferred',
    },
  ],
} as const satisfies Record<'transactions' | 'withdrawals', readonly SampleWalletEntry[]> &
  Record<string, unknown>;

export interface SampleWalletEntry {
  id: string;
  direction: 'in' | 'out';
  title: string;
  time: string;
  amount: string;
  status: string;
  tone: WalletStatusTone;
}

export const WALLET_HOW_TO_STEPS = [
  {
    title: 'Thêm tài khoản nhận tiền',
    description:
      'Vào Ví S-coins, bấm Thêm tài khoản và nhập tài khoản ngân hàng đứng tên bạn. Chỉ cần làm một lần.',
  },
  {
    title: 'Hoàn thành buổi học',
    description: `S-coin của buổi học vào mục Chờ xác nhận. Sau ${WITHDRAW_HOLD_HOURS} giờ được xác nhận, số S-coin này chuyển sang Có thể rút.`,
  },
  {
    title: 'Bấm Rút tiền',
    description: `Nhập số S-coin muốn rút (tối thiểu ${WITHDRAW_MIN_SCOIN_LABEL}). Tiền về tài khoản trong ${WITHDRAW_PAYOUT_DAYS_LABEL} ngày làm việc, theo dõi ở tab Yêu cầu rút.`,
  },
] as const;
