/**
 * @file landingFaq.ts
 * @description Nội dung FAQ công khai của landing page và trạng thái xác nhận nghiệp vụ.
 */

import { PLATFORM_FEE_NOTE } from '@/constants/pricing';

export interface LandingFaqItem {
  id: string;
  question: string;
  answer: string;
  isConfirmed: boolean;
}

export interface LandingFaqGroup {
  id: string;
  title: string;
  items: LandingFaqItem[];
}

export const LANDING_FAQ_GROUPS: LandingFaqGroup[] = [
  {
    id: 'getting-started',
    title: 'Bắt đầu với SkillSwap',
    items: [
      {
        id: 'who-is-skillswap-for',
        question: 'SkillSwap phù hợp với ai?',
        answer:
          'SkillSwap dành cho người muốn học kỹ năng thực tế cùng mentor và người có kinh nghiệm muốn chia sẻ kiến thức. Mentee có thể xem hồ sơ, dịch vụ và mức giá trước khi quyết định đặt lịch.',
        isConfirmed: true,
      },
      {
        id: 'what-can-mentee-learn',
        question: 'Mentee có thể học những gì?',
        answer:
          'Bạn có thể tìm các buổi học 1:1 hoặc khóa học ngắn do mentor công khai. Hãy xem chuyên môn, nội dung, thời lượng và mục tiêu của từng dịch vụ để chọn lựa phù hợp.',
        isConfirmed: true,
      },
      {
        id: 'find-suitable-mentor',
        question: 'Làm thế nào để tìm mentor phù hợp?',
        answer:
          'Vào trang tìm mentor, tìm theo từ khóa hoặc chuyên môn rồi mở hồ sơ để xem kinh nghiệm và dịch vụ. Bạn nên so sánh nội dung, thời lượng và giá của nhiều mentor trước khi đặt lịch.',
        isConfirmed: true,
      },
      {
        id: 'mentor-registration',
        question: 'Mentor đăng ký như thế nào?',
        answer:
          'Chọn đăng ký làm mentor, hoàn thiện hồ sơ chuyên môn và gửi thông tin theo hướng dẫn trên hệ thống. Sau khi hồ sơ đủ điều kiện hoạt động, bạn có thể tạo dịch vụ, đặt lịch và mức giá riêng.',
        isConfirmed: true,
      },
      {
        id: 'price-visibility',
        question: 'Giá được hiển thị ra sao?',
        answer:
          'Mỗi mentor tự đặt giá và thời lượng cho từng dịch vụ. Giá được hiển thị trên hồ sơ mentor và trong bước đặt lịch để bạn kiểm tra trước khi thanh toán.',
        isConfirmed: true,
      },
    ],
  },
  {
    id: 'pricing-and-payment',
    title: 'Giá và thanh toán',
    items: [
      {
        id: 'who-sets-price',
        question: 'Ai quyết định giá của một buổi học?',
        answer:
          'Từng mentor tự quyết định mức giá cho dịch vụ của mình, không phải một bảng giá cố định của SkillSwap. Bạn luôn có thể xem giá và thời lượng trước khi gửi yêu cầu đặt lịch.',
        isConfirmed: true,
      },
      {
        id: 'why-prices-differ',
        question: 'Vì sao giá giữa các mentor khác nhau?',
        answer:
          'Mỗi mentor có kinh nghiệm, chuyên môn, thời lượng và cách tổ chức dịch vụ khác nhau nên mức giá có thể khác nhau. Bạn nên đọc kỹ thông tin dịch vụ và chọn mức phù hợp với nhu cầu của mình.',
        isConfirmed: true,
      },
      {
        id: 'filter-by-budget',
        // TODO: Bổ sung bộ lọc khoảng giá trên mentor-booking rồi cập nhật câu trả lời này.
        question: 'Tôi có thể tìm mentor theo mức giá phù hợp ngân sách không?',
        answer:
          'Hiện trang tìm mentor hỗ trợ tìm theo từ khóa và chuyên môn, chưa có bộ lọc theo khoảng giá. Bạn có thể mở hồ sơ mentor để xem giá từng dịch vụ và so sánh trước khi đặt lịch.',
        isConfirmed: true,
      },
      {
        id: 'payment-method-and-charge-time',
        question: 'Tôi thanh toán bằng hình thức nào, và khi nào bị trừ tiền?',
        // TODO: Xác nhận phương thức thanh toán và thời điểm ghi nhận/trừ tiền thực tế.
        answer:
          'Phương thức thanh toán khả dụng sẽ được hiển thị tại bước thanh toán. Chính sách về thời điểm trừ tiền đang chờ xác nhận; bạn nên kiểm tra đầy đủ thông tin trên màn hình trước khi tiếp tục.',
        isConfirmed: false,
      },
      {
        id: 'additional-platform-fees',
        question: 'Có phát sinh chi phí nào ngoài giá hiển thị không?',
        // TODO: Xác nhận chính sách phí nền tảng và cập nhật PLATFORM_FEE_NOTE.
        answer: PLATFORM_FEE_NOTE
          ? `${PLATFORM_FEE_NOTE} Hãy kiểm tra tổng số tiền hiển thị tại bước thanh toán trước khi xác nhận.`
          : 'Chính sách phí nền tảng chưa được xác nhận nên SkillSwap chưa thể khẳng định có hay không có khoản phí bổ sung. Hãy kiểm tra tổng số tiền ở bước thanh toán hoặc liên hệ SkillSwap trước khi xác nhận.',
        isConfirmed: Boolean(PLATFORM_FEE_NOTE),
      },
    ],
  },
  {
    id: 'learning-sessions',
    title: 'Buổi học',
    items: [
      {
        id: 'session-location',
        question: 'Buổi học diễn ra ở đâu?',
        answer:
          'Buổi học có thể diễn ra trực tuyến hoặc trực tiếp, tùy hình thức được mentor xác nhận cho booking. Với buổi trực tuyến, đường dẫn và nền tảng học; với buổi trực tiếp, địa điểm sẽ được hiển thị trong thông tin booking khi đã thiết lập.',
        isConfirmed: true,
      },
      {
        id: 'reschedule-cancel-refund',
        question: 'Tôi có thể hủy hoặc đổi lịch không? Có được hoàn tiền không?',
        // TODO: Xác nhận thời hạn hủy/đổi lịch và điều kiện hoàn tiền thực tế.
        answer:
          'Hệ thống có hỗ trợ thao tác hủy đối với booking đủ điều kiện, nhưng thời hạn hủy, cách đổi lịch và quyền hoàn tiền chưa được xác nhận thành chính sách công khai. Hãy kiểm tra trạng thái booking và liên hệ SkillSwap trước khi thực hiện nếu bạn cần biết ảnh hưởng đến khoản đã thanh toán.',
        isConfirmed: false,
      },
      {
        id: 'session-not-as-expected',
        question: 'Nếu buổi học không như mong đợi thì sao?',
        // TODO: Xác nhận quy trình tiếp nhận, thời hạn và cách xử lý khiếu nại thực tế.
        answer:
          'Bạn có thể dùng chức năng báo cáo vấn đề trên booking nếu chức năng này khả dụng cho trạng thái hiện tại. Quy trình xem xét và hướng giải quyết đang chờ xác nhận chính sách; hãy mô tả rõ vấn đề và lưu lại thông tin liên quan để được hỗ trợ.',
        isConfirmed: false,
      },
    ],
  },
  {
    id: 'for-mentors',
    title: 'Dành cho mentor',
    items: [
      {
        id: 'mentor-price-management',
        question: 'Tôi tự đặt giá như thế nào và có thể đổi giá sau không?',
        answer:
          'Mentor nhập mức giá và thời lượng khi tạo hoặc chỉnh sửa từng dịch vụ. Việc thay đổi áp dụng trên thông tin dịch vụ; giá của booking đã tạo được lưu theo thời điểm đặt để tránh làm thay đổi thỏa thuận trước đó.',
        isConfirmed: true,
      },
      {
        id: 'mentor-payout-time',
        question: 'Khi nào tôi nhận được tiền?',
        // TODO: Xác nhận điều kiện ghi nhận doanh thu, thời gian khả dụng và lịch chi trả cho mentor.
        answer:
          'Thời điểm doanh thu được ghi nhận và đủ điều kiện rút đang chờ xác nhận chính sách thực tế. Mentor nên kiểm tra khu vực ví và yêu cầu rút tiền trong tài khoản, hoặc liên hệ SkillSwap trước khi lên kế hoạch nhận tiền.',
        isConfirmed: false,
      },
      {
        id: 'mentor-verification',
        question: 'Mentor được xác minh thế nào?',
        // TODO: Xác nhận tiêu chí, giấy tờ và thời gian xử lý hồ sơ xác minh mentor.
        answer:
          'Mentor gửi hồ sơ để đội ngũ quản trị xem xét và có thể được yêu cầu bổ sung thông tin. Tiêu chí, giấy tờ bắt buộc và thời gian xử lý đang chờ chính sách chính thức, vì vậy trạng thái trên hồ sơ là nguồn thông tin cần theo dõi.',
        isConfirmed: false,
      },
    ],
  },
];

export const CONFIRMED_LANDING_FAQS = LANDING_FAQ_GROUPS.flatMap(({ items }) => items).filter(
  ({ isConfirmed }) => isConfirmed,
);
