/**
 * @file useDocumentUpload.ts
 * @description Sub-hook quản lý State chọn file minh chứng và quy trình Upload S3/GCS qua mentorProfileRepo.
 */

"use client";

import { useState } from "react";
import { mentorProfileRepo } from "@/repositories/mentorProfileRepo";

export function useDocumentUpload() {
  const [selectedFptuFile, setSelectedFptuFile] = useState<File | null>(null);
  const [selectedExpertiseFiles, setSelectedExpertiseFiles] = useState<File[]>([]);

  const handleAddExpertiseFiles = (newFiles: File[]) => {
    setSelectedExpertiseFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 3) {
        return combined.slice(0, 3);
      }
      return combined;
    });
  };

  const handleRemoveExpertiseFile = (index: number) => {
    setSelectedExpertiseFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Thực hiện upload file minh chứng FPTU và các chứng chỉ chuyên môn lên máy chủ qua S3/GCS Upload Intent
   */
  const uploadAllDocuments = async () => {
    // 1. Upload minh chứng FPTU (nếu có chọn file mới)
    if (selectedFptuFile) {
      try {
        const fptuIntent = await mentorProfileRepo.createUploadIntent({
          filename: selectedFptuFile.name,
          contentType: selectedFptuFile.type || "application/octet-stream",
          sizeBytes: selectedFptuFile.size,
        });

        await mentorProfileRepo.uploadFileToUrl(
          fptuIntent.uploadUrl,
          selectedFptuFile,
          fptuIntent.requiredHeaders,
        );

        await mentorProfileRepo.confirmDocument({
          documentType: "FPTU_AFFILIATION_PROOF",
          uploadIntentId: fptuIntent.uploadIntentId,
        });
      } catch (fptuErr) {
        console.warn("Bỏ qua lỗi file FPTU nếu đã có file active:", fptuErr);
      }
    }

    // 2. Upload danh sách minh chứng chuyên môn (EXPERTISE_PROOF)
    if (selectedExpertiseFiles && selectedExpertiseFiles.length > 0) {
      for (const expFile of selectedExpertiseFiles) {
        try {
          const expIntent = await mentorProfileRepo.createUploadIntent({
            filename: expFile.name,
            contentType: expFile.type || "application/octet-stream",
            sizeBytes: expFile.size,
          });

          await mentorProfileRepo.uploadFileToUrl(
            expIntent.uploadUrl,
            expFile,
            expIntent.requiredHeaders,
          );

          await mentorProfileRepo.confirmDocument({
            documentType: "EXPERTISE_PROOF",
            uploadIntentId: expIntent.uploadIntentId,
          });
        } catch (expErr) {
          console.warn("Lỗi upload file minh chứng chuyên môn:", expErr);
        }
      }
    }
  };

  return {
    selectedFptuFile,
    setSelectedFptuFile,
    selectedExpertiseFiles,
    onAddExpertiseFiles: handleAddExpertiseFiles,
    onRemoveExpertiseFile: handleRemoveExpertiseFile,
    uploadAllDocuments,
  };
}
