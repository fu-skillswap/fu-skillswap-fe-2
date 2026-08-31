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
    <article className="bg-white rounded-3xl p-6 border border-solid border-border-light/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-primary-border/80 transition-all duration-300 flex flex-col justify-between gap-5 h-full group">
      <div className="flex flex-col gap-3.5">
        {mentor.avatarUrl ? (
          <img
            src={mentor.avatarUrl}
            alt={mentor.name}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-light to-blue-100 border border-solid border-primary-border/60 object-cover shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/40 transition-all"
          />
        ) : (
          <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-light to-blue-100 text-primary font-black text-lg border border-solid border-primary-border/60 flex items-center justify-center shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/40 transition-all">
            {initials(mentor.name)}
          </span>
        )}
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-extrabold text-text-main m-0 flex items-center gap-1.5 tracking-tight group-hover:text-primary transition-colors">
            {mentor.name}
            {mentor.isVerified && (
              <span
                title="Đã xác thực Mentor"
                className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-primary text-white text-[10px] shadow-xs shrink-0"
              >
                ✓
              </span>
            )}
          </h2>
          <p className="text-xs text-text-muted m-0 leading-tight">
            {mentor.headline ?? (mentor.expertise[0] ? `${mentor.expertise[0]} mentor` : 'Mentor')}
          </p>
          {mentor.organization && <strong className="text-xs text-primary font-semibold">@ {mentor.organization}</strong>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-50/60 px-2.5 py-1 rounded-lg w-fit border border-solid border-amber-200/50">
          <span aria-hidden="true">★</span>
          <strong className="text-text-main">
            {mentor.rating !== null && mentor.rating !== undefined ? mentor.rating : '--'}
          </strong>
          {mentor.reviewCount !== undefined && <small className="text-text-muted font-normal">({mentor.reviewCount})</small>}
        </div>
        {mentor.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mentor.expertise.slice(0, 2).map((skill) => (
              <span key={skill} className="px-2.5 py-1 rounded-full bg-surface-subtle text-[11px] font-semibold text-text-secondary border border-solid border-border-color/80">
                {skill}
              </span>
            ))}
          </div>
        )}
        {price ? (
          <p className="text-xs text-text-muted m-0">
            From <strong className="text-sm font-black text-primary">{price}</strong> S-coins/30min
          </p>
        ) : (
          mentor.bio && <p className="text-xs text-text-muted line-clamp-2 m-0 leading-relaxed">{mentor.bio}</p>
        )}
      </div>
      <button type="button" className="w-full h-10 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs hover:shadow-md hover:shadow-primary/20 active:scale-[0.98] transition-all border-none cursor-pointer flex items-center justify-center" onClick={() => onSelect(mentor)}>
        View Profile
      </button>
    </article>
  );
}
