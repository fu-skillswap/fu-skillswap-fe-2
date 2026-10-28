/**
 * @file landing.constants.ts
 * @description Static copy and sample data for the public landing page (v2).
 */

/** Hero chips under the search box. `query: null` opens the find-mentor page without a keyword. */
export const HERO_QUICK_SEARCHES = [
  { label: 'DBI201', query: 'DBI201' },
  { label: 'ACC203', query: 'ACC203' },
  { label: 'PRF192', query: 'PRF192' },
  { label: 'MAE101', query: 'MAE101' },
  { label: 'OJT', query: 'OJT' },
  // The find-mentor page has a specialization filter but no keyword for it: open the page as is.
  { label: 'Chọn chuyên ngành', query: null },
] as const;

/**
 * Illustrative "KooKoo matched these mentors" cards for step 1 of "Cách hoạt động".
 * Fictional names: this is a picture of the feature, not live data.
 */
export const HOW_IT_WORKS_SAMPLE_MATCHES = [
  {
    initial: 'L',
    name: 'Lan Anh',
    subtitle: 'Sinh viên năm 4 | Phân tích dữ liệu, OJT',
    reason: 'Có kinh nghiệm thực tập Data Analysis, thành thạo Excel, Google Sheet, Power BI.',
    tags: ['Hệ thống thông tin', 'Công nghệ thông tin'],
    tone: 'blue',
  },
  {
    initial: 'M',
    name: 'Minh Khoa',
    subtitle: 'Java Spring · .NET',
    reason:
      'Có nền tảng Java Spring và .NET, hỗ trợ project và assignment, cùng ngành Kỹ thuật phần mềm.',
    tags: ['Kỹ thuật phần mềm', 'Công nghệ thông tin'],
    tone: 'navy',
  },
] as const;

/**
 * Mentor grid filter chips. The mentor API only has a free-text `keyword`, so chips filter the
 * loaded list client-side by matching these terms against headline, bio and expertise.
 * TODO(api): GET /api/mentors needs a subject/tag filter (course code, OJT, skill area).
 */
export const MENTOR_FILTERS = [
  { id: 'all', label: 'Tất cả', terms: [], query: '' },
  {
    id: 'dbi',
    label: 'DBI201',
    terms: ['dbi201', 'sql', 'database', 'cơ sở dữ liệu'],
    query: 'DBI201',
  },
  { id: 'acc', label: 'ACC203', terms: ['acc203', 'kế toán', 'accounting'], query: 'ACC203' },
  { id: 'prf', label: 'PRF192', terms: ['prf192', 'lập trình c'], query: 'PRF192' },
  { id: 'mae', label: 'MAE101', terms: ['mae101', 'toán'], query: 'MAE101' },
  { id: 'swp', label: 'SWP391', terms: ['swp391', 'swp'], query: 'SWP391' },
  {
    id: 'ojt',
    label: 'CV & phỏng vấn OJT',
    terms: ['ojt', 'cv', 'phỏng vấn', 'thực tập'],
    query: 'OJT',
  },
  { id: 'uiux', label: 'UI/UX', terms: ['ui/ux', 'ux', 'figma', 'thiết kế'], query: 'UI/UX' },
] as const;

export type MentorFilterId = (typeof MENTOR_FILTERS)[number]['id'];

/** 8 mentors + the "Chưa thấy người hợp?" card fill a 3×3 grid on desktop. */
export const LANDING_MENTOR_LIMIT = 8;

// TODO(copy): replace with KooKoo's real S-coin explanation once the wording is approved.
export const KOUKOU_DEMO_SCOIN_ANSWER =
  'S-coin là đơn vị SkillSwap dùng để trả cho buổi học: giá của từng dịch vụ hiện bằng S-coin ngay trên thẻ mentor. Cách nạp và quy đổi chi tiết mình sẽ cập nhật sớm nha.';

/** Canned Q&A for the landing's demo chat (local only, never calls the AI API). */
export const KOUKOU_DEMO_QA = [
  {
    id: 'find-mentor',
    question: 'Tìm mentor phù hợp với mục tiêu của mình',
    answer:
      'Bạn kể mình nghe mục tiêu nhé, ví dụ “ôn MAE101 trước PE” hay “chuẩn bị CV OJT”. Mình sẽ lọc mentor đã qua đúng phần đó và đánh dấu người hợp nhất.',
  },
  {
    id: 'how-to-book',
    question: 'Hướng dẫn cách đặt lịch với mentor',
    answer:
      '1. Mở hồ sơ mentor, bấm Xem lịch trống.\n2. Chọn một khung giờ còn trống.\n3. Xem tóm tắt rồi bấm Đặt lịch.\nBuổi học hiện trong Booking của tôi, có nút vào Google Meet.',
  },
  {
    id: 'scoin',
    question: 'Giải thích về S-coin và cách sử dụng',
    answer: KOUKOU_DEMO_SCOIN_ANSWER,
  },
  {
    id: 'skills',
    question: 'Gợi ý kỹ năng nên học dựa trên mục tiêu',
    answer:
      'Bạn đang học kỳ mấy và muốn đi hướng nào? Mình sẽ gợi ý kỹ năng nên ưu tiên và mentor có thể chia sẻ kinh nghiệm với bạn.',
  },
] as const;

export const KOUKOU_DEMO_GREETING =
  'Xin chào! 👋\nMình là KooKoo, trợ lý AI của SkillSwap. Mình có thể giúp gì cho bạn hôm nay?';

export const COMPARISON_ROWS = [
  {
    topic: 'Tìm người',
    facebook: 'Đăng bài, chờ comment',
    skillswap: 'Gõ mã môn, KooKoo AI gợi ý người hợp',
  },
  {
    topic: 'Biết người đó có hợp',
    facebook: 'Đoán qua avatar',
    skillswap: 'Hồ sơ ghi rõ khóa, ngành, lý do phù hợp',
  },
  { topic: 'Giá', facebook: 'Inbox hỏi từng người', skillswap: 'Hiện sẵn trên từng dịch vụ' },
  {
    topic: 'Hẹn lịch',
    facebook: 'Nhắn qua lại nhiều lần',
    skillswap: 'Chọn giờ trống, theo dõi tới lúc vào Meet',
  },
] as const;
