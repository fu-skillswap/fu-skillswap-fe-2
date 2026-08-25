/**
 * @file AdminUserDetailView.tsx
 * @description Xem tóm tắt hồ sơ và hoạt động của một người dùng.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import type { AdminUserSummary } from '@/models/admin';
import {
  userAccountActionSchema,
  type UserAccountActionForm,
} from '@/models/schemas/adminUserSchema';
import { adminRepo } from '@/repositories/adminRepo';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  ArrowLeft,
  Ban,
  CircleUserRound,
  GraduationCap,
  LoaderCircle,
  Star,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';

const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
  PENDING: 'Chờ kích hoạt',
  SUSPENDED: 'Tạm ngưng',
  BANNED: 'Đã khóa',
};

type DetailTab = 'overview' | 'bookings' | 'reviews' | 'reports';
type UserAccountAction = 'ban' | 'unban';

const detailTabs: Array<{ value: DetailTab; label: string }> = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'bookings', label: 'Booking' },
  { value: 'reviews', label: 'Review' },
  { value: 'reports', label: 'Báo cáo' },
];

function getErrorMessage(reason: unknown, fallback = 'Không thể tải thông tin người dùng.') {
  return reason instanceof ApiClientError ? reason.message : fallback;
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa đăng nhập';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không xác định';

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
    <span className="admin-user-detail-initial">{name.trim().charAt(0).toUpperCase() || '?'}</span>
  );
}

export function AdminUserDetailView({ locale, userId }: { locale: string; userId: string }) {
  const [user, setUser] = useState<AdminUserSummary>();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [pendingAccountAction, setPendingAccountAction] = useState<UserAccountAction>();
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [accountActionError, setAccountActionError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors: actionFormErrors },
    reset: resetActionForm,
  } = useForm<UserAccountActionForm>({
    resolver: yupResolver(userAccountActionSchema),
  });

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setUser(await adminRepo.getUserSummary(userId));
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <main className="admin-user-detail-page admin-user-detail-state">
        <span>
          <LoaderCircle aria-hidden="true" /> Đang tải thông tin người dùng...
        </span>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="admin-user-detail-page admin-user-detail-state">
        <div>
          <p>{error ?? 'Không tìm thấy người dùng.'}</p>
          <Link href={`/${locale}/admin/users`}>Quay lại danh sách người dùng</Link>
        </div>
      </main>
    );
  }

  const academicProfile = user.academicProfile;
  const mentorProfile = user.mentorProfile;
  const activitySummary = user.activitySummary;
  const isBanned = user.status === 'BANNED';

  const openAccountAction = (action: UserAccountAction) => {
    resetActionForm();
    setAccountActionError(undefined);
    setPendingAccountAction(action);
  };

  const submitAccountAction = async ({ reason }: UserAccountActionForm) => {
    if (!pendingAccountAction) return;

    setIsUpdatingAccount(true);
    setAccountActionError(undefined);
    try {
      if (pendingAccountAction === 'ban') {
        await adminRepo.banUser(user.userId, reason);
      } else {
        await adminRepo.unbanUser(user.userId, reason);
      }
      setPendingAccountAction(undefined);
      await loadUser();
    } catch (reason) {
      setAccountActionError(
        getErrorMessage(
          reason,
          pendingAccountAction === 'ban'
            ? 'Không thể khóa tài khoản.'
            : 'Không thể mở lại tài khoản.',
        ),
      );
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  return (
    <main className="admin-user-detail-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <Link href={`/${locale}/admin/users`}>Người dùng</Link>{' '}
          <span>›</span> <b>Chi tiết</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-user-detail-content">
        <Link className="admin-user-back-link" href={`/${locale}/admin/users`}>
          <ArrowLeft aria-hidden="true" /> Quay lại danh sách người dùng
        </Link>
        <section className="admin-user-hero">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" />
          ) : (
            <InitialAvatar name={user.fullName} />
          )}
          <div>
            <h1>{user.fullName}</h1>
            <p>{user.email}</p>
            <div className="admin-user-detail-badges">
              {user.roles.map((role) => (
                <span key={role}>{role}</span>
              ))}
              <span
                className={`admin-user-status ${user.status.toLowerCase().replaceAll('_', '-')}`}
              >
                {getStatusLabel(user.status)}
              </span>
            </div>
          </div>
          <div className="admin-user-account-actions">
            <button
              type="button"
              className="danger"
              disabled={isBanned}
              onClick={() => openAccountAction('ban')}
            >
              <Ban aria-hidden="true" /> Khóa tài khoản
            </button>
            <button
              type="button"
              className="secondary"
              disabled={!isBanned}
              onClick={() => openAccountAction('unban')}
            >
              Mở lại tài khoản
            </button>
          </div>
        </section>
        <nav className="admin-user-detail-tabs" aria-label="Nội dung chi tiết người dùng">
          {detailTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={activeTab === tab.value ? 'is-active' : ''}
              aria-current={activeTab === tab.value ? 'page' : undefined}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {activeTab === 'overview' ? (
          <div className="admin-user-detail-grid">
            <section className="admin-user-detail-card admin-user-account-card">
              <h2>
                <CircleUserRound aria-hidden="true" /> Thông tin tài khoản
              </h2>
              <dl>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt>Ngày tạo</dt>
                  <dd>{formatDate(user.createdAt)}</dd>
                </div>
                <div>
                  <dt>Đăng nhập gần nhất</dt>
                  <dd>{formatDate(user.lastLoginAt)}</dd>
                </div>
              </dl>
            </section>
            <section className="admin-user-detail-card admin-user-academic-card">
              <h2>
                <GraduationCap aria-hidden="true" /> Hồ sơ học thuật
              </h2>
              {academicProfile ? (
                <dl className="admin-user-academic-fields">
                  <div>
                    <dt>Mã sinh viên</dt>
                    <dd>{academicProfile.studentCode ?? 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Cơ sở</dt>
                    <dd>
                      {academicProfile.campusName ?? academicProfile.campusCode ?? 'Chưa cập nhật'}
                    </dd>
                  </div>
                  <div>
                    <dt>Chương trình</dt>
                    <dd>
                      {academicProfile.programName ??
                        academicProfile.programCode ??
                        'Chưa cập nhật'}
                    </dd>
                  </div>
                  <div>
                    <dt>Chuyên ngành</dt>
                    <dd>
                      {academicProfile.specializationName ??
                        academicProfile.specializationCode ??
                        'Chưa cập nhật'}
                    </dd>
                  </div>
                  <div>
                    <dt>Học kỳ</dt>
                    <dd>
                      {academicProfile.semester
                        ? `Học kỳ ${academicProfile.semester}`
                        : 'Chưa cập nhật'}
                    </dd>
                  </div>
                  <div>
                    <dt>Trạng thái cựu sinh viên</dt>
                    <dd>{academicProfile.isAlumni ? 'Đã tốt nghiệp' : 'Đang theo học'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="admin-user-detail-empty">Người dùng chưa cập nhật hồ sơ học thuật.</p>
              )}
            </section>
            <section className="admin-user-detail-card admin-user-mentor-card">
              <h2>
                <Star aria-hidden="true" /> Hồ sơ mentor
              </h2>
              {mentorProfile?.exists ? (
                <dl className="admin-user-mentor-fields">
                  <div>
                    <dt>Tiêu đề</dt>
                    <dd>{mentorProfile.headline ?? 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Trạng thái mentor</dt>
                    <dd>{mentorProfile.mentorStatus ?? 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Khả dụng nhận lịch</dt>
                    <dd>{mentorProfile.isAvailable ? 'Đang khả dụng' : 'Tạm không khả dụng'}</dd>
                  </div>
                  <div>
                    <dt>Đã xác minh lúc</dt>
                    <dd>{formatDate(mentorProfile.verifiedAt)}</dd>
                  </div>
                  <div>
                    <dt>Điểm đánh giá trung bình</dt>
                    <dd>{mentorProfile.averageRating?.toFixed(2) ?? 'Chưa có đánh giá'}</dd>
                  </div>
                  <div>
                    <dt>Buổi đã hoàn thành</dt>
                    <dd>{formatNumber(mentorProfile.totalCompletedSessions ?? 0)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="admin-user-detail-empty">Người dùng chưa có hồ sơ mentor.</p>
              )}
            </section>
            <section className="admin-user-detail-card admin-user-activity-card">
              <h2>
                <TrendingUp aria-hidden="true" /> Hoạt động trên nền tảng
              </h2>
              <div className="admin-user-activity-grid">
                <ActivityItem
                  label="Lịch đặt với vai trò mentee"
                  value={activitySummary.menteeBookingCount}
                />
                <ActivityItem
                  label="Lịch nhận với vai trò mentor"
                  value={activitySummary.mentorBookingCount}
                />
                <ActivityItem label="Đơn thanh toán" value={activitySummary.paymentOrderCount} />
                <ActivityItem label="Yêu cầu rút tiền" value={activitySummary.payoutRequestCount} />
                <ActivityItem
                  label="Báo cáo đã tạo"
                  value={activitySummary.forumReportCreatedCount}
                />
              </div>
            </section>
          </div>
        ) : (
          <UserFocusPanel tab={activeTab} user={user} />
        )}
      </div>
      {pendingAccountAction && (
        <div className="mentor-document-modal" role="dialog" aria-modal="true">
          <form
            className="mentor-revision-dialog admin-user-action-dialog"
            onSubmit={handleSubmit(submitAccountAction)}
          >
            <header>
              <div>
                <h2>{pendingAccountAction === 'ban' ? 'Khóa tài khoản' : 'Mở lại tài khoản'}</h2>
                <p>
                  {pendingAccountAction === 'ban'
                    ? `Khóa quyền truy cập của ${user.fullName}. Vui lòng ghi rõ lý do để lưu lại lịch sử xử lý.`
                    : `Mở lại quyền truy cập của ${user.fullName}. Vui lòng ghi rõ lý do để các quản trị viên khác nắm được.`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng xác nhận"
                disabled={isUpdatingAccount}
                onClick={() => setPendingAccountAction(undefined)}
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <label htmlFor="user-account-action-reason">Lý do</label>
            <textarea
              id="user-account-action-reason"
              rows={5}
              autoFocus
              disabled={isUpdatingAccount}
              placeholder={
                pendingAccountAction === 'ban'
                  ? 'Ví dụ: Vi phạm quy định cộng đồng và cần tạm khóa tài khoản để kiểm tra.'
                  : 'Ví dụ: Đã hoàn tất kiểm tra và cho phép người dùng hoạt động trở lại.'
              }
              {...register('reason')}
            />
            {actionFormErrors.reason && (
              <p className="mentor-form-error">{actionFormErrors.reason.message}</p>
            )}
            {accountActionError && <p className="mentor-form-error">{accountActionError}</p>}
            <footer>
              <button
                type="button"
                disabled={isUpdatingAccount}
                onClick={() => setPendingAccountAction(undefined)}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={pendingAccountAction === 'ban' ? 'danger' : 'primary'}
                disabled={isUpdatingAccount}
              >
                {isUpdatingAccount
                  ? 'Đang xác nhận...'
                  : pendingAccountAction === 'ban'
                    ? 'Xác nhận khóa'
                    : 'Xác nhận mở lại'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </main>
  );
}

function ActivityItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <WalletCards aria-hidden="true" />
      <strong>{formatNumber(value)}</strong>
      <span>{label}</span>
    </div>
  );
}

function UserFocusPanel({
  tab,
  user,
}: {
  tab: Exclude<DetailTab, 'overview'>;
  user: AdminUserSummary;
}) {
  const mentorProfile = user.mentorProfile;
  const activity = user.activitySummary;

  if (tab === 'bookings') {
    return (
      <section className="admin-user-focus-card">
        <h2>Booking</h2>
        <p>Tổng quan lịch hẹn của người dùng trên nền tảng.</p>
        <div className="admin-user-focus-metrics">
          <FocusMetric label="Lịch đặt với vai trò mentee" value={activity.menteeBookingCount} />
          <FocusMetric label="Lịch nhận với vai trò mentor" value={activity.mentorBookingCount} />
        </div>
      </section>
    );
  }

  if (tab === 'reviews') {
    return (
      <section className="admin-user-focus-card">
        <h2>Review</h2>
        {mentorProfile?.exists ? (
          <div className="admin-user-focus-metrics">
            <FocusMetric
              label="Điểm đánh giá trung bình"
              value={mentorProfile.averageRating?.toFixed(2) ?? 'Chưa có'}
            />
            <FocusMetric
              label="Buổi mentoring đã hoàn thành"
              value={mentorProfile.totalCompletedSessions ?? 0}
            />
          </div>
        ) : (
          <p>Người dùng chưa có hồ sơ mentor để nhận đánh giá.</p>
        )}
      </section>
    );
  }

  return (
    <section className="admin-user-focus-card">
      <h2>Báo cáo</h2>
      <p>Tổng số báo cáo diễn đàn mà người dùng đã tạo.</p>
      <div className="admin-user-focus-metrics">
        <FocusMetric label="Báo cáo đã tạo" value={activity.forumReportCreatedCount} />
      </div>
    </section>
  );
}

function FocusMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <strong>{typeof value === 'number' ? formatNumber(value) : value}</strong>
      <span>{label}</span>
    </div>
  );
}
