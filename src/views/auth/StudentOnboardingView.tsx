"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";

export function StudentOnboardingView({ locale }: { locale: string }) {
  const { user } = useAuth();

  return <AuthGuard locale={locale}>
    <main className="figma-onboarding-page">
      <section className="figma-onboarding-card" aria-labelledby="onboarding-title">
        <span className="figma-onboarding-icon" aria-hidden="true">✓</span>
        <p className="figma-onboarding-eyebrow">ĐĂNG NHẬP THÀNH CÔNG</p>
        <h1 id="onboarding-title">Chào {user?.fullName || "bạn"}!</h1>
        <p>Tài khoản Google của bạn đã được xác thực, nhưng hồ sơ sinh viên chưa hoàn tất. Vui lòng hoàn thiện hồ sơ để tiếp tục truy cập sử dụng nền tảng.</p>
        <div className="figma-onboarding-notice">
          <strong>Thông tin cần biết</strong>
          <span>Hãy hoàn thiện hồ sơ sinh viên khi tính năng onboarding được mở để dùng đầy đủ các chức năng cần xác thực hồ sơ.</span>
        </div>
        <Link className="figma-onboarding-action" href={`/${locale}/dashboard`}>Vào Bảng tin Mentee</Link>
      </section>
    </main>
  </AuthGuard>;
}
