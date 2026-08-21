"use client";

import type { AuthenticatedUser } from "@/models/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

const prototypeProfile = {
  initials: "TH",
  name: "Nguyen",
  fullName: "Nguyen Thu Ha",
  role: "Mentee",
};

function initialsFor(name: string) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
  return initials ? initials.toUpperCase() : prototypeProfile.initials;
}

function roleLabel(roles?: AuthenticatedUser["roles"]) {
  const role = roles?.[0];
  if (!role || role === "MENTEE") return "Mentee";
  return role === "SYSTEM_ADMIN" ? "System Admin" : role.charAt(0) + role.slice(1).toLowerCase();
}

export function MenteeHeader({ title, locale, user }: { title: string; locale: string; user: AuthenticatedUser | null }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profile = user
    ? { initials: initialsFor(user.fullName), name: user.fullName.split(" ")[0] || user.fullName, fullName: user.fullName, role: roleLabel(user.roles), avatarUrl: user.avatarUrl }
    : prototypeProfile;

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setIsProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
    void logout().finally(() => router.push(`/${locale}/login`));
  };
  const openProfile = () => {
    setIsProfileOpen(false);
    router.push(`/${locale}/profile`);
  };

  return <header className="figma-topbar">
    <h1>{title}</h1>
    <div className="figma-topbar-actions" aria-label="Account actions">
      <button type="button" className="figma-icon-button" aria-label="Notifications">
        <svg className="figma-bell" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        <span className="figma-notification-dot" aria-hidden="true" />
      </button>
      <button type="button" className="figma-icon-button" aria-label="Messages"><span className="figma-message" aria-hidden="true" /></button>
      <div className="figma-profile-menu" ref={profileMenuRef}>
        <button type="button" className="figma-profile-link" aria-label="Open user profile menu" aria-expanded={isProfileOpen} onClick={() => setIsProfileOpen((open) => !open)}>
          <span className="figma-profile-avatar">{"avatarUrl" in profile && profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.initials}</span>
          <span className="figma-profile-copy"><strong>{profile.name}</strong><small>{profile.role}</small></span>
          <svg className={isProfileOpen ? "figma-chevron figma-chevron-open" : "figma-chevron"} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
        </button>
        {isProfileOpen && <section className="figma-profile-dropdown" aria-label="User profile menu">
          <div className="figma-profile-dropdown-summary"><span className="figma-profile-avatar figma-profile-avatar-large">{"avatarUrl" in profile && profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.initials}</span><div><strong>{profile.fullName}</strong><small>{profile.role}</small></div></div>
          <div className="figma-profile-dropdown-actions">
            <button type="button" className="figma-profile-menu-item" onClick={openProfile}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>Hồ sơ của tôi</button>
            <button type="button" className="figma-profile-menu-item"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.14 2.14-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.1h-3.03v-.1A1.7 1.7 0 0 0 10.63 18.7a1.7 1.7 0 0 0-1.88.34l-.06.06-2.14-2.14.06-.06A1.7 1.7 0 0 0 6.95 15a1.7 1.7 0 0 0-1.56-1.03h-.1v-3.03h.1A1.7 1.7 0 0 0 6.95 9.9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.14-2.14.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56v-.1h3.03v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.14 2.14-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.1v3.03h-.1A1.7 1.7 0 0 0 19.4 15Z" /></svg>Cài đặt</button>
          </div>
          <button type="button" className="figma-profile-menu-item figma-profile-logout" onClick={handleLogout}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" /><path d="m14 8 4 4-4 4M18 12H8" /></svg>Đăng xuất</button>
        </section>}
      </div>
    </div>
  </header>;
}
