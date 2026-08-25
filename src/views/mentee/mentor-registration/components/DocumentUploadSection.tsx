/**
 * @file DocumentUploadSection.tsx
 * @description Sub-component hiển thị Phần Tải lên Minh chứng (gồm Minh chứng FPTU & Tối đa 3 Chứng chỉ chuyên môn).
 * Hỗ trợ hiển thị cả file local vừa chọn và danh sách file đã tải lên từ API GET /api/me/mentor-verification.
 */

'use client';

import React, { useRef } from "react";
import { Upload, FileCheck, X, FileText, Award, GraduationCap, Plus, ExternalLink } from "lucide-react";
import type { MentorVerificationResponse } from "@/models/auth";

interface DocumentUploadSectionProps {
  selectedFptuFile: File | null;
  onSelectFptuFile: (file: File | null) => void;
  selectedExpertiseFiles: File[];
  onAddExpertiseFiles: (files: File[]) => void;
  onRemoveExpertiseFile: (index: number) => void;
  verificationData?: MentorVerificationResponse | null;
  disabled?: boolean;
  error?: string | null;
}

export function DocumentUploadSection({
  selectedFptuFile,
  onSelectFptuFile,
  selectedExpertiseFiles,
  onAddExpertiseFiles,
  onRemoveExpertiseFile,
  verificationData,
  disabled,
  error,
}: DocumentUploadSectionProps) {
  const fptuInputRef = useRef<HTMLInputElement | null>(null);
  const expertiseInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleExpertiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAddExpertiseFiles(files);
      if (expertiseInputRef.current) {
        expertiseInputRef.current.value = "";
      }
    }
  };

  // Lấy các file đã nộp trước đó từ API /api/me/mentor-verification
  const existingFptuDoc = verificationData?.documents?.find(
    (d) => d.documentType === "FPTU_AFFILIATION_PROOF" && d.isActive !== false,
  );
  const existingExpertiseDocs = verificationData?.documents?.filter(
    (d) => d.documentType === "EXPERTISE_PROOF" && d.isActive !== false,
  ) || [];

  return (
    <fieldset
      className="card mentor-reg-card"
      disabled={disabled}
      style={{
        border: "1px solid #e2e8f0",
        display: "grid",
        gap: "24px",
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <div>
        <h2 className="mentor-section-title" style={{ margin: 0, marginBottom: "4px" }}>
          Tải lên Minh chứng Xác thực Hồ sơ
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>
          Tải lên tài liệu minh chứng tư cách sinh viên FPTU và các chứng chỉ chuyên môn để Admin đối soát xác thực (Hỗ trợ JPG, PNG, WEBP, PDF - Tối đa 15MB/file).
        </p>
      </div>

      {/* Ô 1: MINH CHỨNG SINH VIÊN / CỰU SINH VIÊN FPTU */}
      <div style={{ display: "grid", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <GraduationCap size={18} color="#0095f6" />
          <strong style={{ fontSize: "14px", color: "#0f172a" }}>
            1. Minh chứng Sinh viên / Cựu sinh viên FPTU <span className="required-asterisk">*</span>
          </strong>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
          Tải lên hình ảnh thẻ sinh viên, bằng tốt nghiệp hoặc bảng điểm FPTU để xác nhận vai trò Mentor (`FPTU_AFFILIATION_PROOF`).
        </p>

        <input
          ref={fptuInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelectFptuFile(f);
          }}
          style={{ display: "none" }}
          disabled={disabled}
        />

        {/* Hiển thị File FPTU vừa chọn local */}
        {selectedFptuFile ? (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedFptuFile.type.includes("pdf") ? <FileText size={18} /> : <FileCheck size={18} />}
              </div>
              <div>
                <strong style={{ fontSize: "13px", color: "#15803d", display: "block" }}>
                  {selectedFptuFile.name}
                </strong>
                <span style={{ fontSize: "12px", color: "#166534" }}>
                  {formatFileSize(selectedFptuFile.size)} • FPTU Affiliation Proof (File mới)
                </span>
              </div>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={() => {
                  onSelectFptuFile(null);
                  if (fptuInputRef.current) fptuInputRef.current.value = "";
                }}
                style={{
                  border: "none",
                  background: "#fee2e2",
                  color: "#ef4444",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <X size={14} /> Chọn lại
              </button>
            )}
          </div>
        ) : existingFptuDoc ? (
          /* Hiển thị File FPTU đã nộp từ API CSDL */
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileCheck size={18} />
              </div>
              <div>
                <strong style={{ fontSize: "13px", color: "#15803d", display: "block" }}>
                  {existingFptuDoc.originalFilename || "FPTU_AFFILIATION_PROOF"}
                </strong>
                <span style={{ fontSize: "12px", color: "#166534" }}>
                  {formatFileSize(existingFptuDoc.sizeBytes)} • Đã nộp thành công (Trạng thái: {existingFptuDoc.status || "UPLOADED"})
                </span>
              </div>
            </div>

            {existingFptuDoc.fileUrl && (
              <a
                href={existingFptuDoc.fileUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#16a34a",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Xem file <ExternalLink size={14} />
              </a>
            )}
          </div>
        ) : (
          /* Nút chọn file khi chưa có file nào */
          <div
            onClick={() => !disabled && fptuInputRef.current?.click()}
            style={{
              border: "2px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "24px 20px",
              textAlign: "center",
              background: disabled ? "#f8fafc" : "#f1f5f9",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#ebf5fe",
                color: "#0095f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Upload size={20} />
            </div>
            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                Nhấn để chọn file minh chứng FPTU (Thẻ SV, Bảng điểm, Bằng TN)
              </strong>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                PNG, JPG, WEBP hoặc PDF (Tối đa 15MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Ô 2: CHỨNG CHỈ / MINH CHỨNG CHUYÊN MÔN (BẮT BUỘC ÍT NHẤT 1 FILE, TỐI ĐA 3 FILES) */}
      <div style={{ display: "grid", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Award size={18} color="#8b5cf6" />
            <strong style={{ fontSize: "14px", color: "#0f172a" }}>
              2. Chứng chỉ / Minh chứng chuyên môn <span className="required-asterisk">*</span>
            </strong>
          </div>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#8b5cf6" }}>
            Đã có {selectedExpertiseFiles.length + existingExpertiseDocs.length}/3 file
          </span>
        </div>

        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
          Tải lên các chứng chỉ quốc tế, bằng cấp chuyên ngành hoặc chứng nhận năng lực chuyên môn (`EXPERTISE_PROOF`). Bắt buộc từ 1 đến 3 files.
        </p>

        <input
          ref={expertiseInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleExpertiseChange}
          style={{ display: "none" }}
          disabled={disabled || selectedExpertiseFiles.length + existingExpertiseDocs.length >= 3}
        />

        {/* DANH SÁCH FILE ĐÃ NỘP TRÊN CSDL */}
        {existingExpertiseDocs.length > 0 && selectedExpertiseFiles.length === 0 && (
          <div style={{ display: "grid", gap: "10px" }}>
            {existingExpertiseDocs.map((doc, index) => (
              <div
                key={doc.id || index}
                style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid #ddd6fe",
                  background: "#faf5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "#f3e8ff",
                      color: "#7c3aed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileCheck size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px", color: "#6d28d9", display: "block" }}>
                      {doc.originalFilename || `Chứng chỉ chuyên môn #${index + 1}`}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#5b21b6" }}>
                      {formatFileSize(doc.sizeBytes)} • Đã nộp thành công (Trạng thái: {doc.status || "UPLOADED"})
                    </span>
                  </div>
                </div>

                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#7c3aed",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    Xem file <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* DANH SÁCH FILE LOCAL VỪA CHỌN THÊM */}
        {selectedExpertiseFiles.length > 0 && (
          <div style={{ display: "grid", gap: "10px" }}>
            {selectedExpertiseFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid #ddd6fe",
                  background: "#faf5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "#f3e8ff",
                      color: "#7c3aed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {file.type.includes("pdf") ? <FileText size={18} /> : <FileCheck size={18} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px", color: "#6d28d9", display: "block" }}>
                      {file.name}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#5b21b6" }}>
                      {formatFileSize(file.size)} • Expertise Proof #{index + 1} (File mới)
                    </span>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemoveExpertiseFile(index)}
                    style={{
                      border: "none",
                      background: "#fee2e2",
                      color: "#ef4444",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <X size={14} /> Xóa
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* NÚT THÊM FILE KHI CHƯA ĐỦ 3 FILES VÀ CHƯA BỊ DISABLED */}
        {!disabled && selectedExpertiseFiles.length + existingExpertiseDocs.length < 3 && (
          <div
            onClick={() => expertiseInputRef.current?.click()}
            style={{
              border: "2px dashed #cbd5e1",
              borderRadius: "12px",
              padding: selectedExpertiseFiles.length > 0 || existingExpertiseDocs.length > 0 ? "16px" : "24px 20px",
              textAlign: "center",
              background: "#faf5ff",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: selectedExpertiseFiles.length > 0 || existingExpertiseDocs.length > 0 ? "row" : "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: selectedExpertiseFiles.length > 0 || existingExpertiseDocs.length > 0 ? "32px" : "40px",
                height: selectedExpertiseFiles.length > 0 || existingExpertiseDocs.length > 0 ? "32px" : "40px",
                borderRadius: "50%",
                background: "#f3e8ff",
                color: "#8b5cf6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selectedExpertiseFiles.length > 0 || existingExpertiseDocs.length > 0 ? <Plus size={18} /> : <Upload size={20} />}
            </div>
            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                {selectedExpertiseFiles.length > 0 || existingExpertiseDocs.length > 0
                  ? "+ Thêm file chứng chỉ chuyên môn khác"
                  : "Nhấn để chọn file chứng chỉ chuyên môn (AWS, IELTS, Coursera,...)"}
              </strong>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                PNG, JPG, WEBP hoặc PDF (Tối đa 15MB/file - Tối đa 3 files)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="error" style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
