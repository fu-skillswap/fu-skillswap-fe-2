"use client";

import type { AuthenticatedUser, OnboardingStatusResponse, UserMeResponse } from "@/models/auth";
import { refreshSession, setAccessToken, setUnauthenticatedHandler } from "@/models/apiClient";
import { authService } from "@/services/authService";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextValue { user: AuthenticatedUser | null; isAuthenticated: boolean; isBootstrapping: boolean; isLoading: boolean; completeGoogleLogin: () => Promise<OnboardingStatusResponse>; restoreSession: () => Promise<void>; logout: () => Promise<void>; }
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const toAuthenticatedUser = (me: UserMeResponse): AuthenticatedUser => ({ ...me, id: me.publicId });
  const clearSession = () => { setAccessToken(null); setUser(null); };
  const completeGoogleLogin = async () => { setIsLoading(true); try { const me = await authService.getMe(); setUser(toAuthenticatedUser(me)); return await authService.getOnboardingStatus(); } finally { setIsLoading(false); } };
  const restoreSession = async () => { setIsBootstrapping(true); try { await refreshSession(); const me = await authService.getMe(); setUser(toAuthenticatedUser(me)); await authService.getOnboardingStatus(); } catch { clearSession(); } finally { setIsBootstrapping(false); } };
  const logout = async () => { setIsLoading(true); try { await authService.logout(); } catch { /* Backend cookie clearing is best effort; local state must still be cleared. */ } finally { clearSession(); setIsLoading(false); } };
  useEffect(() => { setUnauthenticatedHandler(clearSession); void restoreSession(); return () => setUnauthenticatedHandler(undefined); }, []);
  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), isBootstrapping, isLoading, completeGoogleLogin, restoreSession, logout }), [user, isBootstrapping, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
