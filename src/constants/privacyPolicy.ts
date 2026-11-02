/**
 * @file privacyPolicy.ts
 * @description Nội dung trang Chính sách bảo mật (`/[locale]/chinh-sach-bao-mat`).
 * Văn bản pháp lý được chép nguyên văn; không tự ý sửa câu chữ.
 * Cho phép in đậm bằng `**chữ**`; địa chỉ email trong văn bản tự thành liên kết `mailto:`.
 */

import { SKILLSWAP_CONTACT_EMAIL } from '@/constants/contact';

export type PrivacySectionId =
  | 'chung-toi-la-ai'
  | 'du-lieu-thu-thap'
  | 'muc-dich'
  | 'ai-xu-ly'
  | 'chia-se'
  | 'thoi-gian-luu'
  | 'xoa-tai-khoan'
  | 'quyen-cua-ban'
  | 'bao-ve'
  | 'do-tuoi'
  | 'thay-doi'
  | 'lien-he';

export type PrivacyBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'note'; tone: 'info' | 'warning'; text: string };

export interface PrivacySection {
  id: PrivacySectionId;
  /** Includes the section number, e.g. "1. Chúng tôi là ai". */
  title: string;
  blocks: PrivacyBlock[];
}

export const PRIVACY_POLICY_META = {
  updatedAt: '14/10/2026',
  effectiveFrom: '01/10/2026',
  contactEmail: SKILLSWAP_CONTACT_EMAIL,
} as const;

/** Subject line for account deletion requests (section 7). */
export const ACCOUNT_DELETION_EMAIL_SUBJECT = 'Yêu cầu xóa tài khoản SkillSwap';

/** The 5 bullets of "Đọc nhanh". */
export const PRIVACY_QUICK_READ: string[] = [
  'Bạn đăng nhập bằng Google. SkillSwap nhận họ tên, email và ảnh đại diện, **không bao giờ** nhận mật khẩu Gmail.',
  'Dữ liệu dùng để ghép bạn với mentor, đặt lịch, thanh toán và giữ cộng đồng an toàn. **Không bán, không dùng cho quảng cáo.**',
  'AI giúp kiểm duyệt bài viết, gợi ý mentor và trả lời trong khung chat KouKou. **Nội dung chat không được lưu lại.**',
  'Minh chứng xác minh mentor chỉ quản trị viên xem được và bị xóa 90 ngày sau khi có kết quả duyệt.',
  'Bạn có thể yêu cầu xóa tài khoản bất cứ lúc nào từ **Cài đặt → Quyền riêng tư** hoặc gửi email tới **skillswapvn.contact@gmail.com**, không cần cài ứng dụng.',
];

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: 'chung-toi-la-ai',
    title: '1. Chúng tôi là ai',
    blocks: [
      {
        type: 'p',
        text: 'SkillSwap là nền tảng kết nối sinh viên với mentor, gồm website skillswap.asia và ứng dụng SkillSwap trên Android (Google Play). SkillSwap do **Nhóm dự án SkillSwap** – sinh viên Trường Đại học FPT – xây dựng và vận hành. Tên nhà phát triển trên Google Play: **SKILLSWAP**. Nhóm là bên kiểm soát và xử lý dữ liệu cá nhân của bạn trên SkillSwap.',
      },
      {
        type: 'p',
        text: 'Liên hệ về dữ liệu cá nhân: **skillswapvn.contact@gmail.com**.',
      },
      {
        type: 'p',
        text: 'Chính sách này được xây dựng theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và áp dụng cho website skillswap.asia, ứng dụng SkillSwap trên Android cùng các dịch vụ đi kèm.',
      },
    ],
  },
  {
    id: 'du-lieu-thu-thap',
    title: '2. Dữ liệu chúng tôi thu thập',
    blocks: [
      {
        type: 'table',
        columns: ['Nhóm dữ liệu', 'Gồm những gì', 'Thu thập khi nào'],
        rows: [
          ['Tài khoản Google', 'Họ tên, email, ảnh đại diện', 'Khi bạn đăng nhập lần đầu'],
          [
            'Hồ sơ sinh viên',
            'Tên hiển thị, mã số sinh viên, cơ sở, ngành, chuyên ngành, học kỳ, năm nhập học, năm tốt nghiệp (nếu là cựu sinh viên), phần giới thiệu',
            'Khi bạn hoàn thiện hồ sơ',
          ],
          [
            'Hồ sơ mentor',
            'Kinh nghiệm, môn đã học và kết quả, dịch vụ và giá, liên kết GitHub, portfolio',
            'Khi bạn đăng ký làm mentor',
          ],
          [
            'Minh chứng xác minh mentor',
            'Ảnh hoặc file minh chứng là sinh viên/cựu sinh viên FPTU, minh chứng chuyên môn',
            'Khi bạn nộp hồ sơ mentor',
          ],
          [
            'Nội dung bạn tạo',
            'Câu hỏi, bài viết, bình luận, tin nhắn, đánh giá, báo cáo vi phạm',
            'Khi bạn đăng hoặc gửi',
          ],
          [
            'Đặt lịch và thanh toán',
            'Lịch hẹn, dịch vụ đã đặt, lịch sử giao dịch SCoin, mã giao dịch nạp tiền',
            'Khi bạn đặt lịch, nạp hoặc rút SCoin',
          ],
          [
            'Google Calendar (chỉ mentor tự kết nối)',
            'Quyền tạo sự kiện cho buổi học và xem khung giờ bận',
            'Khi mentor bấm kết nối Google Calendar',
          ],
          [
            'Dùng trợ lý AI',
            'Nội dung câu hỏi gửi cho KouKou; số token đã dùng; trích đoạn tối đa 500 ký tự nếu bạn bấm đánh giá câu trả lời',
            'Khi bạn dùng KouKou',
          ],
          [
            'Dữ liệu kỹ thuật',
            'Địa chỉ IP, loại trình duyệt hoặc thiết bị, thời điểm truy cập, nhật ký lỗi',
            'Khi bạn dùng website hoặc ứng dụng',
          ],
        ],
      },
      {
        type: 'p',
        text: 'SkillSwap **không** thu thập: mật khẩu Gmail, số thẻ hay số tài khoản ngân hàng (do PayOS xử lý), vị trí GPS, danh bạ.',
      },
      {
        type: 'p',
        text: 'Lưu trên trình duyệt hoặc thiết bị của bạn: trạng thái thu gọn thanh bên và bản nháp hồ sơ mentor, thông tin đăng nhập cần thiết. SkillSwap **không** dùng cookie quảng cáo hay công cụ theo dõi của bên thứ ba.',
      },
    ],
  },
  {
    id: 'muc-dich',
    title: '3. Chúng tôi dùng dữ liệu để làm gì',
    blocks: [
      {
        type: 'list',
        items: [
          'Tạo tài khoản và cho bạn đăng nhập bằng Google.',
          'Hiển thị hồ sơ mentor, gợi ý mentor phù hợp với mục tiêu học của bạn.',
          'Xác minh mentor là sinh viên hoặc cựu sinh viên FPTU và có chuyên môn như đã khai.',
          'Đặt lịch, nhắc lịch, thanh toán và giải ngân SCoin cho mentor.',
          'Kiểm duyệt nội dung, xử lý báo cáo vi phạm, chống gian lận và bảo vệ tài khoản.',
          'Trả lời câu hỏi qua KouKou và bot diễn đàn.',
          'Hỗ trợ khi bạn liên hệ.',
          'Cải thiện dịch vụ bằng số liệu tổng hợp, không gắn với từng người.',
        ],
      },
      {
        type: 'p',
        text: 'SkillSwap không bán dữ liệu cá nhân và không dùng dữ liệu của bạn cho quảng cáo.',
      },
    ],
  },
  {
    id: 'ai-xu-ly',
    title: '4. AI xử lý dữ liệu của bạn như thế nào',
    blocks: [
      {
        type: 'table',
        columns: ['Tính năng', 'AI đọc gì', 'Có lưu không'],
        rows: [
          [
            'Kiểm duyệt nội dung',
            'Tiêu đề và nội dung bài viết, bình luận mới',
            'Chỉ lưu kết quả chấm (cho đăng, cần xem lại, chặn)',
          ],
          [
            'Gợi ý mentor',
            'Mục tiêu học, hồ sơ của bạn và danh sách mentor',
            'Lưu thứ tự gợi ý 24 giờ',
          ],
          [
            'Chatbot KouKou',
            'Câu hỏi, các tin nhắn trước trong cùng cuộc trò chuyện, tài liệu hướng dẫn; lịch hẹn của chính bạn nếu bạn hỏi về lịch',
            '**Không lưu nội dung chat**',
          ],
          [
            'Bot diễn đàn',
            'Bài viết công khai chưa có ai trả lời sau 15 phút',
            'Câu trả lời được đăng công khai như một bình luận, có ghi rõ là trả lời tự động',
          ],
        ],
      },
      {
        type: 'list',
        items: [
          'Các model AI chạy qua dịch vụ FPT AI Factory của FPT Smart Cloud.',
          'Để tính chi phí và giới hạn số câu hỏi, hệ thống ghi số token đã dùng kèm **mã người dùng đã được mã hóa một chiều**, không ghi tên hay email.',
          '**AI không tự quyết định** việc duyệt mentor hay khóa tài khoản. Nội dung bị AI gắn cờ do quản trị viên xem lại.',
          'KouKou xem dữ liệu bằng quyền của chính bạn, nên không thấy được dữ liệu của người khác.',
        ],
      },
    ],
  },
  {
    id: 'chia-se',
    title: '5. Chúng tôi chia sẻ dữ liệu với ai',
    blocks: [
      {
        type: 'table',
        columns: ['Bên nhận', 'Dữ liệu', 'Để làm gì'],
        rows: [
          [
            'Người dùng khác trên SkillSwap',
            'Hồ sơ mentor công khai; bài viết, bình luận trên diễn đàn; tên hiển thị và ảnh trong buổi học đã đặt',
            'Để cộng đồng và buổi học hoạt động',
          ],
          [
            'Google',
            'Thông tin đăng nhập; sự kiện lịch (nếu mentor kết nối Calendar)',
            'Đăng nhập, đồng bộ lịch',
          ],
          ['PayOS', 'Số tiền, mã giao dịch', 'Xử lý nạp tiền'],
          ['FPT Smart Cloud (FPT AI Factory)', 'Nội dung gửi cho AI ở mục 4', 'Chạy tính năng AI'],
          ['Cloudflare', 'Dữ liệu kỹ thuật khi truy cập', 'Phân phối website, chống tấn công'],
          ['CÔNG TY TNHH DỮ LIỆU NHANH FAST BYTE', 'Toàn bộ dữ liệu hệ thống', 'Lưu trữ'],
          [
            'Neon',
            'Dữ liệu của dịch vụ AI: tài liệu hướng dẫn, nhật ký chi phí với mã người dùng đã mã hóa, đánh giá câu trả lời',
            'Lưu trữ cho dịch vụ AI',
          ],
          ['Cơ quan nhà nước có thẩm quyền', 'Dữ liệu được yêu cầu', 'Khi pháp luật bắt buộc'],
        ],
      },
      {
        type: 'p',
        text: '**Lưu ở đâu:** máy chủ và cơ sở dữ liệu chính của SkillSwap đặt tại Việt Nam. Google, Cloudflare và Neon có thể lưu hoặc xử lý dữ liệu ở nước ngoài. Chúng tôi chỉ gửi phần dữ liệu cần cho từng việc.',
      },
    ],
  },
  {
    id: 'thoi-gian-luu',
    title: '6. Chúng tôi giữ dữ liệu bao lâu',
    blocks: [
      {
        type: 'table',
        columns: ['Dữ liệu', 'Thời gian giữ'],
        rows: [
          ['Tài khoản, hồ sơ, tin nhắn', 'Đến khi bạn xóa tài khoản'],
          [
            'Minh chứng xác minh mentor',
            '90 ngày kể từ khi có kết quả duyệt; sau đó chỉ giữ kết quả',
          ],
          [
            'Bài viết, bình luận',
            'Đến khi bạn xóa. Khi xóa tài khoản, nội dung bị xóa hoặc chuyển thành "Người dùng đã xóa" để không làm hỏng các cuộc thảo luận',
          ],
          ['Giao dịch thanh toán', 'Theo thời hạn pháp luật về kế toán, thuế yêu cầu'],
          ['Nhật ký chi phí AI (mã đã mã hóa)', '12 tháng'],
          ['Nhật ký truy cập, lỗi', '90 ngày'],
        ],
      },
    ],
  },
  {
    id: 'xoa-tai-khoan',
    title: '7. Xóa tài khoản',
    blocks: [
      {
        type: 'p',
        text: 'Bạn có thể yêu cầu xóa tài khoản SkillSwap và dữ liệu đi kèm bằng một trong hai cách dưới đây. Cách 2 không cần cài hay mở ứng dụng.',
      },
      {
        type: 'steps',
        items: [
          '**Trong website hoặc ứng dụng:** vào **Cài đặt → Quyền riêng tư → Xóa tài khoản**, đọc những gì sẽ bị xóa rồi bấm **Gửi yêu cầu xóa**. Ứng dụng email mở sẵn thư gửi tới **skillswapvn.contact@gmail.com**, kèm email tài khoản. Bạn chỉ cần bấm gửi.',
          '**Không cần đăng nhập:** gửi email tới **skillswapvn.contact@gmail.com** từ đúng Gmail đã đăng ký, tiêu đề "Yêu cầu xóa tài khoản SkillSwap".',
          'Nhóm hỗ trợ trả lời trong **3 ngày làm việc** và khóa tài khoản của bạn.',
          'Dữ liệu được xóa vĩnh viễn sau **30 ngày** kể từ khi khóa. Trong 30 ngày này, trả lời thư để hủy yêu cầu.',
        ],
      },
      {
        type: 'p',
        text: 'Sẽ bị xóa: hồ sơ, tin nhắn, lịch sử đặt lịch, minh chứng xác minh. Bài viết và bình luận bị xóa hoặc chuyển thành "Người dùng đã xóa". Được giữ lại: lịch sử giao dịch thanh toán, trong thời hạn pháp luật về kế toán, thuế yêu cầu (xem mục 6).',
      },
      {
        type: 'p',
        text: 'Bạn chưa thể xóa tài khoản khi còn buổi học sắp diễn ra hoặc còn số dư SCoin chưa xử lý. Hãy hoàn tất hoặc hủy các buổi học và rút SCoin trước.',
      },
      {
        type: 'p',
        text: 'Chúng tôi chỉ xử lý yêu cầu gửi từ đúng địa chỉ Gmail đã đăng ký, để không ai xóa được tài khoản của người khác.',
      },
    ],
  },
  {
    id: 'quyen-cua-ban',
    title: '8. Quyền của bạn',
    blocks: [
      {
        type: 'p',
        text: 'Theo Luật Bảo vệ dữ liệu cá nhân, bạn có quyền:',
      },
      {
        type: 'list',
        items: [
          'Được biết dữ liệu nào đang được xử lý và vì sao.',
          'Xem và nhận bản sao dữ liệu của mình.',
          'Sửa thông tin sai trong Hồ sơ.',
          'Xóa dữ liệu hoặc xóa tài khoản.',
          'Rút lại sự đồng ý, ví dụ ngắt kết nối Google Calendar.',
          'Phản đối hoặc yêu cầu hạn chế việc xử lý.',
          'Khiếu nại, tố cáo hoặc khởi kiện theo quy định pháp luật.',
        ],
      },
      {
        type: 'p',
        text: 'Gửi yêu cầu tới **skillswapvn.contact@gmail.com**. Chúng tôi xác nhận đã nhận trong 3 ngày làm việc và xử lý trong thời hạn pháp luật quy định.',
      },
    ],
  },
  {
    id: 'bao-ve',
    title: '9. Chúng tôi bảo vệ dữ liệu thế nào',
    blocks: [
      {
        type: 'list',
        items: [
          'Mọi kết nối dùng HTTPS.',
          'Phiên đăng nhập giữ trên trình duyệt hoặc thiết bị của bạn, không lưu mật khẩu.',
          'Chỉ quản trị viên được phân quyền mới xem được minh chứng xác minh và báo cáo vi phạm.',
          'Nhật ký AI chỉ ghi mã người dùng đã mã hóa.',
          'Nếu xảy ra sự cố lộ lọt dữ liệu, chúng tôi thông báo cho bạn và cơ quan có thẩm quyền theo quy định.',
        ],
      },
    ],
  },
  {
    id: 'do-tuoi',
    title: '10. Độ tuổi',
    blocks: [
      {
        type: 'p',
        text: 'SkillSwap dành cho người từ **18 tuổi** trở lên. Nếu biết một tài khoản thuộc về người dưới 18 tuổi, chúng tôi sẽ khóa và xóa tài khoản đó.',
      },
    ],
  },
  {
    id: 'thay-doi',
    title: '11. Thay đổi chính sách',
    blocks: [
      {
        type: 'p',
        text: 'Khi có thay đổi quan trọng, chúng tôi thông báo trên website, trong ứng dụng và qua email ít nhất 7 ngày trước khi áp dụng. Ngày cập nhật luôn ghi ở đầu trang.',
      },
    ],
  },
  {
    id: 'lien-he',
    title: '12. Liên hệ',
    blocks: [
      { type: 'p', text: 'Nhóm dự án SkillSwap – Trường Đại học FPT' },
      { type: 'p', text: 'Email: **skillswapvn.contact@gmail.com**' },
    ],
  },
];
