"use client";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useState } from "react";
import { useLoginLogic } from "./useLoginLogic";

const signInRoles = [
  { id: "mentee", name: "Mentee", description: "Học từ các chuyên gia" },
  { id: "mentor", name: "Mentor", description: "Chia sẻ kiến thức" },
  { id: "admin", name: "Admin", description: "Quản lý nền tảng" },
  { id: "system-admin", name: "System Admin", description: "Quản lý hệ thống" },
] as const;

export function LoginView({ locale }: { locale: string }) {
  const { error, loading, googleLoading, submit, loginWithGoogle } = useLoginLogic(locale);
  const [selectedRole, setSelectedRole] = useState<(typeof signInRoles)[number]["id"]>("mentee");
  return <main className="figma-login-page">
    <section className="figma-login-panel" aria-label="Log in">
      <form className="figma-login-form" noValidate onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void submit({ email: String(data.get("email")), password: String(data.get("password")) });
      }}>
        <div className="figma-login-brand">
          <img src="https://fang-squad-69023135.figma.site/assets/SkillSwapLogo-1-geFhVeE4.png" alt="SkillSwap" />
          <p>Kết nối. Học hỏi. Phát triển.</p>
        </div>

        <div className="figma-login-tabs" aria-label="Authentication mode">
          <span className="figma-login-tab figma-login-tab-active">Đăng nhập</span>
          <span className="figma-login-tab">Đăng ký</span>
        </div>

        <section className="figma-login-role-section" aria-label="Đăng nhập với tư cách">
          <h1>ĐĂNG NHẬP VỚI TƯ CÁCH</h1>
          <div className="figma-login-role-grid">
            {signInRoles.map((role) => <button key={role.id} type="button" className={selectedRole === role.id ? "figma-login-role figma-login-role-active" : "figma-login-role"} aria-pressed={selectedRole === role.id} onClick={() => setSelectedRole(role.id)}><strong>{role.name}</strong><small>{role.description}</small></button>)}
          </div>
        </section>

        <div className="figma-login-fields">
          <TextField label="Email" name="email" type="email" placeholder="your@email.com" autoComplete="email" />
          <TextField label="Mật khẩu" name="password" type="password" placeholder="••••••••" autoComplete="current-password" />
        </div>
        <span className="figma-login-forgot" aria-disabled="true">Quên mật khẩu?</span>
        {error && <p className="figma-login-error" role="alert">{error}</p>}
        <Button className="figma-login-submit" type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
        <div className="figma-login-divider" aria-hidden="true"><span />hoặc<span /></div>
        <button type="button" className="figma-login-google" disabled={googleLoading} onClick={() => { void loginWithGoogle(); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.51h3.14c1.84-1.7 2.91-4.2 2.91-7.28Z" /><path fill="#34A853" d="M12 21.78c2.62 0 4.82-.87 6.44-2.23l-3.14-2.51c-.87.58-1.98.92-3.3.92-2.53 0-4.67-1.7-5.43-4v2.59H3.33a9.73 9.73 0 0 0 8.67 5.23Z" /><path fill="#FBBC05" d="M6.57 13.96A5.86 5.86 0 0 1 6.27 12c0-.68.12-1.34.3-1.96V7.45H3.33A9.73 9.73 0 0 0 2.27 12c0 1.57.38 3.06 1.06 4.55l3.24-2.59Z" /><path fill="#EA4335" d="M12 6.04c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.81 3.11 14.62 2.22 12 2.22a9.73 9.73 0 0 0-8.67 5.23l3.24 2.59c.76-2.3 2.9-4 5.43-4Z" /></svg>{googleLoading ? "Đang chuyển đến Google..." : "Đăng nhập bằng Google"}</button>
        <p className="figma-login-signup">Chưa có tài khoản? <span>Đăng ký</span></p>
      </form>
    </section>

    <aside className="figma-login-visual" aria-label="Lợi ích SkillSwap">
      <div className="figma-login-visual-content">
        <span className="figma-login-cap" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 9 9-4 9 4-9 4z" /><path d="M7 11.2V16c2.8 2 7.2 2 10 0v-4.8M21 10v5" /></svg></span>
        <h2>Học từ chuyên gia.<br />Phát triển sự nghiệp.</h2>
        <p>Kết nối với các chuyên gia hàng đầu đã đi qua con đường bạn đang đi. Đặt lịch 1:1, học khóa học và tham gia cộng đồng đang phát triển mạnh mẽ.</p>
        <div className="figma-login-metrics">
          <div><strong>2,400+</strong><span>Mentor đã xác thực</span></div>
          <div><strong>18,000+</strong><span>Phiên học hoàn thành</span></div>
          <div><strong>94%</strong><span>Tỷ lệ hài lòng</span></div>
          <div><strong>120+</strong><span>Danh mục kỹ năng</span></div>
        </div>
      </div>
    </aside>
  </main>;
}
