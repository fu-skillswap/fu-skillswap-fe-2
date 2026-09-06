/**
 * @file useDocumentUpload.ts
 * @description Sub-hook quản lý State chọn file minh chứng và quy trình Upload S3/GCS qua mentorProfileRepo.
 */

'use client';

import { useState } from 'react';
import type { ConfirmDocumentRequest } from '@/models/auth';
import { ApiClientError } from '@/models/apiClient';
import { mentorProfileRepo } from '@/repositories/mentorProfileRepo';

export class DocumentUploadError extends Error {
  constructor(
    readonly documentType: 'fptu' | 'expertise',
    message: string,
  ) {
    super(message);
    this.name = 'DocumentUploadError';
  }
}

const isMissingUploadIntentError = (error: unknown) => {
  if (!(error instanceof ApiClientError)) return false;
  const message = error.message.toLocaleLowerCase('vi');
  return message.includes('upload intent') && message.includes('không tìm thấy');
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const confirmDocumentWithRetry = async (data: ConfirmDocumentRequest) => {
  const retryDelays = [0, 350, 800];

  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt] > 0) await wait(retryDelays[attempt]);

    try {
      await mentorProfileRepo.confirmDocument(data);
      return;
    } catch (error) {
      const canRetry = isMissingUploadIntentError(error) && attempt < retryDelays.length - 1;
      if (!canRetry) throw error;
    }
  }
};

const getUploadErrorMessage = (label: string, error: unknown) => {
  if (isMissingUploadIntentError(error)) {
    return `Hệ thống chưa thể hoàn tất việc tải ${label} lúc này. File của bạn vẫn được giữ trong biểu mẫu; vui lòng chờ một lát rồi bấm nộp hồ sơ lại.`;
  }

  if (error instanceof ApiClientError && error.status === 400) {
    return `${label} chưa được hệ thống chấp nhận. Vui lòng kiểm tra file đúng định dạng JPG, PNG hoặc PDF, dung lượng không quá 15 MB rồi thử lại.`;
  }

  if (error instanceof ApiClientError && error.code === 'NETWORK_ERROR') {
    return `Kết nối bị gián đoạn khi tải ${label}. File của bạn vẫn được giữ; vui lòng kiểm tra mạng và thử lại.`;
  }

  return `Chưa thể tải ${label} lên hệ thống. File của bạn vẫn được giữ; vui lòng thử lại sau ít phút.`;
};

export function useDocumentUpload() {
  const [selectedFptuFile, setSelectedFptuFile] = useState<File | null>(null);
  const [selectedExpertiseFiles, setSelectedExpertiseFiles] = useState<File[]>([]);
  const [fptuUploadError, setFptuUploadError] = useState<string | null>(null);
  const [expertiseUploadError, setExpertiseUploadError] = useState<string | null>(null);

  const handleSelectFptuFile = (file: File | null) => {
    setSelectedFptuFile(file);
    setFptuUploadError(null);
  };

  const handleAddExpertiseFiles = (newFiles: File[]) => {
    setExpertiseUploadError(null);
    setSelectedExpertiseFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 3) {
        return combined.slice(0, 3);
      }
      return combined;
    });
  };

  const handleRemoveExpertiseFile = (index: number) => {
    setExpertiseUploadError(null);
    setSelectedExpertiseFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Thực hiện upload file minh chứng FPTU và các chứng chỉ chuyên môn lên máy chủ qua S3/GCS Upload Intent
   */
  const uploadAllDocuments = async () => {
    setFptuUploadError(null);
    setExpertiseUploadError(null);

    // 1. Upload minh chứng FPTU (nếu có chọn file mới)
    if (selectedFptuFile) {
      try {
        const fptuIntent = await mentorProfileRepo.createUploadIntent({
          filename: selectedFptuFile.name,
          contentType: selectedFptuFile.type || 'application/octet-stream',
          sizeBytes: selectedFptuFile.size,
        });

        await mentorProfileRepo.uploadFileToUrl(
          fptuIntent.uploadUrl,
          selectedFptuFile,
          fptuIntent.requiredHeaders,
        );

        await confirmDocumentWithRetry({
          documentType: 'FPTU_AFFILIATION_PROOF',
          uploadIntentId: fptuIntent.uploadIntentId,
        });
      } catch (fptuErr) {
        const message = getUploadErrorMessage('minh chứng FPTU', fptuErr);
        setFptuUploadError(message);
        throw new DocumentUploadError('fptu', message);
      }
    }

    // 2. Upload danh sách minh chứng chuyên môn (EXPERTISE_PROOF)
    if (selectedExpertiseFiles && selectedExpertiseFiles.length > 0) {
      for (const expFile of selectedExpertiseFiles) {
        try {
          const expIntent = await mentorProfileRepo.createUploadIntent({
            filename: expFile.name,
            contentType: expFile.type || 'application/octet-stream',
            sizeBytes: expFile.size,
          });

          await mentorProfileRepo.uploadFileToUrl(
            expIntent.uploadUrl,
            expFile,
            expIntent.requiredHeaders,
          );

          await confirmDocumentWithRetry({
            documentType: 'EXPERTISE_PROOF',
            uploadIntentId: expIntent.uploadIntentId,
          });
        } catch (expErr) {
          const message = getUploadErrorMessage('minh chứng chuyên môn', expErr);
          setExpertiseUploadError(message);
          throw new DocumentUploadError('expertise', message);
        }
      }
    }
  };

  return {
    selectedFptuFile,
    setSelectedFptuFile: handleSelectFptuFile,
    fptuUploadError,
    setFptuUploadError,
    selectedExpertiseFiles,
    expertiseUploadError,
    setExpertiseUploadError,
    onAddExpertiseFiles: handleAddExpertiseFiles,
    onRemoveExpertiseFile: handleRemoveExpertiseFile,
    uploadAllDocuments,
  };
}
