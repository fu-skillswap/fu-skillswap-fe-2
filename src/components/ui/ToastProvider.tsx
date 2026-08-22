/**
 * @file ToastProvider.tsx
 * @description Component Provider toàn cục cung cấp Hộp thoại Toast thông báo và Modal xác nhận cảnh báo dùng chung.
 */

"use client";

import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { AlertTriangle, Info, X } from "lucide-react";
import { registerConfirmHandler, type ConfirmOptions } from "@/utils/toast";

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

  const getVariantStyles = (variant: ConfirmOptions["variant"] = "danger") => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle size={24} color="#ef4444" />,
          iconBg: "#fee2e2",
          btnColor: "#dc2626",
          titleColor: "#991b1b",
          badge: "CẢNH BÁO NGUY HIỂM",
        };
      case "warning":
        return {
          icon: <AlertTriangle size={24} color="#f59e0b" />,
          iconBg: "#fef3c7",
          btnColor: "#d97706",
          titleColor: "#92400e",
          badge: "XÁC NHẬN THAO TÁC",
        };
      case "info":
      default:
        return {
          icon: <Info size={24} color="#3b82f6" />,
          iconBg: "#dbeafe",
          btnColor: "#2563eb",
          titleColor: "#1e40af",
          badge: "THÔNG BÁO",
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
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#0f172a",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: 500,
            maxWidth: "420px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
            style: {
              borderLeft: "4px solid #10b981",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
            style: {
              borderLeft: "4px solid #ef4444",
            },
          },
        }}
      />

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmState && variantStyle && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => handleClose(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "440px",
              padding: "24px",
              display: "grid",
              gap: "16px",
              border: "1px solid #f1f5f9",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: variantStyle.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {variantStyle.icon}
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.5px",
                      color: variantStyle.titleColor,
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    {variantStyle.badge}
                  </span>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                    {confirmState.title || "Xác nhận thao tác"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleClose(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
              {confirmState.message}
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => handleClose(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {confirmState.cancelText || "Hủy bỏ"}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: variantStyle.btnColor,
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                {confirmState.confirmText || "Đồng ý"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
