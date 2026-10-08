/**
 * @file MentorVerificationDetailView.tsx
 * @description Xem chi tiết và xử lý hồ sơ xác minh mentor.
 */

'use client';

import { AdminLoadingState } from '@/components/domain/admin/AdminLoadingState';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { DocumentPreviewDialog } from '@/components/domain/admin/DocumentPreviewDialog';
import type { MentorVerificationDocument } from '@/models/admin';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ApplicantInfoCard } from './components/ApplicantInfoCard';
import { DecisionPanel } from './components/DecisionPanel';
import { DetailHeader } from './components/DetailHeader';
import { EvidenceCard } from './components/EvidenceCard';
import { RegistrationInfoCard } from './components/RegistrationInfoCard';
import { ReviewDialogs, type ReviewDialog } from './components/ReviewDialogs';
import { ReviewTimeline } from './components/ReviewTimeline';
import styles from './MentorVerificationDetailView.module.css';
import {
  formatFileSize,
  getDocumentTypeLabel,
  getFileKind,
  type ManualCheckKey,
} from './mentorVerificationDetail.constants';
import { useMentorVerificationDetail } from './useMentorVerificationDetail';

const initialManualChecks: Record<ManualCheckKey, boolean> = {
  affiliationMatches: false,
  expertiseValid: false,
  bioClean: false,
};

export function MentorVerificationDetailView({
  locale,
  requestId,
}: {
  locale: string;
  requestId: string;
}) {
  const review = useMentorVerificationDetail(requestId);
  const { detail } = review;
  const [selectedDocument, setSelectedDocument] = useState<MentorVerificationDocument>();
  const [dialog, setDialog] = useState<ReviewDialog>();
  const [note, setNote] = useState('');
  const [manualChecks, setManualChecks] = useState(initialManualChecks);
  const listHref = `/${locale}/admin/mentor-verification`;

  const availableDocumentTypes = useMemo(
    () => new Set(detail?.documents.map((document) => document.documentType)),
    [detail?.documents],
  );

  if (review.loading) return <AdminLoadingState message="Đang tải thông tin hồ sơ mentor..." />;
  if (!detail)
    return (
      <main className="mentor-detail-page">
        <p className="mentor-detail-state">{review.error ?? 'Không tìm thấy hồ sơ.'}</p>
        <Link href={listHref}>Quay lại danh sách</Link>
      </main>
    );

  const openDocumentType = (documentType: string) => {
    const document = detail.documents.find((item) => item.documentType === documentType);
    if (document) setSelectedDocument(document);
  };

  return (
    <main className="mentor-detail-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <Link href={listHref}>Xác minh mentor</Link> <span>›</span>{' '}
          <b>{detail.mentorFullName}</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="mentor-detail-content">
        <Link className="mentor-back-link" href={listHref}>
          <ArrowLeft aria-hidden="true" /> Danh sách xác minh
        </Link>
        <DetailHeader detail={detail} />
        <div className={styles.layout}>
          <div className={styles.content}>
            <ApplicantInfoCard detail={detail} />
            <RegistrationInfoCard detail={detail} />
            <EvidenceCard
              documents={detail.documents}
              onView={setSelectedDocument}
              onDownload={(document) => void review.downloadDocument(document)}
            />
            <ReviewTimeline events={detail.timeline} />
          </div>
          <DecisionPanel
            detail={detail}
            canReview={review.canReview}
            lock={review.lock}
            lockReceivedAt={review.lockReceivedAt}
            lockedByAnotherAdmin={review.lockedByAnotherAdmin}
            isCurrentAdminLockOwner={review.isCurrentAdminLockOwner}
            processingAdmin={review.processingAdmin}
            lockExpiresAt={review.lockExpiresAt}
            isClaiming={review.isClaiming}
            onClaim={() => void review.claimLock()}
            onLockAction={setDialog}
            onLockExpired={review.reloadLock}
            manualChecks={manualChecks}
            onToggleCheck={(key) =>
              setManualChecks((current) => ({ ...current, [key]: !current[key] }))
            }
            availableDocumentTypes={availableDocumentTypes}
            onOpenDocumentType={openDocumentType}
            note={note}
            onNoteChange={setNote}
            onApprove={() => setDialog('approve')}
            onRequestRevision={() => setDialog('revision')}
            onReject={() => setDialog('reject')}
          />
        </div>
        {selectedDocument && (
          <DocumentPreviewDialog
            document={{
              ...selectedDocument,
              meta: `${getDocumentTypeLabel(selectedDocument.documentType)} · ${getFileKind(
                selectedDocument,
              )} · ${formatFileSize(selectedDocument.sizeBytes)}`,
            }}
            resolveUrl={() => review.resolveDocumentUrl(selectedDocument.id)}
            onClose={() => setSelectedDocument(undefined)}
          />
        )}
        {dialog && (
          <ReviewDialogs
            dialog={dialog}
            mentorFullName={detail.mentorFullName}
            initialNote={note}
            onClose={() => setDialog(undefined)}
            onApprove={review.approve}
            onRequestRevision={async (value) => {
              await review.requestRevision(value);
              setNote('');
            }}
            onReject={async (value) => {
              await review.reject(value);
              setNote('');
            }}
            onLockAction={review.updateLock}
          />
        )}
      </div>
    </main>
  );
}
