'use client';

import type {
  AuthenticatedUser,
  OnboardingStatusResponse,
  StudentProfileResponse,
  UserMeResponse,
} from '@/models/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { authRepo } from '@/repositories/authRepo';
import { studentProfileRepo } from '@/repositories/studentProfileRepo';
import { NotificationMenu } from '@/components/domain/notifications/NotificationMenu';
import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Crown,
  LogOut,
  Menu,
  MessageSquare,
  Settings2,
  User,
} from 'lucide-react';

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
  const { logout, user: authUser, isAuthenticated } = useAuth();
  const [fetchedUser, setFetchedUser] = useState<UserMeResponse | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfileResponse | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatusResponse | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  /** Tải thông tin hồ sơ học thuật từ API GET /api/me/student-profile nếu đã đăng nhập */
  useEffect(() => {
    if (isAuthenticated) {
      void Promise.all([
        studentProfileRepo
          .get()
          .then((sp) => setStudentProfile(sp))
          .catch(() => {}),
        authRepo
          .getOnboardingStatus()
          .then((status) => setOnboardingStatus(status))
          .catch(() => {}),
      ]);
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
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        profileTriggerRef.current?.focus();
      }
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
  const mentorVerificationStatus = onboardingStatus?.mentorVerificationStatus?.toUpperCase();
  const mentorApplicationPending = ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(
    mentorVerificationStatus ?? '',
  );

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
              ref={profileTriggerRef}
              type="button"
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-subtle transition-colors border-none bg-transparent cursor-pointer text-left"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              aria-label="User profile menu"
            >
              <span className="w-9.5 h-9.5 rounded-full bg-primary-light border border-solid border-primary-border text-primary font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile.initials
                )}
              </span>
              <span className="hidden sm:flex flex-col text-left">
                <strong className="text-sm sm:text-base font-extrabold text-text-main leading-tight">
                  {profile.fullName}
                </strong>
                <small className="text-xs text-text-muted font-medium">{profile.role}</small>
              </span>
              <ChevronDown
                className={`w-4.5 h-4.5 text-text-muted transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {isProfileOpen && (
              <section
                className="absolute right-0 top-full z-50 mt-2 flex max-h-[calc(100vh-96px)] w-[350px] max-w-[calc(100vw-24px)] flex-col overflow-y-auto rounded-[18px] border border-solid border-border-light/80 bg-white/95 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150"
                aria-label="User profile menu"
                role="menu"
              >
                <div className="flex items-center gap-3 px-5 py-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-solid border-primary-border bg-primary-light text-sm font-bold text-primary">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      profile.initials
                    )}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-base font-extrabold text-text-main">
                      {profile.fullName}
                    </strong>
                    <small className="mt-0.5 block truncate text-xs text-text-muted">
                      {profile.role}
                      {studentProfile?.campus?.name ? ` • ${studentProfile.campus.name}` : ''}
                    </small>
                  </span>
                </div>

                <div className="border-t border-solid border-border-light px-3 py-3">
                  <p className="mb-2 mt-0 px-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Tài khoản &amp; học tập
                  </p>
                  <button
                    type="button"
                    className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-primary-light/60 px-3 py-2.5 text-left text-sm font-bold text-primary transition-colors hover:bg-primary-light"
                    onClick={openProfile}
                    role="menuitem"
                  >
                    <User className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                    Hồ sơ của tôi
                  </button>
                  <button
                    type="button"
                    className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-main"
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push(`/${locale}/my-bookings`);
                    }}
                    role="menuitem"
                  >
                    <CalendarDays
                      className="h-4.5 w-4.5 shrink-0 text-text-muted"
                      aria-hidden="true"
                    />
                    Lịch sử booking
                  </button>
                </div>

                {!isMentor && (
                  <div className="px-3 pb-3">
                    <button
                      type="button"
                      className="flex min-h-[78px] w-full cursor-pointer items-center gap-3 rounded-2xl border border-solid border-primary/15 bg-primary-light/45 px-3.5 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary-light/70"
                      onClick={openMentorRegistration}
                      role="menuitem"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500">
                        <Crown className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-sm font-extrabold text-primary">
                          {mentorApplicationPending
                            ? 'Hồ sơ mentor đang được xét duyệt'
                            : 'Trở thành mentor'}
                        </strong>
                        <small className="mt-1 block text-[11px] leading-4 text-text-muted">
                          {mentorApplicationPending
                            ? 'Theo dõi trạng thái hồ sơ đăng ký mentor của bạn.'
                            : 'Chia sẻ kỹ năng, kinh nghiệm và nhận thêm cơ hội hơn.'}
                        </small>
                      </span>
                      <ChevronDown className="h-4 w-4 -rotate-90 text-primary" aria-hidden="true" />
                    </button>
                  </div>
                )}

                <div className="border-t border-solid border-border-light px-3 py-3">
                  <p className="mb-2 mt-0 px-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Cài đặt &amp; hỗ trợ
                  </p>
                  <button
                    type="button"
                    className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-main"
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push(`/${locale}/settings?section=settings&tab=account`);
                    }}
                    role="menuitem"
                  >
                    <Settings2
                      className="h-4.5 w-4.5 shrink-0 text-text-muted"
                      aria-hidden="true"
                    />
                    Cài đặt
                  </button>
                  <button
                    type="button"
                    className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-main"
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push(`/${locale}/settings?section=help`);
                    }}
                    role="menuitem"
                  >
                    <CircleHelp
                      className="h-4.5 w-4.5 shrink-0 text-text-muted"
                      aria-hidden="true"
                    />
                    Trợ giúp &amp; hỗ trợ
                  </button>
                </div>

                <button
                  type="button"
                  className="flex min-h-12 w-full cursor-pointer items-center gap-3 border-x-0 border-b-0 border-t border-solid border-border-light bg-transparent px-5 py-3 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger-soft"
                  onClick={handleLogout}
                  role="menuitem"
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
