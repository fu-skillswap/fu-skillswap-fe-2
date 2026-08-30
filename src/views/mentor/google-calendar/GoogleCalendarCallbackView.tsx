/**
 * @file GoogleCalendarCallbackView.tsx
 * @description Callback View for Google Calendar OAuth PKCE flow.
 * Consumes code & state, verifies stored PKCE verifier, calls Backend connect API, and handles error states.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { showSuccess } from '@/utils/toast';
import { mentorSchedulingRepo } from '@/repositories/mentorSchedulingRepo';
import { ApiClientError } from '@/models/apiClient';
import { getGoogleCalendarRedirectUri } from '@/lib/auth/google';
import { Calendar, Loader2, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

type CallbackStatus = 'PROCESSING' | 'SUCCESS' | 'EXPIRED' | 'CANCELLED' | 'UNAPPROVED' | 'ERROR';

export function GoogleCalendarCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'vi';

  const [status, setStatus] = useState<CallbackStatus>('PROCESSING');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Read PKCE session storage
    const storedVerifier = sessionStorage.getItem('skillswap.googleCalendar.pkceVerifier');
    const storedState = sessionStorage.getItem('skillswap.googleCalendar.state');
    const storedRedirectUri = sessionStorage.getItem('skillswap.googleCalendar.redirectUri');
    const redirectUriToUse = storedRedirectUri || getGoogleCalendarRedirectUri(locale);

    // ALWAYS clear session storage immediately to prevent reuse/replay on page refresh
    sessionStorage.removeItem('skillswap.googleCalendar.pkceVerifier');
    sessionStorage.removeItem('skillswap.googleCalendar.state');
    sessionStorage.removeItem('skillswap.googleCalendar.redirectUri');

    // Clear URL query parameters immediately to prevent code exposure/re-use in browser history
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 1. User cancelled Google OAuth prompt
    if (error === 'access_denied') {
      setStatus('CANCELLED');
      setErrorMessage(
        'Bạn đã hủy kết nối Google Calendar. Bạn vẫn có thể sử dụng các chức năng lịch dạy của SkillSwap bình thường.',
      );
      return;
    }

    // 2. Generic OAuth error from Google
    if (error) {
      setStatus('ERROR');
      setErrorMessage(errorDescription || 'Xác thực Google không thành công.');
      return;
    }

    // 3. Callback refresh or missing session/code/state
    if (!code || !state || !storedVerifier || !storedState) {
      setStatus('EXPIRED');
      setErrorMessage(
        'Phiên kết nối này đã kết thúc. Vui lòng bắt đầu lại quá trình kết nối Google Calendar.',
      );
      return;
    }

    // 4. State mismatch (security validation)
    if (state !== storedState) {
      setStatus('EXPIRED');
      setErrorMessage('Phiên xác thực Google Calendar không hợp lệ hoặc đã hết hạn.');
      return;
    }

    // 5. Valid OAuth response -> Call Backend connect API
    const performConnect = async () => {
      try {
        await mentorSchedulingRepo.connectGoogleCalendar({
          authorizationCode: code,
          redirectUri: redirectUriToUse,
          codeVerifier: storedVerifier,
          state: state,
        });

        setStatus('SUCCESS');
        showSuccess('Đã kết nối Google Calendar.');
        router.push(`/${locale}/mentor/schedule-manage`);
      } catch (reason) {
        if (reason instanceof ApiClientError) {
          if (reason.status === 409 || reason.code === 'CAL_4402') {
            setStatus('UNAPPROVED');
            setErrorMessage(
              'Tài khoản Mentor cần được phê duyệt trước khi kết nối Google Calendar.',
            );
          } else if (reason.status === 400 || reason.code === 'AUTH_1006') {
            setStatus('EXPIRED');
            setErrorMessage(
              reason.message || 'Phiên kết nối Google Calendar không còn hợp lệ. Vui lòng kết nối lại.',
            );
          } else {
            setStatus('ERROR');
            setErrorMessage(reason.message || 'Không thể kết nối Google Calendar.');
          }
        } else {
          setStatus('ERROR');
          setErrorMessage('Có lỗi xảy ra trong quá trình kết nối Google Calendar.');
        }
      }
    };

    void performConnect();
  }, [searchParams, router, locale]);

  const handleReturnToSettings = () => {
    router.push(`/${locale}/mentor/schedule-manage`);
  };

  const handleGoToVerification = () => {
    router.push(`/${locale}/mentor/dashboard`);
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
        {/* State 1: Processing */}
        {status === 'PROCESSING' && (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Đang kết nối Google Calendar...</h2>
              <p className="text-xs text-slate-500">Vui lòng không đóng trang này.</p>
            </div>
          </div>
        )}

        {/* State 2: Success */}
        {status === 'SUCCESS' && (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Kết nối thành công!</h2>
              <p className="text-xs text-slate-500">Đang điều hướng về trang quản lý lịch...</p>
            </div>
          </div>
        )}

        {/* State 3: Cancelled by User */}
        {status === 'CANCELLED' && (
          <div className="space-y-4 py-2">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">Đã hủy kết nối</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{errorMessage}</p>
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={handleReturnToSettings}>
                Quay lại cài đặt lịch
              </Button>
            </div>
          </div>
        )}

        {/* State 4: Expired / Invalid Session / AUTH_1006 */}
        {status === 'EXPIRED' && (
          <div className="space-y-4 py-2">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">Phiên không hợp lệ</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{errorMessage}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="primary" size="sm" className="w-full" onClick={handleReturnToSettings}>
                Thử kết nối lại
              </Button>
            </div>
          </div>
        )}

        {/* State 5: Mentor Unapproved CAL_4402 */}
        {status === 'UNAPPROVED' && (
          <div className="space-y-4 py-2">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">Chưa thể kết nối</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{errorMessage}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="primary" size="sm" className="w-full" onClick={handleGoToVerification}>
                Xem trạng thái xác minh
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={handleReturnToSettings}>
                Quay lại cài đặt lịch
              </Button>
            </div>
          </div>
        )}

        {/* State 6: Generic Error */}
        {status === 'ERROR' && (
          <div className="space-y-4 py-2">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">Kết nối thất bại</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{errorMessage}</p>
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={handleReturnToSettings}>
                Quay lại cài đặt lịch
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
