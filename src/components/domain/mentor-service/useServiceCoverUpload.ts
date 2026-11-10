/**
 * @file useServiceCoverUpload.ts
 * @description Cover image state for the service editor: client checks, upload intent → PUT to the
 * signed URL → confirm. The resulting `assetId` is only attached to the service on save.
 */

'use client';

import type { MentorServiceCoverUploadIntentResponse } from '@/models/auth';
import { mentorServiceRepo } from '@/repositories/mentorServiceRepo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { COVER_FILENAME_MAX, COVER_MAX_BYTES, COVER_TYPES } from './serviceLimits';

export type CoverUploadStatus = 'idle' | 'uploading' | 'error';

const isExpired = (intent: MentorServiceCoverUploadIntentResponse) => {
  const expiresAt = Date.parse(intent.expiresAt);
  return Number.isFinite(expiresAt) && Date.now() > expiresAt;
};

/** Keeps the extension while fitting the backend 180-character filename limit. */
const clampFilename = (name: string) => {
  const chars = [...name];
  if (chars.length <= COVER_FILENAME_MAX) return name;
  const dot = name.lastIndexOf('.');
  const extension = dot > 0 ? name.slice(dot) : '';
  return [...name.slice(0, dot > 0 ? dot : undefined)]
    .slice(0, COVER_FILENAME_MAX - [...extension].length)
    .join('')
    .concat(extension);
};

export function useServiceCoverUpload(initialUrl: string | null | undefined) {
  const [coverUrl, setCoverUrl] = useState<string | null>(initialUrl ?? null);
  const [coverAssetId, setCoverAssetId] = useState<string>();
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [status, setStatus] = useState<CoverUploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState<string>();
  const failedFileRef = useRef<File | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** Resets to the saved state of a (re)loaded service. */
  const reset = useCallback((url: string | null | undefined) => {
    setCoverUrl(url ?? null);
    setCoverAssetId(undefined);
    setRemoveCoverImage(false);
    setStatus('idle');
    setProgress(0);
    setValidationError(undefined);
    failedFileRef.current = null;
  }, []);

  const upload = useCallback(async (file: File) => {
    setStatus('uploading');
    setProgress(0);
    setValidationError(undefined);
    failedFileRef.current = null;

    const requestIntent = () =>
      mentorServiceRepo.createCoverUploadIntent({
        filename: clampFilename(file.name || 'cover'),
        contentType: file.type,
      });

    try {
      let intent = await requestIntent();
      let retried = false;
      // An intent that expired before PUT/confirm is replaced once with a fresh one.
      for (;;) {
        try {
          if (isExpired(intent)) throw new Error('UPLOAD_INTENT_EXPIRED');
          await mentorServiceRepo.uploadCoverFile(intent, file, (percent) => {
            if (mountedRef.current) setProgress(percent);
          });
          if (isExpired(intent)) throw new Error('UPLOAD_INTENT_EXPIRED');
          const asset = await mentorServiceRepo.confirmCoverUpload(intent.uploadIntentId);
          if (!mountedRef.current) return;
          setCoverUrl(asset.publicUrl);
          setCoverAssetId(asset.assetId);
          setRemoveCoverImage(false);
          setStatus('idle');
          return;
        } catch (reason) {
          if (retried || !isExpired(intent)) throw reason;
          retried = true;
          intent = await requestIntent();
          if (mountedRef.current) setProgress(0);
        }
      }
    } catch {
      // Raw axios errors carry headers; only keep the file for the retry button.
      if (!mountedRef.current) return;
      failedFileRef.current = file;
      setStatus('error');
    }
  }, []);

  const selectFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!(COVER_TYPES as readonly string[]).includes(file.type)) {
        setValidationError('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
        return;
      }
      if (file.size > COVER_MAX_BYTES) {
        setValidationError('Ảnh lớn hơn 2 MB. Hãy chọn ảnh nhỏ hơn.');
        return;
      }
      void upload(file);
    },
    [upload],
  );

  const retry = useCallback(() => {
    if (failedFileRef.current) void upload(failedFileRef.current);
  }, [upload]);

  /** Marks the cover for removal; applied when the service is saved. */
  const remove = useCallback(() => {
    setCoverUrl(null);
    setCoverAssetId(undefined);
    setRemoveCoverImage(true);
    setStatus('idle');
    setValidationError(undefined);
    failedFileRef.current = null;
  }, []);

  return {
    coverUrl,
    coverAssetId,
    removeCoverImage,
    status,
    progress,
    validationError,
    isUploading: status === 'uploading',
    selectFile,
    retry,
    remove,
    reset,
  };
}

export type ServiceCoverUploadState = ReturnType<typeof useServiceCoverUpload>;
