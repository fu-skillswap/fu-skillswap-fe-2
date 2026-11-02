/**
 * @file MentorDetail.tsx
 * @description Component Trang Hồ sơ chi tiết Mentor (Mentor Profile Detail Component).
 * Hiển thị tiểu sử, danh sách kỹ năng chuyên môn, chỉ số đánh giá và các gói dịch vụ tư vấn 1:1.
 */

import type { Mentor, MentorService } from '@/models/entities';
import { Button } from '@/components/ui/Button';
import { StarDisplay } from '@/components/ui/StarDisplay';
import { Modal } from '@/components/ui/Modal';
import type { MentorAchievementResponse, MentorProjectResponse } from '@/models/auth';
import type { BlogPostReaderCardResponse } from '@/models/blog';
import { MentorBlogPostGrid } from '@/components/domain/blog/MentorBlogPostGrid';
import { useMentorArticles } from '@/components/domain/blog/useMentorArticles';
import { MentorReviews, type MentorReputation } from './MentorReviews';
import { MentorServiceCard } from './MentorServiceCard';
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
  Trophy,
} from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  useFocusParam,
  useHighlightElement,
} from '@/components/domain/notifications/useNotificationFocus';
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
  const [reputation, setReputation] = useState<MentorReputation>();
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const searchParams = useSearchParams();
  // `?tab=reviews` opens the reviews (e.g. from a "Bạn vừa nhận được đánh giá mới" notification).
  const [activeTab, setActiveTab] = useState<'services' | 'blog' | 'reviews'>(() =>
    searchParams.get('tab') === 'reviews' ? 'reviews' : 'services',
  );
  const { focusId, clearFocus } = useFocusParam();
  useHighlightElement(
    focusId === 'mentor-reviews' ? 'mentor-reviews' : undefined,
    activeTab === 'reviews',
    clearFocus,
  );
  const tabsRef = useRef<HTMLElement>(null);
  const [articles, setArticles] = useState<BlogPostReaderCardResponse[]>([]);
  const [articleCount, setArticleCount] = useState<number>();
  const servicesRef = useRef<HTMLElement>(null);
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'vi';
  const { isAuthenticated, showAuthRequiredModal } = useAuth();
  const mentorArticles = useMentorArticles(targetUserId, articles);
  const blogCount = Math.max(articleCount ?? 0, mentorArticles.articles.length);

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
          setReputation(detail.reputation);
          setProjects(detail.evidence?.featuredProjects ?? []);
          setAchievements(detail.evidence?.achievements ?? []);
          setGithubUrl(detail.evidence?.githubUrl || undefined);
          setPortfolioUrl(detail.evidence?.portfolioUrl || undefined);
          const authority = detail.evidence?.authorityContent;
          setArticleCount(authority?.publishedArticleCount);
          setArticles(
            (authority?.recentPublicArticles ?? [])
              .filter((article) => article.id && article.slug)
              .map((article) => ({
                ...article,
                author: {
                  id: targetUserId,
                  displayName: detail.identity?.displayName || mappedMentor.name,
                  avatarUrl: detail.identity?.avatarUrl ?? mappedMentor.avatarUrl,
                  authorType: 'MENTOR' as const,
                },
              })),
          );
        }
        setServices(
          detail.services
            .filter((service) => service.isActive !== false)
            .map((service) => ({
              id: service.serviceId,
              mentorId: targetUserId,
              name: service.title,
              description: service.description || '',
              expectedOutcome: service.expectedOutcome,
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

  const openReviews = () => {
    setActiveTab('reviews');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const reviewCount = reputation?.reviewCount ?? currentMentor.reviewCount ?? 0;
  const completedSessions = reputation?.completedSessions ?? 0;

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
    <main className="min-h-screen bg-slate-50/60 bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] [background-size:16px_16px] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Quay lại danh sách */}
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-transparent border-0 cursor-pointer p-0"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>
        </div>

        {/* THẺ HỒ SƠ MENTOR */}
        <article className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            {/* Left: Avatar + Identity */}
            <div className="flex flex-col sm:flex-row items-start gap-5 min-w-0 flex-1">
              <div className="relative shrink-0">
                {currentMentor.avatarUrl ? (
                  <img
                    src={currentMentor.avatarUrl}
                    alt={currentMentor.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-sky-400 p-0.5 object-cover"
                  />
                ) : (
                  <span className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-sky-400 bg-sky-50 text-sky-600 font-extrabold text-2xl flex items-center justify-center">
                    {initials(currentMentor.name)}
                  </span>
                )}
                <span
                  className="w-4 h-4 rounded-full bg-sky-500 border-2 border-white absolute bottom-1 right-1"
                  aria-hidden="true"
                />
              </div>

              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight m-0">
                    {currentMentor.name}
                  </h1>
                  {currentMentor.isVerified && (
                    <BadgeCheck
                      className="w-5 h-5 text-sky-500 fill-sky-500 text-white shrink-0"
                      aria-label="Mentor đã xác minh"
                    />
                  )}
                </div>

                {currentMentor.headline && (
                  <p className="text-xs sm:text-sm font-medium text-slate-500 leading-tight m-0">
                    {currentMentor.headline}
                    {' · Mentor'}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
                  {currentMentor.rating !== null &&
                  currentMentor.rating !== undefined &&
                  reviewCount > 0 ? (
                    <button
                      type="button"
                      onClick={openReviews}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent p-0 text-left"
                      aria-label={`${currentMentor.rating.toFixed(1)} trên 5 sao, ${reviewCount} đánh giá. Xem đánh giá`}
                    >
                      <StarDisplay rating={Math.round(currentMentor.rating)} size={16} />
                      <strong className="font-bold text-slate-800">
                        {currentMentor.rating.toFixed(1)}
                      </strong>
                      <span className="text-slate-500 underline-offset-2 hover:underline">
                        ({reviewCount} đánh giá)
                      </span>
                    </button>
                  ) : (
                    <span className="text-sky-600 font-medium text-xs sm:text-sm">
                      Chưa có đánh giá
                    </span>
                  )}
                  {completedSessions > 0 && (
                    <span className="text-slate-500">· {completedSessions} buổi đã hoàn thành</span>
                  )}
                </div>

                {currentMentor.bio && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed m-0 pt-0.5">
                    {currentMentor.bio}
                  </p>
                )}

                {currentMentor.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentMentor.expertise.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-row items-center gap-3 shrink-0 self-start w-full lg:w-auto">
              <button
                type="button"
                disabled={isFollowLoading}
                onClick={() => void handleFollowToggle()}
                className="flex-1 lg:flex-initial inline-flex flex-row items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-sky-400 text-sky-500 hover:bg-sky-50 font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer shrink-0 bg-white"
              >
                <Heart
                  className={`w-4 h-4 shrink-0 ${isFollowing ? 'fill-sky-500 text-sky-500' : ''}`}
                />
                <span className="whitespace-nowrap">
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('services');
                  // Wait one frame so the services section is visible before scrolling.
                  requestAnimationFrame(() =>
                    servicesRef.current?.scrollIntoView({ behavior: 'smooth' }),
                  );
                }}
                className="flex-1 lg:flex-initial inline-flex flex-row items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs sm:text-sm transition-all shadow-sm whitespace-nowrap cursor-pointer shrink-0 border-0"
              >
                <CalendarDays className="w-4 h-4 shrink-0 text-white" />
                <span className="whitespace-nowrap">Đặt lịch</span>
              </button>
            </div>
          </div>

          {/* Footer Socials & Evidence Button */}
          {(githubUrl || portfolioUrl || projects.length > 0 || achievements.length > 0) && (
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors decoration-0"
                  >
                    <GitBranch className="w-4 h-4 text-slate-500" />
                    GitHub
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}
                {portfolioUrl && (
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors decoration-0"
                  >
                    <Globe className="w-4 h-4 text-slate-500" />
                    Portfolio
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}
              </div>

              {(projects.length > 0 || achievements.length > 0) && (
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold text-xs sm:text-sm transition-colors border border-sky-100 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-sky-500" />
                  Xem dự án, giải thưởng &amp; thành tích
                </button>
              )}
            </div>
          )}
        </article>

        {/* TABS NAVIGATION */}
        <nav
          ref={tabsRef}
          className="scroll-mt-24 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-1.5 flex items-center justify-around sm:justify-start sm:gap-6 px-6"
        >
          <button
            type="button"
            aria-pressed={activeTab === 'services'}
            onClick={() => setActiveTab('services')}
            className={
              activeTab === 'services'
                ? 'py-3 px-3 text-xs sm:text-sm font-bold text-sky-600 border-b-2 border-sky-500 transition-all cursor-pointer bg-transparent border-t-0 border-x-0'
                : 'py-3 px-3 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-transparent border-0'
            }
          >
            Dịch vụ &amp; Lịch dạy
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'blog'}
            onClick={() => setActiveTab('blog')}
            className={
              activeTab === 'blog'
                ? 'py-3 px-3 text-xs sm:text-sm font-bold text-sky-600 border-b-2 border-sky-500 transition-all cursor-pointer bg-transparent border-t-0 border-x-0'
                : 'py-3 px-3 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-transparent border-0'
            }
          >
            Blog{blogCount ? ` (${blogCount})` : ''}
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'reviews'}
            onClick={() => setActiveTab('reviews')}
            className={
              activeTab === 'reviews'
                ? 'py-3 px-3 text-xs sm:text-sm font-bold text-sky-600 border-b-2 border-sky-500 transition-all cursor-pointer bg-transparent border-t-0 border-x-0'
                : 'py-3 px-3 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-transparent border-0'
            }
          >
            Đánh giá{reviewCount ? ` (${reviewCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => handleProtectedTabClick('Khóa học của Mentor')}
            className="py-3 px-3 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-transparent border-0"
          >
            Khóa học
          </button>
        </nav>

        {/* SECTION BLOG CỦA MENTOR */}
        {activeTab === 'blog' && (
          <section className="space-y-4" aria-labelledby="mentor-blog-title">
            <h3
              id="mentor-blog-title"
              className="text-xl font-extrabold text-slate-900 tracking-tight m-0 pb-4"
            >
              Bài viết của Mentor
            </h3>
            <MentorBlogPostGrid
              posts={mentorArticles.articles}
              locale={locale}
              isLoading={!mentorArticles.articles.length && (isLoading || mentorArticles.isLoading)}
              isError={Boolean(servicesError) && !mentorArticles.articles.length}
              emptyText="Mentor chưa xuất bản bài viết nào."
            />
          </section>
        )}

        {/* SECTION DỊCH VỤ TƯ VẤN 1:1 */}
        <section
          ref={servicesRef}
          className={`space-y-4 ${activeTab === 'services' ? '' : 'hidden'}`}
        >
          <div className="flex items-baseline justify-between gap-4 pb-4">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight m-0">
              Dịch vụ tư vấn 1:1
            </h3>
            {!isLoading && !servicesError && services.length > 0 && (
              <span className="text-sm text-slate-500">{services.length} dịch vụ</span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-40 bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse"
                />
              ))}
            </div>
          ) : servicesError ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>Không thể tải dịch vụ. Vui lòng thử lại.</span>
            </div>
          ) : !services.length ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 text-slate-500 text-sm">
              Mentor hiện chưa có dịch vụ tư vấn.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {services.map((service) => (
                <MentorServiceCard
                  key={service.id}
                  service={service}
                  priceText={priceLabel(service.priceScoins)}
                  onBook={handleServiceClick}
                  onViewSchedule={handleServiceClick}
                />
              ))}
            </div>
          )}
        </section>

        {/* SECTION ĐÁNH GIÁ TỪ MENTEE */}
        {activeTab === 'reviews' && (
          <MentorReviews
            mentorUserId={targetUserId}
            mentorName={currentMentor.name}
            reputation={reputation}
          />
        )}

        {/* MODAL CÁC DỰ ÁN & GIẢI THƯỞNG */}
        <Modal
          open={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          title="Dự án, giải thưởng & thành tích"
          className="max-w-2xl bg-white rounded-2xl p-6 border border-slate-200"
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            {projects.length > 0 && (
              <section className="space-y-3" aria-labelledby="mentor-projects-title">
                <h3
                  id="mentor-projects-title"
                  className="text-base font-bold text-slate-900 flex items-center gap-2 m-0"
                >
                  <BriefcaseBusiness className="w-5 h-5 text-sky-600" /> Dự án nổi bật
                </h3>
                <div className="space-y-3">
                  {projects.map((project, index) => (
                    <article
                      key={project.id || project.projectId || `${project.title}-${index}`}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2"
                    >
                      {project.pictureUrl && (
                        <img
                          src={project.pictureUrl}
                          alt=""
                          className="w-full h-40 object-cover rounded-lg mb-2"
                        />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 m-0">{project.title}</h4>
                        {project.content && (
                          <strong className="text-xs text-sky-600 block mt-0.5">
                            {project.content}
                          </strong>
                        )}
                        {project.projectDescription && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {project.projectDescription}
                          </p>
                        )}
                        {project.liveDemoUrl && (
                          <a
                            href={project.liveDemoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline mt-2"
                          >
                            Xem dự án <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {achievements.length > 0 && (
              <section className="space-y-3" aria-labelledby="mentor-achievements-title">
                <h3
                  id="mentor-achievements-title"
                  className="text-base font-bold text-slate-900 flex items-center gap-2 m-0"
                >
                  <Award className="w-5 h-5 text-purple-600" /> Giải thưởng &amp; thành tích
                </h3>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <article
                      key={
                        achievement.id ||
                        achievement.achievementId ||
                        `${achievement.title}-${index}`
                      }
                      className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/70 space-y-2"
                    >
                      {achievement.pictureUrl && (
                        <img
                          src={achievement.pictureUrl}
                          alt=""
                          className="w-full h-40 object-cover rounded-lg mb-2"
                        />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-purple-900 m-0">
                          {achievement.title}
                        </h4>
                        {achievement.achievedAt && (
                          <strong className="text-xs text-purple-600 block mt-0.5">
                            {achievement.achievedAt}
                          </strong>
                        )}
                        {achievement.awardDescription && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {achievement.awardDescription}
                          </p>
                        )}
                        {achievement.productHeader && (
                          <h5 className="text-xs font-bold text-slate-800 mt-2">
                            {achievement.productHeader}
                          </h5>
                        )}
                        {achievement.productDescription && (
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {achievement.productDescription}
                          </p>
                        )}
                        {achievement.demoUrl && (
                          <a
                            href={achievement.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline mt-2"
                          >
                            Xem minh chứng <ExternalLink className="w-3.5 h-3.5" />
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
      </div>
    </main>
  );
}
