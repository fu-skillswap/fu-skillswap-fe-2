'use client';

import type { AuthenticatedUser, StudentProfileResponse, UserMeResponse } from '@/models/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { authRepo } from '@/repositories/authRepo';
import { studentProfileRepo } from '@/repositories/studentProfileRepo';
import { NotificationMenu } from '@/components/domain/notifications/NotificationMenu';
import { BookOpen, ChevronDown, LogOut, Menu, MessageSquare, User, UserCheck } from 'lucide-react';

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
  if (roles?.includes('MENTOR')) return 'Mentor';
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
  const pathname = usePathname();
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

  const openMentorRegistration = () => {
    setIsProfileOpen(false);
    router.push(`/${locale}/mentor-registration`);
  };

  const isMentor = activeUser?.roles.includes('MENTOR');
  const isMentorDashboard = pathname.startsWith(`/${locale}/mentor/dashboard`);

  return (
    <header className="h-16 px-4 md:px-6 bg-white/85 backdrop-blur-xl border-b border-solid border-border-light/80 sticky top-0 z-30 flex items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:text-text-main hover:bg-surface-subtle transition-colors border-none bg-transparent cursor-pointer"
          onClick={onToggleSidebar}
          aria-label="Bật/Tắt thanh điều hướng"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <h1 className="m-0 text-base md:text-lg font-extrabold text-text-main truncate tracking-tight">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3 shrink-0" aria-label="Account actions">
        {!isGuest && (
          <>
            <NotificationMenu />
            <button
              type="button"
              className="w-9.5 h-9.5 rounded-xl border border-solid border-border-color hover:border-border-strong bg-white text-text-secondary hover:text-text-main flex items-center justify-center transition-all cursor-pointer"
              aria-label="Tin nhắn"
              onClick={() => router.push(`/${locale}/messages`)}
            >
              <MessageSquare className="w-4.5 h-4.5" aria-hidden="true" />
            </button>
          </>
        )}

        {isGuest ? (
          /* Nút Đăng nhập / Đăng ký dành cho Guest Mode khi chưa đăng nhập */
          <Link
            href={`/${locale}/login`}
            className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-xs hover:shadow-md hover:shadow-primary/20 transition-all border-none cursor-pointer inline-flex items-center justify-center"
          >
            Đăng nhập / Đăng ký
          </Link>
        ) : (
          /* Nút hiển thị Tên người dùng và nút dropdown ngay bên cạnh icon Chat */
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-subtle transition-colors border-none bg-transparent cursor-pointer text-left"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-expanded={isProfileOpen}
              aria-label="User profile menu"
            >
              <span className="w-9.5 h-9.5 rounded-full bg-primary-light border border-solid border-primary-border text-primary font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : profile.initials}
              </span>
              <span className="hidden sm:flex flex-col text-left">
                <strong className="text-sm sm:text-base font-extrabold text-text-main leading-tight">{profile.fullName}</strong>
                <small className="text-xs text-text-muted font-medium">{profile.role}</small>
              </span>
              <ChevronDown
                className={`w-4.5 h-4.5 text-text-muted transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {isProfileOpen && (
              <section className="absolute right-0 top-full mt-2 w-60 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-solid border-border-light/80 p-2.5 z-50 flex flex-col gap-1 animate-in fade-in-0 zoom-in-95 duration-150" aria-label="User profile menu">
                <div className="flex flex-col gap-1">
                  <button type="button" className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle transition-colors border-none bg-transparent cursor-pointer text-left" onClick={openProfile}>
                    <User className="w-4.5 h-4.5 shrink-0 text-text-muted" aria-hidden="true" />
                    Hồ sơ của tôi
                  </button>
                  {!isMentor && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-main hover:bg-surface-subtle transition-colors border-none bg-transparent cursor-pointer text-left"
                      onClick={openMentorRegistration}
                    >
                      <UserCheck className="w-4.5 h-4.5 shrink-0 text-text-muted" aria-hidden="true" />
                      Đăng ký làm mentor
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-danger hover:bg-danger-soft transition-colors border-none bg-transparent cursor-pointer text-left mt-1 border-t border-solid border-border-light/60 pt-2.5"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4.5 h-4.5 shrink-0 text-danger" aria-hidden="true" />
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
