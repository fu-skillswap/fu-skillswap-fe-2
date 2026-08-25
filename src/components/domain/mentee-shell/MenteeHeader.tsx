'use client';

import type { AuthenticatedUser, StudentProfileResponse, UserMeResponse } from '@/models/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { authRepo } from '@/repositories/authRepo';
import { studentProfileRepo } from '@/repositories/studentProfileRepo';
import { BookOpen, ChevronDown, LogOut, User } from 'lucide-react';

const prototypeProfile: {
  initials: string;
  name: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
} = {
  initials: 'TH',
  name: 'Nguyen',
  fullName: 'Nguyen Thu Ha',
  role: 'Mentee',
  avatarUrl: null,
};

function initialsFor(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
  return initials ? initials.toUpperCase() : prototypeProfile.initials;
}

function roleLabel(roles?: AuthenticatedUser['roles']) {
  const role = roles?.[0];
  if (!role || role === 'MENTEE') return 'Mentee';
  return role === 'SYSTEM_ADMIN' ? 'System Admin' : role.charAt(0) + role.slice(1).toLowerCase();
}

/** Props của MenteeHeader Component */
interface MenteeHeaderProps {
  /** Tiêu đề trang hiển thị ở thanh topbar */
  title: string;
  /** Mã locale ngôn ngữ hiện tại */
  locale: string;
  /** Thông tin người dùng đã xác thực (nếu có) */
  user: AuthenticatedUser | null;
  /** Callback bật/tắt hiển thị Sidebar trên mobile/tablet */
  onToggleSidebar?: () => void;
}

/**
 * Component thanh tiêu đề trên cùng (Topbar) dành cho giao diện Mentee.
 */
export function MenteeHeader({ title, locale, user, onToggleSidebar }: MenteeHeaderProps) {
  const router = useRouter();
  const { logout, user: authUser, isAuthenticated } = useAuth();
  const [fetchedUser, setFetchedUser] = useState<UserMeResponse | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfileResponse | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  /** Tải thông tin hồ sơ học thuật từ API GET /api/me/student-profile nếu đã đăng nhập */
  useEffect(() => {
    if (isAuthenticated) {
      studentProfileRepo
        .get()
        .then((sp) => setStudentProfile(sp))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  /** Tải thông tin người dùng từ API GET /api/auth/me nếu chưa có trong props/context */
  useEffect(() => {
    if (isAuthenticated && !user && !authUser) {
      authRepo
        .getMe()
        .then((me) => setFetchedUser(me))
        .catch(() => {});
    }
  }, [isAuthenticated, user, authUser]);

  const activeUser = user ?? authUser ?? fetchedUser;
  const isGuest = !isAuthenticated && !activeUser;

  const displayName =
    studentProfile?.displayName ||
    activeUser?.fullName ||
    studentProfile?.email?.split('@')[0] ||
    prototypeProfile.fullName;

  const avatarUrl = studentProfile?.avatarUrl || activeUser?.avatarUrl;

  const profile = {
    initials: initialsFor(displayName),
    name: displayName.split(' ')[0] || displayName,
    fullName: displayName,
    role: roleLabel(activeUser?.roles),
    avatarUrl,
  };

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setIsProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  /** Xử lý Đăng xuất: gọi authRepo.logout() (POST /api/auth/logout) & chuyển hướng tới trang Login */
  const handleLogout = async () => {
    setIsProfileOpen(false);
    try {
      await logout();
    } catch {
      await authRepo.logout().catch(() => {});
    } finally {
      router.push(`/${locale}/login`);
    }
  };

  const openProfile = () => {
    setIsProfileOpen(false);
    router.push(`/${locale}/profile`);
  };

  return (
    <header className="figma-topbar">
      <div className="figma-topbar-left">
        <button
          type="button"
          className="figma-sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Bật/Tắt thanh điều hướng"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1>{title}</h1>
      </div>
      <div className="figma-topbar-actions" aria-label="Account actions">
        {!isGuest && (
          <>
            <button type="button" className="figma-icon-button" aria-label="Notifications">
              <svg className="figma-bell" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="figma-notification-dot" aria-hidden="true" />
            </button>
            <button type="button" className="figma-icon-button" aria-label="Messages">
              <span className="figma-message" aria-hidden="true" />
            </button>
          </>
        )}

        {isGuest ? (
          /* Nút Đăng nhập / Đăng ký dành cho Guest Mode khi chưa đăng nhập */
          <Link href={`/${locale}/login`} className="figma-topbar-guest-login-btn">
            Đăng nhập / Đăng ký
          </Link>
        ) : (
          /* Nút hiển thị Tên người dùng và nút dropdown ngay bên cạnh icon Chat */
          <div className="figma-profile-menu" ref={profileMenuRef}>
            <button
              type="button"
              className="figma-profile-link"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-expanded={isProfileOpen}
              aria-label="User profile menu"
            >
              <span className="figma-profile-avatar">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.initials}
              </span>
              <span className="figma-profile-copy">
                <strong>{profile.fullName}</strong>
                <small>{profile.role}</small>
              </span>
              <ChevronDown
                className={`figma-chevron ${isProfileOpen ? 'figma-chevron-open' : ''}`}
                aria-hidden="true"
              />
            </button>

            {isProfileOpen && (
              <section className="figma-profile-dropdown" aria-label="User profile menu">
                <div className="figma-profile-dropdown-actions">
                  <button type="button" className="figma-profile-menu-item" onClick={openProfile}>
                    <User aria-hidden="true" />
                    Hồ sơ của tôi
                  </button>
                  {(activeUser?.roles?.includes('MENTEE') ||
                    profile.role === 'Mentee' ||
                    !activeUser?.roles?.length) && (
                    <button
                      type="button"
                      className="figma-profile-menu-item"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push(`/${locale}/mentor-registration`);
                      }}
                    >
                      <BookOpen aria-hidden="true" />
                      Đăng ký làm Mentor
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="figma-profile-menu-item figma-profile-logout"
                  onClick={handleLogout}
                >
                  <LogOut aria-hidden="true" />
                  Đăng xuất
                </button>
              </section>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
