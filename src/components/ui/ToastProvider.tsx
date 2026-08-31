/**
 * @file ToastProvider.tsx
 * @description Component Provider toàn cục cung cấp Hộp thoại Toast thông báo và Modal xác nhận cảnh báo dùng chung.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AlertTriangle, Info, X } from 'lucide-react';
import { registerConfirmHandler, type ConfirmOptions } from '@/utils/toast';

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  useEffect(() => {
    registerConfirmHandler((options: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        setConfirmState({
          ...options,
          resolve,
        });
      });
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  const getVariantStyles = (variant: ConfirmOptions['variant'] = 'danger') => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle size={24} color="#ef4444" />,
          iconBg: '#fee2e2',
          btnColor: '#dc2626',
          titleColor: '#991b1b',
          badge: 'CẢNH BÁO NGUY HIỂM',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} color="#f59e0b" />,
          iconBg: '#fef3c7',
          btnColor: '#d97706',
          titleColor: '#92400e',
          badge: 'XÁC NHẬN THAO TÁC',
        };
      case 'info':
      default:
        return {
          icon: <Info size={24} color="#3b82f6" />,
          iconBg: '#dbeafe',
          btnColor: '#2563eb',
          titleColor: '#1e40af',
          badge: 'THÔNG BÁO',
        };
    }
  };

  const variantStyle = confirmState ? getVariantStyles(confirmState.variant) : null;

  return (
    <>
      {children}

      {/* CONTAINER THÔNG BÁO TOAST */}
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{
          top: 24,
          right: 24,
          zIndex: 100000,
        }}
        toastOptions={{
          duration: 5000,
          style: {
            maxWidth: 'none',
            padding: 0,
            background: 'transparent',
            boxShadow: 'none',
          },
        }}
      />

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmState && variantStyle && (
        <div
          className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => handleClose(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 grid gap-4 border border-solid border-border-light"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: variantStyle.iconBg }}
                >
                  {variantStyle.icon}
                </div>
                <div>
                  <span
                    className="text-[11px] font-extrabold tracking-wider block mb-0.5"
                    style={{ color: variantStyle.titleColor }}
                  >
                    {variantStyle.badge}
                  </span>
                  <h3 className="m-0 text-base font-bold text-text-main">
                    {confirmState.title || 'Xác nhận thao tác'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="border-none bg-transparent text-text-muted hover:text-text-main cursor-pointer p-1 rounded-md flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="m-0 text-sm text-text-secondary leading-relaxed">
              {confirmState.message}
            </p>

            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="px-4 py-2 rounded-xl border border-solid border-border-strong bg-white text-text-secondary font-semibold text-sm cursor-pointer hover:bg-surface-subtle transition-colors"
              >
                {confirmState.cancelText || 'Hủy bỏ'}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className="px-5 py-2 rounded-xl border-none text-white font-bold text-sm cursor-pointer shadow-xs transition-colors"
                style={{ background: variantStyle.btnColor }}
              >
                {confirmState.confirmText || 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
