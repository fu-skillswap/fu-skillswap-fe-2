/**
 * @file MentorDetail.tsx
 * @description Component Trang Hồ sơ chi tiết Mentor (Mentor Profile Detail Component).
 * Hiển thị tiểu sử, danh sách kỹ năng chuyên môn, chỉ số đánh giá và các gói dịch vụ tư vấn 1:1.
 */

import type { Mentor, MentorService } from '@/models/entities';
import { mentorDiscoveryRepo } from '@/repositories/mentorDiscoveryRepo';
import { mapApiMentorToEntity } from '@/repositories/mentorRepo';
import { useAuth } from '@/providers/AuthProvider';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  if (price === 0) return '0';
  return price ? new Intl.NumberFormat('en-US').format(price) : '—';
}

/** Props của MentorDetail Component */
interface MentorDetailProps {
  /** Chi tiết đối tượng Mentor ban đầu */
  mentor: Mentor;
  /** Mã mentorUserId được chọn từ danh sách mentors */
  mentorUserId?: string;
  /** Callback quay lại danh sách Mentor */
  onBack: () => void;
  /** Callback khi Mentee chọn một gói dịch vụ để đặt lịch */
  onBook: (service: MentorService) => void;
}

/**
 * Component hiển thị hồ sơ chi tiết Mentor (gọi API GET /api/mentors/{mentorUserId}) kèm các gói dịch vụ tư vấn.
 */
export function MentorDetail({ mentor, mentorUserId, onBack, onBook }: MentorDetailProps) {
  const targetUserId = mentorUserId || mentor.mentorUserId || mentor.id;
  const [currentMentor, setCurrentMentor] = useState<Mentor>(mentor);
  const [services, setServices] = useState<MentorService[]>([]);
  const [servicesError, setServicesError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isAuthenticated, showAuthRequiredModal } = useAuth();


  useEffect(() => {
    let isMounted = true;
    if (!targetUserId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setServicesError(undefined);

    void mentorDiscoveryRepo
      .getDetail(targetUserId)
      .then((detail: any) => {
        if (!isMounted) return;
        if (detail) {
          const apiMentorData = detail.mentor || detail;
          const mappedMentor = mapApiMentorToEntity(apiMentorData);
          if (mappedMentor.id || mappedMentor.name !== 'Mentor') {
            setCurrentMentor((prev) => ({
              ...prev,
              ...mappedMentor,
              name: mappedMentor.name !== 'Mentor' ? mappedMentor.name : prev.name,
              headline: mappedMentor.headline ?? prev.headline,
              bio: mappedMentor.bio || prev.bio,
              expertise: mappedMentor.expertise.length ? mappedMentor.expertise : prev.expertise,
              avatarUrl: mappedMentor.avatarUrl ?? prev.avatarUrl,
              rating: mappedMentor.rating,
              reviewCount: mappedMentor.reviewCount ?? prev.reviewCount,
            }));
          }
        }
        const rawServices = Array.isArray(detail?.services)
          ? detail.services
          : Array.isArray(detail?.mentor?.services)
            ? detail.mentor.services
            : Array.isArray(detail?.data?.services)
              ? detail.data.services
              : Array.isArray(detail)
                ? detail
                : [];
        if (Array.isArray(rawServices)) {
          setServices(
            rawServices
              .filter((service: any) => service && service.isActive !== false)
              .map((service: any) => ({
                id: String(service.serviceId || service.id || service.publicId || Math.random()),
                mentorId: String(service.mentorUserId || service.mentorId || targetUserId),
                name: String(service.title || service.name || service.serviceName || 'Dịch vụ tư vấn'),
                description: String(service.description || service.details || service.expectedOutcome || ''),
                durationMinutes: Number(service.durationMinutes || service.duration || 30),
                priceScoins:
                  typeof service.priceScoin === 'number'
                    ? service.priceScoin
                    : typeof service.priceScoins === 'number'
                      ? service.priceScoins
                      : typeof service.price === 'number'
                        ? service.price
                        : undefined,
                completedCount: typeof service.completedCount === 'number' ? service.completedCount : undefined,
              })),
          );
        }
      })
      .catch(() => {
        if (isMounted) setServicesError('Không thể tải hồ sơ chi tiết của mentor.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetUserId]);

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
    <section className="figma-mentor-detail" aria-label={`${currentMentor.name} mentor profile`}>
      <button type="button" className="figma-detail-back" onClick={onBack}>
        <ChevronLeft aria-hidden="true" />
        Quay lại danh sách
      </button>
      <article className="figma-detail-profile-card">
        <div className="figma-detail-intro">
          <div className="figma-detail-avatar-wrap">
            {currentMentor.avatarUrl ? (
              <img
                src={currentMentor.avatarUrl}
                alt={currentMentor.name}
                className="figma-detail-avatar"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <span className="figma-detail-avatar">{initials(currentMentor.name)}</span>
            )}
            <span aria-hidden="true" />
          </div>
          <div className="figma-detail-identity">
            <h2>{currentMentor.name}</h2>
            {currentMentor.headline && (
              <p className="figma-detail-headline">
                {currentMentor.headline}
                {currentMentor.organization && <> @ {currentMentor.organization}</>}
              </p>
            )}
            <div className="figma-detail-rating">
              <span aria-hidden="true">★★★★★</span>
              <strong>{currentMentor.rating !== null && currentMentor.rating !== undefined ? currentMentor.rating : '--'}</strong>
              {currentMentor.reviewCount !== undefined && <small>({currentMentor.reviewCount} reviews)</small>}
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
            <strong>{currentMentor.rating !== null && currentMentor.rating !== undefined ? `${currentMentor.rating} ★` : '--'}</strong>
            <span>Đánh giá</span>
          </div>
          <div>
            <strong>—</strong>
            <span>Phiên học</span>
          </div>
        </div>
        <div className="figma-detail-about">
          <p>{currentMentor.bio}</p>
          <div className="figma-detail-skills">
            {currentMentor.expertise.map((skill) => (
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
          {isLoading ? (
            <p>Đang tải danh sách dịch vụ...</p>
          ) : servicesError ? (
            <p className="error">{servicesError}</p>
          ) : !services.length ? (
            <p>Mentor chưa có dịch vụ đang hoạt động.</p>
          ) : null}
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
