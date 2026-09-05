/**
 * @file PaymentCheckoutModal.tsx
 * @description Modal xem trước thông tin thanh toán (Checkout Preview) và thanh toán qua payOS cho Mentee.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, CreditCard, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import type { CheckoutPreviewResponse, MentorBookingResponse } from '@/models/auth';
import { bookingRepo } from '@/repositories/bookingRepo';
import { showError, showSuccess } from '@/utils/toast';

interface PaymentCheckoutModalProps {
  booking?: MentorBookingResponse | null;
  onClose: () => void;
}

function formatDeadline(isoString?: string) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `trước ${timeStr}, ${dateStr}`;
}

function formatSchedule(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatScoin(amount?: number) {
  const value = amount ?? 0;
  return `${value.toLocaleString('vi-VN')} Scoin`;
}

export function PaymentCheckoutModal({ booking, onClose }: PaymentCheckoutModalProps) {
  const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // B1 & B2: Fetch checkout preview khi mở modal
  const fetchPreview = useCallback(async (bookingId: string, coupon?: string) => {
    setErrorMsg(null);
    try {
      const data = await bookingRepo.checkoutPreview(bookingId, coupon);
      setPreview(data);
      if (coupon) {
        setAppliedCoupon(coupon);
        showSuccess({ title: 'Áp dụng mã thành công', description: `Đã áp dụng mã giảm giá "${coupon}".` });
      }
    } catch (error) {
      // B2: Catch lỗi nếu không có dữ liệu booking đó
      showError(error, { title: 'Không thể tải thông tin thanh toán' });
      setErrorMsg('Không thể tải dữ liệu thanh toán cho đặt lịch này. Vui lòng thử lại sau.');
    }
  }, []);

  useEffect(() => {
    if (booking?.bookingId) {
      setPreview(null);
      setCouponCodeInput('');
      setAppliedCoupon(null);
      setErrorMsg(null);
      setIsLoadingPreview(true);
      fetchPreview(booking.bookingId).finally(() => setIsLoadingPreview(false));
    }
  }, [booking, fetchPreview]);

  if (!booking) return null;

  // B3: Khi nhấn "Áp dụng" mã giảm giá
  const handleApplyCoupon = async () => {
    const code = couponCodeInput.trim();
    if (!code) return;
    setIsApplyingCoupon(true);
    await fetchPreview(booking.bookingId, code);
    setIsApplyingCoupon(false);
  };

  // B4: Khi nhấn "Thanh toán"
  const handleCheckout = async () => {
    setIsSubmittingPayment(true);
    try {
      const payment = await bookingRepo.checkout(booking.bookingId, appliedCoupon || undefined);
      const targetUrl = payment.checkoutUrl || payment.paymentLink;
      if (targetUrl) {
        window.location.assign(targetUrl);
      } else {
        showError('Không nhận được liên kết thanh toán từ hệ thống.', { title: 'Lỗi thanh toán' });
      }
    } catch (error) {
      showError(error, { title: 'Thanh toán thất bại' });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <Modal open title="Thanh toán lịch đặt" onClose={onClose}>
      {isLoadingPreview ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-text-muted">Đang tải thông tin chi phí thanh toán...</p>
        </div>
      ) : errorMsg ? (
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-danger-soft p-4 text-sm text-danger">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          {/* Thông tin Booking */}
          <div className="rounded-2xl border border-border-color/80 bg-slate-50/70 p-4 space-y-3">
            <div className="flex flex-col gap-1">
              <strong className="text-base font-bold text-text-main">
                {booking.serviceTitle || 'Dịch vụ mentoring'}
              </strong>
              <span className="text-sm text-text-muted">
                Mentor: <strong className="text-text-main">{booking.mentorDisplayName || 'Mentor'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted border-t border-border-light pt-2">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span>{formatSchedule(booking.selectedStartTime)}</span>
            </div>
          </div>

          {/* Ô nhập Mã giảm giá (B1 & B3) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-text-muted tracking-wider block">
              Mã giảm giá
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <TextField
                  placeholder="Nhập mã giảm giá (ví dụ: WELCOME10)"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  disabled={isApplyingCoupon || isSubmittingPayment}
                />
              </div>
              <Button
                variant="outline"
                className="h-11 shrink-0 px-4 font-medium"
                leftIcon={<Tag className="h-4 w-4 text-primary" />}
                onClick={() => void handleApplyCoupon()}
                disabled={!couponCodeInput.trim() || isApplyingCoupon || isSubmittingPayment}
              >
                {isApplyingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
              </Button>
            </div>
            {appliedCoupon && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <CheckCircle className="h-3.5 w-3.5" /> Đã áp dụng mã: <strong>{appliedCoupon}</strong>
              </p>
            )}
          </div>

          {/* Chi tiết Chi phí */}
          <div className="rounded-2xl border border-border-color bg-white p-4 space-y-3 shadow-2xs">
            {/* Nếu ĐÃ áp dụng coupon (B3): Hiển thị đầy đủ các trường phân rã */}
            {appliedCoupon && preview ? (
              <div className="space-y-2 text-sm text-text-secondary border-b border-border-light pb-3">
                <div className="flex justify-between items-center">
                  <span>Giá dịch vụ ban đầu:</span>
                  <span className="font-semibold text-text-main">{formatScoin(preview.priceBeforeDiscountScoin)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Giá dịch vụ:</span>
                  <span className="font-semibold text-text-main">{formatScoin(preview.priceScoin)}</span>
                </div>
                {preview.couponDiscountScoin > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>Giảm giá từ coupon:</span>
                    <span className="font-semibold">-{formatScoin(preview.couponDiscountScoin)}</span>
                  </div>
                )}
                {preview.campaignCreditAppliedScoin > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>Credit chiến dịch áp dụng:</span>
                    <span className="font-semibold">-{formatScoin(preview.campaignCreditAppliedScoin)}</span>
                  </div>
                )}
                {preview.userCreditAppliedScoin > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>Credit tài khoản áp dụng:</span>
                    <span className="font-semibold">-{formatScoin(preview.userCreditAppliedScoin)}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* B2: Ban đầu chỉ hiện giá booking (estimatedFinalPayableScoin) & Thời hạn thanh toán (paymentDeadlineAt) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <span className="text-sm font-semibold text-text-main">Giá thanh toán dự kiến:</span>
              <span className="text-xl font-black text-primary">
                {formatScoin(preview?.estimatedFinalPayableScoin)}
              </span>
            </div>

            {preview?.paymentDeadlineAt && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200/70">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Thời hạn thanh toán: <strong className="font-bold">{formatDeadline(preview.paymentDeadlineAt)}</strong>
                </span>
              </div>
            )}

            {preview?.disclaimer && (
              <p className="text-xs text-text-muted italic pt-1">{preview.disclaimer}</p>
            )}
          </div>

          {/* Footer Action Buttons */}
          <footer className="mt-2 flex flex-wrap justify-end gap-2 border-t border-border-light pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmittingPayment}>
              Hủy
            </Button>
            <Button
              leftIcon={<CreditCard className="h-4 w-4" />}
              onClick={() => void handleCheckout()}
              disabled={isSubmittingPayment || !preview}
            >
              {isSubmittingPayment ? 'Đang chuyển tới payOS...' : 'Thanh toán'}
            </Button>
          </footer>
        </div>
      )}
    </Modal>
  );
}
