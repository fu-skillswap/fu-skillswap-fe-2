/**
 * @file useMentorVerificationDetail.ts
 * @description Tải hồ sơ xác minh mentor, trạng thái giữ hồ sơ và các thao tác xử lý.
 */

'use client';

import type {
  MentorVerificationDocument,
  MentorVerificationLock,
  MentorVerificationRequestDetail,
} from '@/models/admin';
import { useAuth } from '@/providers/AuthProvider';
import { adminRepo } from '@/repositories/adminRepo';
import { getUserFriendlyErrorMessage, showError } from '@/utils/toast';
import { useCallback, useEffect, useState } from 'react';

export type LockAction = 'release' | 'refresh';

export function useMentorVerificationDetail(requestId: string) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<MentorVerificationRequestDetail>();
  const [lock, setLockState] = useState<MentorVerificationLock>();
  /** Client time when `lock.secondsRemaining` was received, used for the countdown. */
  const [lockReceivedAt, setLockReceivedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isClaiming, setIsClaiming] = useState(false);

  const setLock = useCallback((value: MentorVerificationLock) => {
    setLockState(value);
    setLockReceivedAt(Date.now());
  }, []);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [requestDetail, lockDetail] = await Promise.all([
        adminRepo.getMentorVerificationRequest(requestId),
        adminRepo.getMentorVerificationLock(requestId),
      ]);
      setDetail(requestDetail);
      setLock(lockDetail);
    } catch (reason) {
      setError(getUserFriendlyErrorMessage(reason, 'Không thể tải chi tiết hồ sơ mentor.'));
    } finally {
      setLoading(false);
    }
  }, [requestId, setLock]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const reloadLock = useCallback(async () => {
    try {
      setLock(await adminRepo.getMentorVerificationLock(requestId));
    } catch {
      // Keep showing the last known lock state; the next action reports the error.
    }
  }, [requestId, setLock]);

  // TODO(api): explicit "claim lock" endpoint. Reading the lock is what grants it today.
  const claimLock = async () => {
    setIsClaiming(true);
    try {
      setLock(await adminRepo.getMentorVerificationLock(requestId));
    } catch (reason) {
      showError(reason, { title: 'Không thể nhận xử lý hồ sơ' });
    } finally {
      setIsClaiming(false);
    }
  };

  /** Throws on failure so the confirm dialog can show the error. */
  const updateLock = async (action: LockAction) => {
    setLock(
      action === 'release'
        ? await adminRepo.releaseMentorVerificationLock(requestId)
        : await adminRepo.refreshMentorVerificationLock(requestId),
    );
  };

  const approve = async () => {
    setDetail(await adminRepo.approveMentorVerification(requestId));
  };

  const requestRevision = async (note: string) => {
    setDetail(await adminRepo.requestMentorRevision(requestId, note));
  };

  const reject = async (note: string) => {
    setDetail(await adminRepo.rejectMentorVerification(requestId, note));
  };

  // `fileUrl` is an internal private:// reference: always ask the API for a fresh signed URL.
  const resolveDocumentUrl = useCallback(
    async (documentId: string) =>
      (await adminRepo.getMentorVerificationDocumentDownload(requestId, documentId)).downloadUrl,
    [requestId],
  );

  const downloadDocument = async (document: MentorVerificationDocument) => {
    try {
      const signedUrl = await resolveDocumentUrl(document.id);
      const anchor = window.document.createElement('a');
      anchor.download = document.originalFilename;
      anchor.rel = 'noreferrer';
      try {
        const response = await fetch(signedUrl, { credentials: 'omit' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        anchor.href = URL.createObjectURL(await response.blob());
      } catch {
        // Storage without CORS for this origin: let the browser download the signed URL itself.
        anchor.href = signedUrl;
        anchor.target = '_blank';
      }
      anchor.click();
      if (anchor.href.startsWith('blob:')) {
        const objectUrl = anchor.href;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
    } catch (reason) {
      showError(reason, { title: 'Không tải được tài liệu' });
    }
  };

  const lockedByAnotherAdmin = Boolean(lock?.locked && !lock.canReview);
  const isCurrentAdminLockOwner = Boolean(lock?.locked && lock.lockedByAdminId === user?.id);
  const processingAdmin = lock
    ? lock.locked
      ? lock.lockedByAdminFullName || lock.lockedByAdminEmail
      : null
    : (detail?.lockedByAdminEmail ?? null);
  const lockExpiresAt = lock
    ? lock.locked
      ? lock.lockExpiresAt
      : null
    : (detail?.lockExpiresAt ?? null);

  return {
    detail,
    lock,
    lockReceivedAt,
    loading,
    error,
    lockedByAnotherAdmin,
    isCurrentAdminLockOwner,
    canReview: Boolean(detail?.canReview) && !lockedByAnotherAdmin,
    processingAdmin,
    lockExpiresAt,
    isClaiming,
    claimLock,
    reloadLock,
    updateLock,
    approve,
    requestRevision,
    reject,
    resolveDocumentUrl,
    downloadDocument,
  };
}
