/**
 * @file MentorDetail.tsx
 * @description Component Trang Hồ sơ chi tiết Mentor (Mentor Profile Detail Component).
 * Hiển thị tiểu sử, danh sách kỹ năng chuyên môn, chỉ số đánh giá và các gói dịch vụ tư vấn 1:1.
 */

import type { Mentor, MentorService } from "@/models/entities";
import { getMentorServices } from "@/data/demoMentorServices";
import { useAuth } from "@/providers/AuthProvider";
import { ChevronLeft } from "lucide-react";

/** Tạo chữ cái đầu tên cho avatar */
function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

/** Định dạng hiển thị mức giá S-Coins */
function priceLabel(price?: number) {
  return price ? new Intl.NumberFormat('en-US').format(price) : '—';
}

/** Props của MentorDetail Component */
interface MentorDetailProps {
  /** Chi tiết đối tượng Mentor */
  mentor: Mentor;
  /** Callback quay lại danh sách Mentor */
  onBack: () => void;
  /** Callback khi Mentee chọn một gói dịch vụ để đặt lịch */
  onBook: (service: MentorService) => void;
}

/**
 * Component hiển thị hồ sơ chi tiết Mentor kèm các gói dịch vụ tư vấn.
 */
export function MentorDetail({ mentor, onBack, onBook }: MentorDetailProps) {
  const services = getMentorServices(mentor);
  const { isAuthenticated, showAuthRequiredModal } = useAuth();

  const handleServiceClick = (service: MentorService) => {
    if (!isAuthenticated) {
      showAuthRequiredModal(
        'Bạn cần Đăng nhập hoặc Đăng ký tài khoản để xem chi tiết dịch vụ tư vấn 1:1 và đặt lịch.',
      );
      return;
    }
    onBook(service);
  };

  const handleProtectedTabClick = (featureName: string) => {
    if (!isAuthenticated) {
      showAuthRequiredModal(`Bạn cần Đăng nhập hoặc Đăng ký tài khoản để truy cập ${featureName}.`);
    }
  };

  return (
    <section className="figma-mentor-detail" aria-label={`${mentor.name} mentor profile`}>
      <button type="button" className="figma-detail-back" onClick={onBack}>
        <ChevronLeft aria-hidden="true" />
        Quay lại danh sách
      </button>
      <article className="figma-detail-profile-card">
        <div className="figma-detail-intro">
          <div className="figma-detail-avatar-wrap">
            <span className="figma-detail-avatar">{initials(mentor.name)}</span>
            <span aria-hidden="true" />
          </div>
          <div className="figma-detail-identity">
            <h2>{mentor.name}</h2>
            {mentor.headline && (
              <p className="figma-detail-headline">
                {mentor.headline}
                {mentor.organization && <> @ {mentor.organization}</>}
              </p>
            )}
            <div className="figma-detail-rating">
              <span aria-hidden="true">★★★★★</span>
              <strong>{mentor.rating}</strong>
              {mentor.reviewCount !== undefined && <small>({mentor.reviewCount} reviews)</small>}
            </div>
          </div>
          <div className="figma-detail-actions">
            <button type="button" onClick={() => handleProtectedTabClick('Nhắn tin với Mentor')}>
              Nhắn tin
            </button>
            <button type="button" onClick={() => handleProtectedTabClick('Theo dõi Mentor')}>
              Theo dõi
            </button>
          </div>
        </div>
        <div className="figma-detail-stats" aria-label="Mentor statistics">
          <div>
            <strong>—</strong>
            <span>Học viên</span>
          </div>
          <div>
            <strong>—</strong>
            <span>Khóa học</span>
          </div>
          <div>
            <strong>{mentor.rating} ★</strong>
            <span>Đánh giá</span>
          </div>
          <div>
            <strong>—</strong>
            <span>Phiên học</span>
          </div>
        </div>
        <div className="figma-detail-about">
          <p>{mentor.bio}</p>
          <div className="figma-detail-skills">
            {mentor.expertise.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </div>
      </article>
      <nav className="figma-detail-tabs" aria-label="Mentor profile sections">
        <span className="figma-detail-tab figma-detail-tab-active">Dịch vụ &amp; Lịch dạy</span>
        <button
          type="button"
          className="figma-detail-tab"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => handleProtectedTabClick('Blog của Mentor')}
        >
          Blog
        </button>
        <button
          type="button"
          className="figma-detail-tab"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => handleProtectedTabClick('Khóa học của Mentor')}
        >
          Khóa học
        </button>
      </nav>
      <section className="figma-detail-services" aria-label="One-to-one mentoring services">
        <h3>Dịch vụ tư vấn 1:1</h3>
        <div className="figma-detail-service-grid">
          {services.map((service) => (
            <article
              className="figma-detail-service-card"
              role="button"
              tabIndex={0}
              key={service.id}
              onClick={() => handleServiceClick(service)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleServiceClick(service);
                }
              }}
            >
              <div className="figma-detail-service-heading">
                <span className="figma-detail-service-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <rect x="5" y="4" width="14" height="16" rx="2" />
                    <path d="M8 8h8M8 12h8M8 16h5" />
                  </svg>
                </span>
                <h4>{service.name}</h4>
                <div>
                  <strong>{priceLabel(service.priceScoins)}</strong>
                  <small>S-coins</small>
                </div>
              </div>
              <p>{service.description}</p>
              <div className="figma-detail-service-meta">
                <span>◉ {service.durationMinutes} min</span>
                {service.completedCount !== undefined && (
                  <span>◉ {service.completedCount} done</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
