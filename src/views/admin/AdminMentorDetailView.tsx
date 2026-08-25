/**
 * @file AdminMentorDetailView.tsx
 * @description Xem hồ sơ chuyên môn và hoạt động của mentor.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { ApiClientError } from '@/models/apiClient';
import type {
  AdminMentorAchievement,
  AdminMentorDetail,
  AdminMentorFeaturedProject,
} from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  ExternalLink,
  FolderKanban,
  GitBranch,
  GraduationCap,
  LoaderCircle,
  Mail,
  Phone,
  Star,
  TrendingUp,
  UserRoundCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
  PENDING: 'Chờ kích hoạt',
  SUSPENDED: 'Tạm ngưng',
  BANNED: 'Đã khóa',
};

function getErrorMessage(reason: unknown) {
  return reason instanceof ApiClientError ? reason.message : 'Không thể tải thông tin mentor.';
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll('_', ' ').toLocaleLowerCase('vi-VN');
}

function InitialAvatar({ name }: { name: string }) {
  return (
    <span className="admin-mentor-detail-initial">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

export function AdminMentorDetailView({
  locale,
  mentorUserId,
}: {
  locale: string;
  mentorUserId: string;
}) {
  const [mentor, setMentor] = useState<AdminMentorDetail>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadMentor = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setMentor(await adminRepo.getMentor(mentorUserId));
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [mentorUserId]);

  useEffect(() => {
    void loadMentor();
  }, [loadMentor]);

  if (loading) {
    return (
      <main className="admin-mentor-detail-page admin-mentor-detail-state">
        <span>
          <LoaderCircle aria-hidden="true" /> Đang tải hồ sơ mentor...
        </span>
      </main>
    );
  }

  if (!mentor) {
    return (
      <main className="admin-mentor-detail-page admin-mentor-detail-state">
        <div>
          <p>{error ?? 'Không tìm thấy mentor.'}</p>
          <Link href={`/${locale}/admin/users`}>Quay lại danh sách mentor</Link>
        </div>
      </main>
    );
  }

  const subjects = [...mentor.subjectResults].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );
  const projects = [...mentor.featuredProjects].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );
  const achievements = [...mentor.achievements].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );

  return (
    <main className="admin-mentor-detail-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <Link href={`/${locale}/admin/users`}>Người dùng</Link>{' '}
          <span>›</span> <b>Chi tiết mentor</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-mentor-detail-content">
        <Link className="admin-user-back-link" href={`/${locale}/admin/users`}>
          <ArrowLeft aria-hidden="true" /> Quay lại danh sách mentor
        </Link>
        <section className="admin-mentor-hero">
          {mentor.avatarUrl ? (
            <img src={mentor.avatarUrl} alt="" />
          ) : (
            <InitialAvatar name={mentor.displayName} />
          )}
          <div className="admin-mentor-hero-main">
            <div className="admin-mentor-title-row">
              <h1>{mentor.displayName}</h1>
              <span
                className={`admin-user-status ${mentor.mentorStatus.toLowerCase().replaceAll('_', '-')}`}
              >
                {getStatusLabel(mentor.mentorStatus)}
              </span>
              {mentor.verifiedAt && <span className="admin-mentor-verified">Đã xác minh</span>}
            </div>
            <p>{mentor.headline ?? mentor.primaryLabel ?? 'Chưa cập nhật tiêu đề chuyên môn.'}</p>
            <div className="admin-mentor-contact-row">
              <span>
                <Mail aria-hidden="true" /> {mentor.email}
              </span>
              {mentor.phoneNumber && (
                <span>
                  <Phone aria-hidden="true" /> {mentor.phoneNumber}
                </span>
              )}
              {mentor.primaryLabel && <span>{mentor.primaryLabel}</span>}
            </div>
          </div>
        </section>
        <section className="admin-mentor-metrics" aria-label="Chỉ số mentor">
          <MetricCard
            label="Điểm đánh giá"
            value={mentor.ratingAverage?.toFixed(1) ?? 'Chưa có'}
            suffix={`/ ${mentor.reviewCount} review`}
            icon="rating"
          />
          <MetricCard
            label="Buổi hoàn thành"
            value={formatNumber(mentor.completedSessions)}
            suffix="sessions"
            icon="sessions"
          />
          <MetricCard
            label="Booking bị từ chối"
            value={formatNumber(mentor.rejectedBookings)}
            suffix="booking"
            icon="rejections"
          />
          <MetricCard
            label="Khả dụng nhận lịch"
            value={mentor.isAvailable ? 'Sẵn sàng' : 'Tạm dừng'}
            suffix={
              mentor.bookingSuspendedUntil ? `đến ${formatDate(mentor.bookingSuspendedUntil)}` : ''
            }
            icon="availability"
          />
        </section>
        <div className="admin-mentor-detail-grid">
          <div className="admin-mentor-detail-main">
            <section className="admin-mentor-detail-card">
              <h2>
                <GraduationCap aria-hidden="true" /> Chuyên môn &amp; hỗ trợ
              </h2>
              <p className="admin-mentor-description">
                {mentor.expertiseDescription ?? 'Mentor chưa cập nhật mô tả chuyên môn.'}
              </p>
              <div className="admin-mentor-support-levels">
                <SupportLevel label="Nền tảng" value={mentor.foundationSupportLevel} />
                <SupportLevel label="Review đầu ra" value={mentor.outputReviewSupportLevel} />
                <SupportLevel label="Định hướng" value={mentor.directionSupportLevel} />
              </div>
            </section>
            <section className="admin-mentor-detail-card">
              <h2>
                <BookOpenCheck aria-hidden="true" /> Kết quả môn học
              </h2>
              {subjects.length ? (
                <div className="admin-mentor-subject-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã môn</th>
                        <th>Tên môn</th>
                        <th>Điểm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject) => (
                        <tr key={subject.id}>
                          <td>{subject.subjectCode}</td>
                          <td>{subject.subjectName}</td>
                          <td>{subject.scoreValue ?? 'Chưa có'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="admin-mentor-empty">Chưa có kết quả môn học.</p>
              )}
            </section>
            <MentorCollection
              title="Dự án nổi bật"
              icon={<FolderKanban aria-hidden="true" />}
              items={projects}
              type="project"
            />
            <MentorCollection
              title="Thành tựu"
              icon={<Award aria-hidden="true" />}
              items={achievements}
              type="achievement"
            />
          </div>
          <aside className="admin-mentor-detail-side">
            <section className="admin-mentor-detail-card">
              <h2>
                <UserRoundCheck aria-hidden="true" /> Trạng thái hồ sơ
              </h2>
              <dl className="admin-mentor-info-list">
                <div>
                  <dt>Trạng thái tài khoản</dt>
                  <dd>{getStatusLabel(mentor.userStatus)}</dd>
                </div>
                <div>
                  <dt>Trạng thái mentor</dt>
                  <dd>{getStatusLabel(mentor.mentorStatus)}</dd>
                </div>
                <div>
                  <dt>Đã xác minh lúc</dt>
                  <dd>{formatDate(mentor.verifiedAt)}</dd>
                </div>
                <div>
                  <dt>Ngày tạo hồ sơ</dt>
                  <dd>{formatDate(mentor.createdAt)}</dd>
                </div>
                <div>
                  <dt>Cập nhật gần nhất</dt>
                  <dd>{formatDate(mentor.updatedAt)}</dd>
                </div>
              </dl>
            </section>
            <section className="admin-mentor-detail-card">
              <h2>
                <TrendingUp aria-hidden="true" /> Liên kết chuyên môn
              </h2>
              <div className="admin-mentor-links">
                {mentor.portfolioUrl ? (
                  <a href={mentor.portfolioUrl} target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden="true" /> Portfolio
                  </a>
                ) : (
                  <span>Chưa có portfolio</span>
                )}
                {mentor.githubUrl ? (
                  <a href={mentor.githubUrl} target="_blank" rel="noreferrer">
                    <GitBranch aria-hidden="true" /> GitHub
                  </a>
                ) : (
                  <span>Chưa có GitHub</span>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: string;
  suffix: string;
  icon: 'rating' | 'sessions' | 'rejections' | 'availability';
}) {
  return (
    <article className={`admin-mentor-metric-card ${icon}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      {suffix && <small>{suffix}</small>}
    </article>
  );
}

function SupportLevel({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value ?? 'Chưa cập nhật'}</strong>
    </div>
  );
}

type MentorCollectionProps =
  | {
      title: string;
      icon: ReactNode;
      items: AdminMentorFeaturedProject[];
      type: 'project';
    }
  | {
      title: string;
      icon: ReactNode;
      items: AdminMentorAchievement[];
      type: 'achievement';
    };

function MentorCollection({ title, icon, items, type }: MentorCollectionProps) {
  const collectionItems =
    type === 'project'
      ? items.map((item) => ({
          id: item.id,
          title: item.title,
          pictureUrl: item.pictureUrl,
          description: item.projectDescription ?? item.content,
          url: item.liveDemoUrl,
          date: null,
        }))
      : items.map((item) => ({
          id: item.id,
          title: item.title,
          pictureUrl: item.pictureUrl,
          description: item.awardDescription ?? item.productDescription,
          url: item.demoUrl,
          date: item.achievedAt,
        }));

  return (
    <section className="admin-mentor-detail-card">
      <h2>
        {icon} {title}
      </h2>
      {collectionItems.length ? (
        <div className="admin-mentor-collection">
          {collectionItems.map((item) => (
            <article key={item.id}>
              {item.pictureUrl && <img src={item.pictureUrl} alt="" />}
              <div>
                <h3>{item.title}</h3>
                {item.date && <time>{formatDate(item.date)}</time>}
                {item.description && <p>{item.description}</p>}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden="true" /> Xem liên kết
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="admin-mentor-empty">
          Chưa có {type === 'project' ? 'dự án nổi bật' : 'thành tựu'}.
        </p>
      )}
    </section>
  );
}
