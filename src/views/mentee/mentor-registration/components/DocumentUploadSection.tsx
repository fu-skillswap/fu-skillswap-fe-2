/**
 * @file DocumentUploadSection.tsx
 * @description Sub-component hiển thị Phần Tải lên Minh chứng (Thẻ sinh viên / Bằng tốt nghiệp FPTU).
 */

'use client';

import React, { useRef } from 'react';
import { Upload, FileCheck, X, FileText } from 'lucide-react';

interface DocumentUploadSectionProps {
  selectedFile: File | null;
  onSelectFile: (file: File | null) => void;
  disabled?: boolean;
  error?: string | null;
}

export function DocumentUploadSection({
  selectedFile,
  onSelectFile,
  disabled,
  error,
}: DocumentUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  const handleRemoveFile = () => {
    onSelectFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <fieldset
      className="card mentor-reg-card"
      disabled={disabled}
      style={{ border: '1px solid #e2e8f0', display: 'grid', gap: '16px' }}
    >
      <h2 className="mentor-section-title">
        Minh chứng Sinh viên / Cựu sinh viên FPTU <span className="required-asterisk">*</span>
      </h2>
      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
        Tải lên hình ảnh thẻ sinh viên, bằng tốt nghiệp hoặc bảng điểm của trường Đại học FPT để xác
        thực vai trò Mentor. (Hỗ trợ định dạng JPG, PNG, WEBP, PDF - Tối đa 15MB).
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {!selectedFile ? (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '32px 20px',
            textAlign: 'center',
            background: disabled ? '#f8fafc' : '#f1f5f9',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#ebf5fe',
              color: '#0095f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Upload size={24} />
          </div>
          <div>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>
              Nhấn để chọn file minh chứng từ máy tính
            </strong>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
              PNG, JPG, WEBP hoặc PDF (Dưới 15MB)
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #bbf7d0',
            background: '#f0fdf4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedFile.type.includes('pdf') ? <FileText size={20} /> : <FileCheck size={20} />}
            </div>
            <div>
              <strong style={{ fontSize: '14px', color: '#15803d', display: 'block' }}>
                {selectedFile.name}
              </strong>
              <span style={{ fontSize: '12px', color: '#166534' }}>
                {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Minh chứng FPTU'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={disabled}
            style={{
              border: 'none',
              background: '#fee2e2',
              color: '#ef4444',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <X size={14} /> Chọn lại
          </button>
        </div>
      )}

      {error && (
        <p className="error" style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
