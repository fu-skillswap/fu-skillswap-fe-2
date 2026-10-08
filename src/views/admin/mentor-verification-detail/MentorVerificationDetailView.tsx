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
import { useRouter } from 'next/navigation';
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
  getChecklistProgress,
  getDocumentTypeLabel,
  getFileKind,
  truncateMiddle,
  type ManualCheckKey,
} from './mentorVerificationDetail.constants';
import { useMentorVerificationDetail } from './useMentorVerificationDetail';

const initialManualChecks: Record<ManualCheckKey, boolean> = {
  affiliationMatches: false,
  expertiseValid: false,
  bioClean: false,
};

function getDocumentMeta(document: MentorVerificationDocument) {
  return `${getFileKind(document)} · ${formatFileSize(document.sizeBytes)} · ${truncateMiddle(
    document.originalFilename,
  )}`;
}

export function MentorVerificationDetailView({
  locale,
  requestId,
}: {
  locale: string;
  requestId: string;
}) {
  const router = useRouter();
  const review = useMentorVerificationDetail(requestId);
  const { detail } = review;
  const [previewIndex, setPreviewIndex] = useState<number>();
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

  const { documents } = detail;
  const previewDocument = previewIndex === undefined ? undefined : documents[previewIndex];
  const checklistProgress = getChecklistProgress(detail.checklist, manualChecks);

  const openDocument = (document: MentorVerificationDocument) =>
    setPreviewIndex(documents.findIndex((item) => item.id === document.id));

  const openDocumentType = (documentType: string) => {
    const index = documents.findIndex((item) => item.documentType === documentType);
    if (index >= 0) setPreviewIndex(index);
  };

  const documentTypeAt = (index: number) =>
    documents[index] ? getDocumentTypeLabel(documents[index].documentType) : undefined;

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
              documents={documents}
              onView={openDocument}
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
        {previewDocument && previewIndex !== undefined && (
          <DocumentPreviewDialog
            document={{
              id: previewDocument.id,
              title: getDocumentTypeLabel(previewDocument.documentType),
              originalFilename: previewDocument.originalFilename,
              contentType: previewDocument.contentType,
              meta: getDocumentMeta(previewDocument),
            }}
            resolveUrl={() => review.resolveDocumentUrl(previewDocument.id)}
            onClose={() => setPreviewIndex(undefined)}
            navigation={{
              index: previewIndex,
              total: documents.length,
              nextLabel: documentTypeAt(previewIndex + 1),
              onPrevious: () => setPreviewIndex(previewIndex - 1),
              onNext: () => setPreviewIndex(previewIndex + 1),
            }}
          />
        )}
        {dialog && (
          <ReviewDialogs
            dialog={dialog}
            mentorFullName={detail.mentorFullName}
            initialNote={note}
            checklistDone={checklistProgress.done}
            checklistTotal={checklistProgress.total}
            lock={review.lock}
            lockReceivedAt={review.lockReceivedAt}
            onClose={() => setDialog(undefined)}
            onApprove={async () => {
              await review.approve();
              router.push(listHref);
            }}
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
