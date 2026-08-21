import type { Mentor, MentorService } from '@/models/entities';
import { getMentorServices } from '@/data/demoMentorServices';

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

function priceLabel(price?: number) {
  return price ? new Intl.NumberFormat('en-US').format(price) : '—';
}

export function MentorDetail({
  mentor,
  onBack,
  onBook,
}: {
  mentor: Mentor;
  onBack: () => void;
  onBook: (service: MentorService) => void;
}) {
  const services = getMentorServices(mentor);

  return (
    <section className="figma-mentor-detail" aria-label={`${mentor.name} mentor profile`}>
      <button type="button" className="figma-detail-back" onClick={onBack}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
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
            <button type="button" aria-disabled="true">
              Nhắn tin
            </button>
            <button type="button" aria-disabled="true">
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
        <span className="figma-detail-tab" aria-disabled="true">
          Blog
        </span>
        <span className="figma-detail-tab" aria-disabled="true">
          Khóa học
        </span>
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
              onClick={() => onBook(service)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onBook(service);
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
