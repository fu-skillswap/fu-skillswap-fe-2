/**
 * @file AdminMentorDetailView.tsx
 * @description Xem hồ sơ chuyên môn và hoạt động của mentor.
 */

'use client';

import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import type {
  AdminMentorAchievement,
  AdminMentorDetail,
  AdminMentorFeaturedProject,
} from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { AdminMentorViolationsSection } from '@/views/admin/mentor-violations/AdminMentorViolationsSection';
import {
  formatPhoneNumber,
  formatViolationDateTime,
  isBookingSuspended,
} from '@/views/admin/mentor-violations/mentorViolations.helpers';
import {
  Award,
  BookOpenCheck,
  ChevronLeft,
  ExternalLink,
  FolderKanban,
  GitBranch,
  GraduationCap,
  LoaderCircle,
  Lock,
  Mail,
  Phone,
  TrendingUp,
  UserRoundCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
  PENDING: 'Chờ kích hoạt',
  PENDING_VERIFICATION: 'Chờ duyệt',
  PAUSED: 'Tạm dừng',
  REJECTED: 'Bị từ chối',
  DRAFT: 'Bản nháp',
  SUSPENDED: 'Tạm ngưng',
  BANNED: 'Đã khóa',
  DELETED: 'Đã xóa',
};

function getErrorMessage(reason: unknown) {
  return getUserFriendlyErrorMessage(reason, 'Không thể tải thông tin mentor.');
}

/** "HH:mm dd/MM/yyyy"; date-only values (no time part) keep just "dd/MM/yyyy". */
function formatDate(value: string | null) {
  if (!value) return 'Chưa cập nhật';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split('-').reverse().join('/');
  return formatViolationDateTime(value, value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll('_', ' ').toLocaleLowerCase('vi-VN');
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

  /** `silent` refreshes the data in place, without swapping the page for the loading state. */
  const loadMentor = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(undefined);
      }
      try {
        setMentor(await adminRepo.getMentor(mentorUserId));
      } catch (reason) {
        if (!silent) setError(getErrorMessage(reason));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [mentorUserId],
  );

  useEffect(() => {
    void loadMentor();
  }, [loadMentor]);

  // The page renders after an async load, so the browser cannot scroll to "#violations" itself.
  const isLoaded = Boolean(mentor);
  useEffect(() => {
    if (isLoaded && window.location.hash === '#violations') {
      document.getElementById('violations')?.scrollIntoView({ block: 'start' });
    }
  }, [isLoaded]);

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
  const suspended = isBookingSuspended(mentor);

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
        <Link
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 no-underline transition hover:text-primary"
          href={`/${locale}/admin/users`}
        >
          <ChevronLeft className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          Quay lại danh sách mentor
        </Link>
        <div className="grid gap-5">
          <section className="admin-mentor-detail-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {mentor.avatarUrl ? (
                <img
                  src={mentor.avatarUrl}
                  alt=""
                  className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className="inline-flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-primary-light text-2xl font-extrabold text-primary"
                  aria-hidden="true"
                >
                  {mentor.displayName.trim().charAt(0).toUpperCase() || '?'}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="m-0 text-[22px] font-extrabold leading-7 text-slate-900">
                    {mentor.displayName}
                  </h1>
                  <span
                    className={`admin-user-status ${mentor.mentorStatus.toLowerCase().replaceAll('_', '-')}`}
                  >
                    {getStatusLabel(mentor.mentorStatus)}
                  </span>
                  {mentor.verifiedAt && <span className="admin-mentor-verified">Đã xác minh</span>}
                </div>
                <p className="m-0 mt-1 text-sm leading-6 text-slate-500">
                  {mentor.headline ?? 'Chưa cập nhật tiêu đề chuyên môn.'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="break-all">{mentor.email}</span>
                  </span>
                  {mentor.phoneNumber && (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      {formatPhoneNumber(mentor.phoneNumber)}
                    </span>
                  )}
                  {mentor.primaryLabel && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {mentor.primaryLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <dl
              className="m-0 mt-5 grid grid-cols-1 divide-y divide-slate-200 border-t border-solid border-slate-200 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0"
              aria-label="Chỉ số mentor"
            >
              <Fact
                label="Điểm đánh giá"
                value={
                  mentor.ratingAverage != null
                    ? `${mentor.ratingAverage.toFixed(1)} · ${formatNumber(mentor.reviewCount)} đánh giá`
                    : 'Chưa có đánh giá'
                }
              />
              <Fact label="Buổi hoàn thành" value={formatNumber(mentor.completedSessions)} />
              <Fact label="Booking bị từ chối" value={formatNumber(mentor.rejectedBookings)} />
              <Fact
                label="Nhận lịch"
                tone={suspended ? 'danger' : undefined}
                value={
                  suspended ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Tạm khóa đến {formatViolationDateTime(mentor.bookingSuspendedUntil)}
                    </span>
                  ) : mentor.isAvailable ? (
                    'Sẵn sàng'
                  ) : (
                    'Tạm dừng'
                  )
                }
              />
            </dl>
          </section>

          <AdminMentorViolationsSection
            mentorUserId={mentor.mentorUserId}
            mentorName={mentor.displayName}
            onChanged={() => void loadMentor(true)}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="admin-mentor-detail-card">
              <h2 className="admin-card-title">
                <UserRoundCheck aria-hidden="true" /> Trạng thái hồ sơ
              </h2>
              <dl className="m-0 divide-y divide-slate-100">
                <InfoRow label="Trạng thái tài khoản" value={getStatusLabel(mentor.userStatus)} />
                <InfoRow label="Trạng thái mentor" value={getStatusLabel(mentor.mentorStatus)} />
                <InfoRow label="Đã xác minh lúc" value={formatDate(mentor.verifiedAt)} />
                <InfoRow label="Ngày tạo hồ sơ" value={formatDate(mentor.createdAt)} />
                <InfoRow label="Cập nhật gần nhất" value={formatDate(mentor.updatedAt)} />
              </dl>
            </section>
            <section className="admin-mentor-detail-card">
              <h2 className="admin-card-title">
                <TrendingUp aria-hidden="true" /> Liên kết chuyên môn
              </h2>
              {mentor.portfolioUrl || mentor.githubUrl ? (
                <div className="admin-mentor-links">
                  {mentor.portfolioUrl && (
                    <a href={mentor.portfolioUrl} target="_blank" rel="noreferrer">
                      <ExternalLink aria-hidden="true" /> Portfolio
                    </a>
                  )}
                  {mentor.githubUrl && (
                    <a href={mentor.githubUrl} target="_blank" rel="noreferrer">
                      <GitBranch aria-hidden="true" /> GitHub
                    </a>
                  )}
                </div>
              ) : (
                <p className="m-0 text-sm text-slate-500">
                  Mentor chưa thêm portfolio hoặc GitHub.
                </p>
              )}
            </section>
          </div>

          <section className="admin-mentor-detail-card">
            <h2 className="admin-card-title">
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
            <h2 className="admin-card-title">
              <BookOpenCheck aria-hidden="true" /> Kết quả môn học
            </h2>
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
                  {subjects.length ? (
                    subjects.map((subject) => (
                      <tr key={subject.id}>
                        <td>{subject.subjectCode}</td>
                        <td>{subject.subjectName}</td>
                        <td>{subject.scoreValue ?? 'Chưa có'}</td>
                      </tr>
                    ))
                  ) : (
                    <AdminTableState
                      variant="empty"
                      colSpan={3}
                      title="Chưa có kết quả môn học"
                      description="Mentor chưa thêm điểm môn học nào vào hồ sơ."
                    />
                  )}
                </tbody>
              </table>
            </div>
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
      </div>
    </main>
  );
}

function Fact({ label, value, tone }: { label: string; value: ReactNode; tone?: 'danger' }) {
  return (
    <div className="px-0 py-3.5 lg:px-5 lg:pb-0 lg:pt-4 lg:first:pl-0">
      <dt className="text-[12.5px] text-slate-500">{label}</dt>
      <dd
        className={`m-0 mt-1 text-[17px] font-bold leading-6 ${
          tone === 'danger' ? 'text-red-700' : 'text-slate-900'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[13.5px] text-slate-500">{label}</dt>
      <dd className="m-0 text-right text-sm font-semibold text-slate-900">{value}</dd>
    </div>
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
      <h2 className="admin-card-title">
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
