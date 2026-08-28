/**
 * @file AdminProfileView.tsx
 * @description Trang hiển thị thông tin tài khoản của quản trị viên đang đăng nhập.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { useAuth } from '@/providers/AuthProvider';

function roleLabel(role: string) {
  return role === 'SYSTEM_ADMIN' ? 'System Admin' : role.charAt(0) + role.slice(1).toLowerCase();
}

export function AdminProfileView() {
  const { user } = useAuth();
  const displayName = user?.fullName || 'Quản trị viên';
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="admin-workspace">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <b>Hồ sơ</b>
        </div>
        <AdminTopbarActions />
      </header>
      <section className="admin-page-content">
        <div className="admin-page-heading">
          <div>
            <h1>Hồ sơ quản trị viên</h1>
            <p>Thông tin của tài khoản đang đăng nhập.</p>
          </div>
        </div>
        <article className="admin-profile-card">
          <span className="admin-profile-avatar">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials || 'A'}
          </span>
          <div>
            <h2>{displayName}</h2>
            <p>{user?.email}</p>
            <div className="admin-profile-role-list">
              {user?.roles.map((role) => (
                <span key={role}>{roleLabel(role)}</span>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
