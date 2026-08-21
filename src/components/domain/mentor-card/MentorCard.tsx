/**
 * @file MentorCard.tsx
 * @description Component Thẻ hiển thị tóm tắt thông tin Chuyên gia (Mentor Card Component).
 * Hiển thị tên, lĩnh vực chuyên môn, đánh giá sao, mức giá tham khảo và nút xem hồ sơ chi tiết.
 */

import type { Mentor } from '@/models/entities';

/** Tạo chữ cái đầu từ tên làm avatar */
function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

/** Định dạng hiển thị giá điểm S-Coins */
function priceLabel(price?: number) {
  return price ? new Intl.NumberFormat('en-US').format(price) : undefined;
}

/** Props của MentorCard Component */
interface MentorCardProps {
  /** Thông tin đối tượng Mentor */
  mentor: Mentor;
  /** Callback khi Mentee bấm nút xem hồ sơ Mentor */
  onSelect: (mentor: Mentor) => void;
}

/**
 * Component hiển thị thẻ thông tin Mentor trên giao diện danh sách tìm kiếm.
 */
export function MentorCard({ mentor, onSelect }: MentorCardProps) {
  const price = priceLabel(mentor.startingPrice);

  return (
    <article className="figma-mentor-card">
      <span className="figma-mentor-avatar">{initials(mentor.name)}</span>
      <div className="figma-mentor-card-heading">
        <h2>{mentor.name}</h2>
        <p>{mentor.headline ?? `${mentor.expertise[0] ?? 'Skill'} mentor`}</p>
        {mentor.organization && <strong>@ {mentor.organization}</strong>}
      </div>
      <div className="figma-mentor-rating">
        <span aria-hidden="true">★</span>
        <strong>{mentor.rating}</strong>
        {mentor.reviewCount !== undefined && <small>({mentor.reviewCount})</small>}
      </div>
      <div className="figma-mentor-skills">
        {mentor.expertise.slice(0, 2).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      {price ? (
        <p className="figma-mentor-price">
          From <strong>{price}</strong> S-coins/30min
        </p>
      ) : (
        <p className="figma-mentor-bio">{mentor.bio}</p>
      )}
      <button type="button" className="figma-mentor-book" onClick={() => onSelect(mentor)}>
        View Profile
      </button>
    </article>
  );
}
