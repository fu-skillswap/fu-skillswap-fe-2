/**
 * @file DocumentUploadSection.tsx
 * @description Sub-component hiển thị Phần Tải lên Minh chứng (gồm Minh chứng FPTU & Tối đa 3 Chứng chỉ chuyên môn).
 * Hỗ trợ hiển thị cả file local vừa chọn và danh sách file đã tải lên từ API GET /api/me/mentor-verification.
 */

'use client';

import React, { useRef } from 'react';
import {
  Upload,
  FileCheck,
  X,
  FileText,
  Award,
  GraduationCap,
  Plus,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import type { MentorVerificationResponse } from '@/models/auth';

interface DocumentUploadSectionProps {
  selectedFptuFile: File | null;
  onSelectFptuFile: (file: File | null) => void;
  selectedExpertiseFiles: File[];
  onAddExpertiseFiles: (files: File[]) => void;
  onRemoveExpertiseFile: (index: number) => void;
  verificationData?: MentorVerificationResponse | null;
  disabled?: boolean;
  fptuError?: string | null;
  expertiseError?: string | null;
}

export function DocumentUploadSection({
  selectedFptuFile,
  onSelectFptuFile,
  selectedExpertiseFiles,
  onAddExpertiseFiles,
  onRemoveExpertiseFile,
  verificationData,
  disabled,
  fptuError,
  expertiseError,
}: DocumentUploadSectionProps) {
  const fptuInputRef = useRef<HTMLInputElement | null>(null);
  const expertiseInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleExpertiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAddExpertiseFiles(files);
      if (expertiseInputRef.current) {
        expertiseInputRef.current.value = '';
      }
    }
  };

  // Lấy các file đã nộp trước đó từ API /api/me/mentor-verification
  const existingFptuDoc = verificationData?.documents?.find(
    (d) => d.documentType === 'FPTU_AFFILIATION_PROOF' && d.isActive !== false,
  );
  const existingExpertiseDocs =
    verificationData?.documents?.filter(
      (d) => d.documentType === 'EXPERTISE_PROOF' && d.isActive !== false,
    ) || [];

  return (
    <fieldset
      disabled={disabled}
      className="w-full min-w-0 max-w-full overflow-hidden bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 disabled:opacity-75"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900">Tải lên Minh chứng Xác thực Hồ sơ</h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Tải lên giấy tờ xác nhận bạn là sinh viên hoặc cựu sinh viên Đại học FPT cùng các chứng
          chỉ chuyên môn để hồ sơ được xét duyệt. Hỗ trợ JPG, PNG và PDF, tối đa 15 MB mỗi tệp.
        </p>
      </div>

      {/* Ô 1: MINH CHỨNG SINH VIÊN / CỰU SINH VIÊN FPTU */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-sky-600 shrink-0" />
          <strong className="text-sm font-bold text-slate-900">
            1. Minh chứng Sinh viên / Cựu sinh viên FPTU{' '}
            <span className="text-red-500 font-bold ml-0.5">*</span>
          </strong>
        </div>
        <p className="text-xs text-slate-500">
          Tải lên ảnh thẻ sinh viên, bằng tốt nghiệp hoặc bảng điểm do Đại học FPT cấp để xác nhận
          bạn là sinh viên hoặc cựu sinh viên.
        </p>

        <input
          ref={fptuInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelectFptuFile(f);
          }}
          className="hidden"
          disabled={disabled}
          aria-invalid={Boolean(fptuError)}
          aria-describedby={fptuError ? 'fptu-upload-error' : undefined}
        />

        {/* Hiển thị File FPTU vừa chọn local */}
        {selectedFptuFile ? (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              fptuError ? 'border-red-300 bg-red-50/70' : 'border-sky-200/80 bg-sky-50/70'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                {selectedFptuFile.type.includes('pdf') ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <FileCheck className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <strong className="text-sm font-bold text-sky-800 truncate block">
                  {selectedFptuFile.name}
                </strong>
                <span className="text-xs text-sky-700">
                  {formatFileSize(selectedFptuFile.size)} • Đã chọn — chờ tải lên khi nộp hồ sơ
                </span>
              </div>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={() => {
                  onSelectFptuFile(null);
                  if (fptuInputRef.current) fptuInputRef.current.value = '';
                }}
                className="shrink-0 border-0 bg-red-100 text-red-600 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-red-200 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Chọn lại
              </button>
            )}
          </div>
        ) : existingFptuDoc ? (
          /* Hiển thị File FPTU đã nộp từ API CSDL */
          <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <strong className="text-sm font-bold text-emerald-800 truncate block">
                  {existingFptuDoc.originalFilename || 'Minh chứng sinh viên Đại học FPT'}
                </strong>
                <span className="text-xs text-emerald-600">
                  {formatFileSize(existingFptuDoc.sizeBytes)} • Đã tải lên thành công
                </span>
              </div>
            </div>

            {existingFptuDoc.fileUrl && (
              <a
                href={existingFptuDoc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
              >
                Xem file <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ) : (
          /* Nút chọn file khi chưa có file nào */
          <div
            onClick={() => !disabled && fptuInputRef.current?.click()}
            className={`border-2 border-dashed border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-bold text-slate-800 block">
                Nhấn để chọn file minh chứng FPTU (Thẻ SV, Bảng điểm, Bằng TN)
              </strong>
              <p className="text-xs text-slate-500 mt-0.5">PNG, JPG hoặc PDF (Tối đa 15 MB)</p>
            </div>
          </div>
        )}

        {fptuError && (
          <p
            id="fptu-upload-error"
            role="alert"
            className="m-0 flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-red-600"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{fptuError}</span>
          </p>
        )}
      </div>

      {/* Ô 2: CHỨNG CHỈ / MINH CHỨNG CHUYÊN MÔN (BẮT BUỘC ÍT NHẤT 1 FILE, TỐI ĐA 3 FILES) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600 shrink-0" />
            <strong className="text-sm font-bold text-slate-900">
              2. Chứng chỉ / Minh chứng chuyên môn{' '}
              <span className="text-red-500 font-bold ml-0.5">*</span>
            </strong>
          </div>
          <span className="text-xs font-semibold text-purple-600">
            Đã có {selectedExpertiseFiles.length + existingExpertiseDocs.length}/3 tệp
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Tải lên chứng chỉ, bằng cấp hoặc tài liệu thể hiện năng lực chuyên môn. Cần ít nhất 1 và
          tối đa 3 tệp.
        </p>

        <input
          ref={expertiseInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleExpertiseChange}
          className="hidden"
          disabled={disabled || selectedExpertiseFiles.length + existingExpertiseDocs.length >= 3}
          aria-invalid={Boolean(expertiseError)}
          aria-describedby={expertiseError ? 'expertise-upload-error' : undefined}
        />

        {/* DANH SÁCH FILE ĐÃ NỘP TRÊN CSDL */}
        {existingExpertiseDocs.length > 0 && selectedExpertiseFiles.length === 0 && (
          <div className="space-y-2.5">
            {existingExpertiseDocs.map((doc, index) => (
              <div
                key={doc.id || index}
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  expertiseError
                    ? 'border-red-300 bg-red-50/70'
                    : 'border-purple-200/80 bg-purple-50/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <strong className="text-sm font-bold text-purple-900 truncate block">
                      {doc.originalFilename || `Chứng chỉ chuyên môn #${index + 1}`}
                    </strong>
                    <span className="text-xs text-purple-600">
                      {formatFileSize(doc.sizeBytes)} • Đã tải lên thành công
                    </span>
                  </div>
                </div>

                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 shrink-0"
                  >
                    Xem file <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* DANH SÁCH FILE LOCAL VỪA CHỌN THÊM */}
        {selectedExpertiseFiles.length > 0 && (
          <div className="space-y-2.5">
            {selectedExpertiseFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/70 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    {file.type.includes('pdf') ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <FileCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <strong className="text-sm font-bold text-purple-900 truncate block">
                      {file.name}
                    </strong>
                    <span className="text-xs text-purple-600">
                      {formatFileSize(file.size)} • Đã chọn — chờ tải lên khi nộp hồ sơ
                    </span>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemoveExpertiseFile(index)}
                    className="shrink-0 border-0 bg-red-100 text-red-600 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-red-200 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Xóa
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
            className={`border-2 border-dashed border-purple-200/80 hover:border-purple-300 bg-purple-50/30 hover:bg-purple-50/60 rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col sm:flex-row items-center justify-center gap-3 ${
              selectedExpertiseFiles.length > 0 || existingExpertiseDocs.length > 0 ? 'p-4' : 'p-6'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-lg">
              {selectedExpertiseFiles.length > 0 || existingExpertiseDocs.length > 0 ? (
                <Plus className="w-5 h-5" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <div className="text-center sm:text-left">
              <strong className="text-xs sm:text-sm font-bold text-slate-800 block">
                {selectedExpertiseFiles.length > 0 || existingExpertiseDocs.length > 0
                  ? '+ Thêm file chứng chỉ chuyên môn khác'
                  : 'Nhấn để chọn file chứng chỉ chuyên môn (AWS, IELTS, Coursera,...)'}
              </strong>
              <p className="text-xs text-slate-500 mt-0.5">
                PNG, JPG hoặc PDF (Tối đa 15 MB mỗi tệp, tối đa 3 tệp)
              </p>
            </div>
          </div>
        )}

        {expertiseError && (
          <p
            id="expertise-upload-error"
            role="alert"
            className="m-0 flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-red-600"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{expertiseError}</span>
          </p>
        )}
      </div>
    </fieldset>
  );
}
