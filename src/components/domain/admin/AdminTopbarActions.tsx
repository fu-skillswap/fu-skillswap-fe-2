/**
 * @file AdminTopbarActions.tsx
 * @description Nhóm thao tác chuẩn dùng chung trên top bar khu vực quản trị.
 */

import { Bell, Search, Settings } from 'lucide-react';

export function AdminTopbarActions() {
  return (
    <div className="admin-topbar-actions">
      <label>
        <Search aria-hidden="true" />
        <input aria-label="Tìm kiếm" placeholder="Tìm kiếm..." />
      </label>
      <button aria-label="Thông báo" type="button">
        <Bell aria-hidden="true" />
      </button>
      <button aria-label="Cài đặt" type="button">
        <Settings aria-hidden="true" />
      </button>
      <div className="admin-avatar" aria-label="Hồ sơ quản trị viên">
        A
      </div>
    </div>
  );
}
