/**
 * @file AuthProvider.tsx
 * @description React Context Provider quản lý trạng thái xác thực toàn ứng dụng.
 * Cung cấp thông tin người dùng hiện tại, trạng thái khôi phục phiên (bootstrapping),
 * các phương thức hoàn tất đăng nhập Google, khôi phục phiên đăng nhập và đăng xuất.
 */

"use client";

import type {
  AuthenticatedUser,
  OnboardingStatusResponse,
  UserMeResponse,
} from "@/models/auth";
import {
  refreshSession,
  setAccessToken,
  setUnauthenticatedHandler,
} from "@/models/apiClient";
import { authRepo } from "@/repositories/authRepo";
import { studentProfileRepo } from "@/repositories/studentProfileRepo";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

/** Dữ liệu và các hàm thao tác được cung cấp bởi AuthContext */
interface AuthContextValue {
  /** Thông tin người dùng đã xác thực (null nếu chưa đăng nhập) */
  user: AuthenticatedUser | null;
  /** Cờ đánh dấu người dùng đã đăng nhập thành công hay chưa */
  isAuthenticated: boolean;
  /** Cờ đánh dấu ứng dụng đang trong quá trình khôi phục phiên làm việc ban đầu (bootstrapping) */
  isBootstrapping: boolean;
  /** Cờ đánh dấu các tác vụ auth (đăng nhập, đăng xuất) đang được thực thi */
  isLoading: boolean;
  /** Hàm hoàn tất quy trình đăng nhập Google và tải lại hồ sơ người dùng */
  completeGoogleLogin: () => Promise<OnboardingStatusResponse>;
  /** Hàm chủ động khôi phục phiên làm việc từ Refresh Token */
  restoreSession: () => Promise<void>;
  /** Hàm đăng xuất người dùng và dọn dẹp phiên làm việc */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provider quản lý state xác thực cấp ứng dụng.
 * Tự động kiểm tra và khôi phục phiên làm việc khi ứng dụng được tải lần đầu.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  /** Chuyển đổi dữ liệu thông tin người dùng từ Backend API sang dạng AuthenticatedUser chuẩn */
  const toAuthenticatedUser = (me: UserMeResponse): AuthenticatedUser => ({
    ...me,
    id: me.publicId,
  });

  /** Xóa phiên làm việc trong bộ nhớ tạm và đặt lại thông tin người dùng về null */
  const clearSession = () => {
    setAccessToken(null);
    setUser(null);
    studentProfileRepo.clearCache();
  };

  /**
   * Tải hồ sơ người dùng sau khi nhận Access Token từ Google Login và kiểm tra trạng thái onboarding
   * @returns Trạng thái onboarding để quyết định điều hướng
   */
  const completeGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const me = await authRepo.getMe();
      setUser(toAuthenticatedUser(me));
      return await authRepo.getOnboardingStatus();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Khôi phục phiên làm việc khi khởi chạy trang web.
   * Thử làm mới token từ Cookie, nếu thành công sẽ tải thông tin `/api/auth/me`.
   */
  const restoreSession = async () => {
    setIsBootstrapping(true);
    try {
      await refreshSession();
      const me = await authRepo.getMe();
      setUser(toAuthenticatedUser(me));
      await authRepo.getOnboardingStatus();
    } catch {
      clearSession();
    } finally {
      setIsBootstrapping(false);
    }
  };

  /**
   * Đăng xuất người dùng. Gửi request đến Backend để xóa HttpOnly Cookie và dọn dẹp bộ nhớ frontend.
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await authRepo.logout();
    } catch {
      /* Xóa cookie Backend dựa trên best-effort; state địa phương vẫn phải được dọn dẹp */
    } finally {
      clearSession();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setUnauthenticatedHandler(clearSession);
    void restoreSession();
    return () => setUnauthenticatedHandler(undefined);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      isLoading,
      completeGoogleLogin,
      restoreSession,
      logout,
    }),
    [user, isBootstrapping, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom Hook truy cập AuthContext.
 * Thừa hưởng toàn bộ thông tin xác thực người dùng và các thao tác Auth trong React Component tree.
 * @throws {Error} Nếu được gọi bên ngoài `AuthProvider`
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
