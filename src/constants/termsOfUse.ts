/**
 * @file termsOfUse.ts
 * @description Nội dung Điều khoản sử dụng và Chính sách hủy & hoàn tiền, hiện trong hộp thoại ở
 * trang thanh toán. Cho phép in đậm bằng `**chữ**`; email tự thành liên kết `mailto:`.
 * TODO(legal): have the team review this wording; add standalone pages for `terms` and
 * `bookingPolicy` in `publicSite.ts` when ready.
 */

import { SKILLSWAP_CONTACT_EMAIL } from '@/constants/contact';
import type { PrivacyBlock } from '@/constants/privacyPolicy';
import type { BookingCancellationRefundPolicy } from '@/models/auth';

export interface LegalSection {
  id: string;
  /** Includes the section number, e.g. "1. Tài khoản". */
  title: string;
  blocks: PrivacyBlock[];
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'pham-vi',
    title: '1. SkillSwap và phạm vi áp dụng',
    blocks: [
      {
        type: 'p',
        text: '**SkillSwap** là đơn vị vận hành nền tảng kết nối sinh viên (mentee) với mentor để học 1:1 trực tuyến. Khi dùng SkillSwap hoặc đặt lịch với mentor, bạn đồng ý với các điều khoản dưới đây.',
      },
    ],
  },
  {
    id: 'tai-khoan',
    title: '2. Tài khoản',
    blocks: [
      {
        type: 'list',
        items: [
          'Bạn đăng nhập bằng tài khoản Google (Gmail) của chính mình. Mỗi người chỉ dùng một tài khoản.',
          'Thông tin hồ sơ phải trung thực. Bạn chịu trách nhiệm về mọi hoạt động trên tài khoản của mình.',
          'SkillSwap có thể tạm khóa tài khoản vi phạm các quy định này.',
        ],
      },
    ],
  },
  {
    id: 'thanh-toan',
    title: '3. S-coins và thanh toán',
    blocks: [
      {
        type: 'list',
        items: [
          'Giá buổi học tính bằng S-coins và **đã gồm phí nền tảng**. Không có phí ẩn hay thuế cộng thêm.',
          'Thanh toán qua **PayOS**. Số tiền VND hiện trên trang PayOS trước khi bạn trả. SkillSwap không lưu số thẻ của bạn.',
          'S-coins được giữ lại cho đến khi buổi học hoàn tất, rồi mới chuyển cho mentor.',
          'Mỗi buổi học dùng được tối đa 1 mã giảm giá.',
        ],
      },
    ],
  },
  {
    id: 'buoi-hoc',
    title: '4. Đặt lịch và buổi học',
    blocks: [
      {
        type: 'list',
        items: [
          'Lịch hẹn chỉ được giữ khi bạn thanh toán trước hạn ghi ở trang thanh toán. Quá hạn, lịch hẹn tự hủy.',
          'Buổi học diễn ra trực tuyến theo nền tảng ghi trên lịch hẹn. Hãy vào phòng đúng giờ.',
          'Sau buổi học, bạn có **24 giờ** để xác nhận đã học hoặc báo sự cố. Quá 24 giờ, hệ thống tự xác nhận và chuyển S-coins cho mentor.',
          'Hủy lịch và hoàn tiền theo **Chính sách hủy & hoàn tiền**.',
        ],
      },
    ],
  },
  {
    id: 'hanh-vi',
    title: '5. Hành vi trên nền tảng',
    blocks: [
      {
        type: 'p',
        text: 'Bạn không được:',
      },
      {
        type: 'list',
        items: [
          'Quấy rối, xúc phạm, phân biệt đối xử hoặc đe dọa người khác.',
          'Đăng nội dung vi phạm pháp luật, lừa đảo, spam hoặc quảng cáo trái phép.',
          'Ghi âm, ghi hình hoặc chia sẻ nội dung buổi học khi chưa có sự đồng ý của người kia.',
          'Mạo danh người khác hoặc dùng tài khoản của người khác.',
        ],
      },
      {
        type: 'p',
        text: 'Bài viết và bình luận được AI kiểm tra trước khi hiển thị. Nội dung vi phạm có thể bị ẩn hoặc chặn.',
      },
    ],
  },
  {
    id: 'khieu-nai',
    title: '6. Khiếu nại',
    blocks: [
      {
        type: 'p',
        text: `Bấm "Báo sự cố" trong Booking của tôi hoặc gửi email tới ${SKILLSWAP_CONTACT_EMAIL}. Mentor có 24 giờ để phản hồi, sau đó SkillSwap ra quyết định trong 48 giờ.`,
      },
    ],
  },
  {
    id: 'thay-doi',
    title: '7. Thay đổi điều khoản',
    blocks: [
      {
        type: 'p',
        text: 'SkillSwap có thể cập nhật các điều khoản này. Lịch hẹn đã thanh toán áp dụng điều khoản tại thời điểm bạn thanh toán.',
      },
    ],
  },
];

function formatDeadline(minutes: number) {
  if (minutes % 1440 === 0) return `${minutes / 1440} ngày`;
  if (minutes % 60 === 0) return `${minutes / 60} giờ`;
  return `${minutes} phút`;
}

/** Refund policy built from the booking's own policy, so the numbers always match this booking. */
export function buildRefundSections(
  policy?: BookingCancellationRefundPolicy | null,
): LegalSection[] {
  const menteeBlocks: PrivacyBlock[] = policy
    ? [
        {
          type: 'table',
          columns: ['Khi bạn hủy', 'Được hoàn'],
          rows: [
            [
              `Trước giờ học hơn ${formatDeadline(policy.earlyMenteeCancellationDeadlineMinutes)}`,
              `**${policy.earlyMenteeRefundPercent}%** số S-coins đã trả`,
            ],
            [
              `Trong vòng ${formatDeadline(policy.earlyMenteeCancellationDeadlineMinutes)} trước giờ học`,
              `**${policy.lateMenteeRefundPercent}%** số S-coins đã trả`,
            ],
          ],
        },
      ]
    : [
        {
          type: 'note',
          tone: 'info',
          text: 'Mức hoàn khi bạn hủy phụ thuộc vào thời điểm hủy so với giờ học, xem mốc thời gian trong mục "Nếu bạn cần hủy" của lịch hẹn.',
        },
      ];

  return [
    {
      id: 'mentee-huy',
      title: '1. Khi bạn hủy lịch',
      blocks: [
        ...menteeBlocks,
        {
          type: 'p',
          text: 'Hủy lịch trong Booking của tôi. Hủy càng sớm, bạn được hoàn càng nhiều.',
        },
      ],
    },
    {
      id: 'mentor-huy',
      title: '2. Khi mentor hủy hoặc không vào buổi học',
      blocks: [
        {
          type: 'list',
          items: [
            `Mentor hủy lịch: bạn được hoàn **${policy?.mentorCancellationRefundPercent ?? 100}%**.`,
            `Mentor không vào buổi học: bạn được hoàn **${policy?.mentorNoShowRefundPercent ?? 100}%** sau khi báo sự cố.`,
          ],
        },
      ],
    },
    {
      id: 'nhan-tien',
      title: '3. Nhận tiền hoàn',
      blocks: [
        {
          type: 'p',
          text: 'S-coins được hoàn vào ví SkillSwap của bạn theo mức ở trên.',
        },
      ],
    },
    {
      id: 'su-co',
      title: '4. Buổi học có vấn đề',
      blocks: [
        {
          type: 'p',
          text: `Trong 24 giờ sau giờ học, bấm "Báo sự cố" trong Booking của tôi hoặc gửi email tới ${SKILLSWAP_CONTACT_EMAIL}. Mentor có 24 giờ để phản hồi, sau đó SkillSwap xem xét và quyết định mức hoàn trong 48 giờ.`,
        },
      ],
    },
  ];
}
