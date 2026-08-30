/**
 * @file MentorDetail.tsx
 * @description Component Trang Hồ sơ chi tiết Mentor (Mentor Profile Detail Component).
 * Hiển thị tiểu sử, danh sách kỹ năng chuyên môn, chỉ số đánh giá và các gói dịch vụ tư vấn 1:1.
 */

import type { Mentor, MentorService } from '@/models/entities';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type {
  MentorAchievementResponse,
  MentorProjectResponse,
  MentorReviewResponse,
} from '@/models/auth';
import { mentorDiscoveryRepo } from '@/repositories/mentorDiscoveryRepo';
import { mapApiMentorToEntity } from '@/repositories/mentorRepo';
import { useAuth } from '@/providers/AuthProvider';
import { showError } from '@/utils/toast';
import {
  AlertCircle,
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ExternalLink,
  GitBranch,
  Globe,
  Heart,
  Star,
  Trophy,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

function formatReviewDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
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
  const [projects, setProjects] = useState<MentorProjectResponse[]>([]);
  const [achievements, setAchievements] = useState<MentorAchievementResponse[]>([]);
  const [githubUrl, setGithubUrl] = useState<string>();
  const [portfolioUrl, setPortfolioUrl] = useState<string>();
  const [reviews, setReviews] = useState<MentorReviewResponse[]>([]);
  const [reviewsError, setReviewsError] = useState(false);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const servicesRef = useRef<HTMLElement>(null);
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
      .then((detail) => {
        if (!isMounted) return;
        if (detail) {
          const mappedMentor = mapApiMentorToEntity(detail);
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
          setProjects(detail.evidence?.featuredProjects ?? []);
          setAchievements(detail.evidence?.achievements ?? []);
          setGithubUrl(detail.evidence?.githubUrl || undefined);
          setPortfolioUrl(detail.evidence?.portfolioUrl || undefined);
        }
        setServices(
          detail.services
            .filter((service) => service.isActive !== false)
            .map((service) => ({
              id: service.serviceId,
              mentorId: targetUserId,
              name: service.title,
              description: service.description || service.expectedOutcome || '',
              durationMinutes: service.durationMinutes,
              priceScoins: service.isFree ? 0 : (service.priceScoin ?? undefined),
            })),
        );
      })
      .catch(() => {
        if (isMounted) setServicesError('Không thể tải hồ sơ chi tiết của mentor.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    setIsReviewsLoading(true);
    setReviewsError(false);
    void mentorDiscoveryRepo
      .getReviews(targetUserId)
      .then((page) => {
        if (isMounted) setReviews(page.content ?? []);
      })
      .catch(() => {
        if (isMounted) setReviewsError(true);
      })
      .finally(() => {
        if (isMounted) setIsReviewsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetUserId]);

  useEffect(() => {
    if (!isAuthenticated || !targetUserId) {
      setIsFollowing(false);
      return;
    }

    let isMounted = true;
    void mentorDiscoveryRepo
      .getFollowing()
      .then((result) => {
        if (isMounted) setIsFollowing(result.mentors.some((item) => item.id === targetUserId));
      })
      .catch(() => {
        if (isMounted) setIsFollowing(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, targetUserId]);

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

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      showAuthRequiredModal('Bạn cần đăng nhập hoặc đăng ký tài khoản để theo dõi Mentor.');
      return;
    }

    setIsFollowLoading(true);
    try {
      const result = isFollowing
        ? await mentorDiscoveryRepo.unfollow(targetUserId)
        : await mentorDiscoveryRepo.follow(targetUserId);
      setIsFollowing(result.mentors.some((item) => item.id === targetUserId));
    } catch {
      showError('Không thể cập nhật trạng thái theo dõi. Vui lòng thử lại.');
    } finally {
      setIsFollowLoading(false);
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
              />
            ) : (
              <span className="figma-detail-avatar">{initials(currentMentor.name)}</span>
            )}
            <span aria-hidden="true" />
          </div>
          <div className="figma-detail-identity">
            <div className="figma-detail-name-row">
              <h2>{currentMentor.name}</h2>
              {currentMentor.isVerified && <BadgeCheck aria-label="Mentor đã được xác minh" />}
            </div>
            {currentMentor.headline && (
              <p className="figma-detail-headline">
                {currentMentor.headline}
                {' · Mentor'}
              </p>
            )}
            <div className="figma-detail-rating">
              {currentMentor.rating !== null && currentMentor.rating !== undefined ? (
                <>
                  <span className="figma-detail-stars" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={index < Math.round(currentMentor.rating ?? 0) ? 'is-filled' : ''}
                      />
                    ))}
                  </span>
                  <strong>{currentMentor.rating.toFixed(1)}</strong>
                  {currentMentor.reviewCount !== undefined && (
                    <small>({currentMentor.reviewCount} đánh giá)</small>
                  )}
                </>
              ) : (
                <span className="figma-detail-no-rating">Chưa có đánh giá</span>
              )}
            </div>

            {currentMentor.bio && <p className="figma-detail-bio">{currentMentor.bio}</p>}

            {currentMentor.expertise.length > 0 && (
              <div className="figma-detail-skills" aria-label="Chuyên môn">
                {currentMentor.expertise.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            )}
          </div>
          <div className="figma-detail-actions">
            <Button
              type="button"
              variant="outline"
              size="lg"
              loading={isFollowLoading}
              aria-pressed={isFollowing}
              leftIcon={<Heart aria-hidden="true" fill={isFollowing ? 'currentColor' : 'none'} />}
              onClick={() => void handleFollowToggle()}
            >
              {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            </Button>
            <Button
              type="button"
              size="lg"
              leftIcon={<CalendarDays aria-hidden="true" />}
              onClick={() => servicesRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              Đặt lịch
            </Button>
          </div>
        </div>
        {(githubUrl || portfolioUrl || projects.length > 0 || achievements.length > 0) && (
          <div className="figma-detail-profile-footer">
            <div className="figma-detail-socials" aria-label="Liên kết của mentor">
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noreferrer">
                  <GitBranch aria-hidden="true" /> GitHub <ExternalLink aria-hidden="true" />
                </a>
              )}
              {portfolioUrl && (
                <a href={portfolioUrl} target="_blank" rel="noreferrer">
                  <Globe aria-hidden="true" /> Portfolio <ExternalLink aria-hidden="true" />
                </a>
              )}
            </div>
            {(projects.length > 0 || achievements.length > 0) && (
              <button
                type="button"
                className="figma-detail-evidence-button"
                onClick={() => setIsEvidenceModalOpen(true)}
              >
                <Trophy aria-hidden="true" />
                Xem dự án, giải thưởng &amp; thành tích
              </button>
            )}
          </div>
        )}
      </article>
      <nav className="figma-detail-tabs" aria-label="Mentor profile sections">
        <span className="figma-detail-tab figma-detail-tab-active">Dịch vụ &amp; Lịch dạy</span>
        <button
          type="button"
          className="figma-detail-tab"
          onClick={() => handleProtectedTabClick('Blog của Mentor')}
        >
          Blog
        </button>
        <button
          type="button"
          className="figma-detail-tab"
          onClick={() => handleProtectedTabClick('Khóa học của Mentor')}
        >
          Khóa học
        </button>
      </nav>
      <section
        ref={servicesRef}
        className="figma-detail-services"
        aria-label="Dịch vụ tư vấn một kèm một"
      >
        <h3>Dịch vụ tư vấn 1:1</h3>
        {isLoading ? (
          <div className="figma-detail-service-grid" aria-label="Đang tải dịch vụ">
            {[1, 2].map((item) => (
              <div className="figma-detail-service-skeleton" key={item} />
            ))}
          </div>
        ) : servicesError ? (
          <div className="figma-detail-service-state is-error" role="alert">
            <AlertCircle aria-hidden="true" />
            <span>Không thể tải dịch vụ. Vui lòng thử lại.</span>
          </div>
        ) : !services.length ? (
          <div className="figma-detail-service-state">Mentor hiện chưa có dịch vụ tư vấn.</div>
        ) : (
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
                    <strong>
                      {service.priceScoins === 0 ? 'Miễn phí' : priceLabel(service.priceScoins)}
                    </strong>
                    {service.priceScoins !== 0 && <small>S-coins</small>}
                  </div>
                </div>
                <p>{service.description}</p>
                <div className="figma-detail-service-meta">
                  <span>{service.durationMinutes} phút</span>
                  {service.completedCount !== undefined && (
                    <span>{service.completedCount} phiên đã hoàn thành</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="figma-detail-reviews" aria-labelledby="mentor-review-title">
        <div className="figma-detail-section-heading">
          <h3 id="mentor-review-title">Đánh giá từ mentee</h3>
          {!isReviewsLoading && !reviewsError && currentMentor.reviewCount !== undefined && (
            <span>{currentMentor.reviewCount} đánh giá</span>
          )}
        </div>
        {isReviewsLoading ? (
          <div className="figma-detail-review-grid" aria-label="Đang tải đánh giá">
            {[1, 2].map((item) => (
              <div className="figma-detail-review-skeleton" key={item} />
            ))}
          </div>
        ) : reviewsError ? (
          <div className="figma-detail-service-state is-error" role="alert">
            <AlertCircle aria-hidden="true" />
            <span>Không thể tải đánh giá. Vui lòng thử lại.</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="figma-detail-service-state">Mentor chưa có đánh giá từ mentee.</div>
        ) : (
          <div className="figma-detail-review-grid">
            {reviews.map((review) => (
              <article className="figma-detail-review-card" key={review.reviewId}>
                <div className="figma-detail-review-author">
                  {review.reviewerAvatarUrl ? (
                    <img src={review.reviewerAvatarUrl} alt="" />
                  ) : (
                    <span aria-hidden="true">{initials(review.reviewerDisplayName)}</span>
                  )}
                  <div>
                    <strong>{review.reviewerDisplayName}</strong>
                    <small>{formatReviewDate(review.createdAt)}</small>
                  </div>
                  <span className="figma-detail-review-score">
                    <Star aria-hidden="true" /> {review.rating}
                  </span>
                </div>
                {review.comment && <p>{review.comment}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title="Dự án, giải thưởng & thành tích"
        className="figma-mentor-evidence-modal"
      >
        <div className="figma-mentor-evidence-content">
          {projects.length > 0 && (
            <section aria-labelledby="mentor-projects-title">
              <h3 id="mentor-projects-title">
                <BriefcaseBusiness aria-hidden="true" /> Dự án nổi bật
              </h3>
              <div className="figma-mentor-evidence-list">
                {projects.map((project, index) => (
                  <article key={project.id || project.projectId || `${project.title}-${index}`}>
                    {project.pictureUrl && <img src={project.pictureUrl} alt="" />}
                    <div>
                      <h4>{project.title}</h4>
                      {project.content && <strong>{project.content}</strong>}
                      {project.projectDescription && <p>{project.projectDescription}</p>}
                      {project.liveDemoUrl && (
                        <a href={project.liveDemoUrl} target="_blank" rel="noreferrer">
                          Xem dự án <ExternalLink aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
          {achievements.length > 0 && (
            <section aria-labelledby="mentor-achievements-title">
              <h3 id="mentor-achievements-title">
                <Award aria-hidden="true" /> Giải thưởng &amp; thành tích
              </h3>
              <div className="figma-mentor-evidence-list">
                {achievements.map((achievement, index) => (
                  <article
                    key={
                      achievement.id || achievement.achievementId || `${achievement.title}-${index}`
                    }
                  >
                    {achievement.pictureUrl && <img src={achievement.pictureUrl} alt="" />}
                    <div>
                      <h4>{achievement.title}</h4>
                      {achievement.achievedAt && <strong>{achievement.achievedAt}</strong>}
                      {achievement.awardDescription && <p>{achievement.awardDescription}</p>}
                      {achievement.productHeader && <h5>{achievement.productHeader}</h5>}
                      {achievement.productDescription && <p>{achievement.productDescription}</p>}
                      {achievement.demoUrl && (
                        <a href={achievement.demoUrl} target="_blank" rel="noreferrer">
                          Xem minh chứng <ExternalLink aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </Modal>
    </section>
  );
}
