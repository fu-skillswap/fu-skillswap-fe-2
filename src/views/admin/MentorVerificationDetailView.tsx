/**
 * @file MentorVerificationDetailView.tsx
 * @description Xem chi tiết và trạng thái xử lý hồ sơ xác minh mentor.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import { AdminLoadingState } from '@/components/domain/admin/AdminLoadingState';
import {
  rejectMentorVerificationSchema,
  requestMentorRevisionSchema,
  type RejectMentorVerificationForm,
  type RequestMentorRevisionForm,
} from '@/models/schemas/mentorVerificationSchema';
import type {
  MentorVerificationDocument,
  MentorVerificationLock,
  MentorVerificationRequestDetail,
} from '@/models/admin';
import { useAuth } from '@/providers/AuthProvider';
import { adminRepo } from '@/repositories/adminRepo';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Eye,
  FileText,
  LockKeyhole,
  RefreshCw,
  Unlock,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';

const checklistLabels: Array<[keyof MentorVerificationRequestDetail['checklist'], string]> = [
  ['academicProfileCompleted', 'Hồ sơ học thuật đã hoàn tất'],
  ['mentorProfileCompleted', 'Hồ sơ mentor đã hoàn tất'],
  ['hasAffiliationProof', 'Đã có minh chứng liên kết với trường'],
  ['hasExpertiseProof', 'Đã có minh chứng chuyên môn'],
  ['canSubmit', 'Đủ điều kiện gửi hồ sơ'],
];

function getErrorMessage(reason: unknown, fallback = 'Không thể tải chi tiết hồ sơ mentor.') {
  return reason instanceof ApiClientError ? reason.message : fallback;
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function formatFileSize(value: number) {
  return `${(value / 1024).toFixed(value >= 1024 * 1024 ? 1 : 0)} KB`;
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    DRAFT: 'Chờ duyệt',
    PENDING: 'Chờ duyệt',
    SUBMITTED: 'Chờ duyệt',
    PENDING_REVIEW: 'Chờ duyệt',
    UNDER_REVIEW: 'Đang xem xét',
    NEEDS_REVISION: 'Cần bổ sung',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
  };
  return <span className="mentor-status">{labels[status] ?? status.replaceAll('_', ' ')}</span>;
}

export function MentorVerificationDetailView({
  locale,
  requestId,
}: {
  locale: string;
  requestId: string;
}) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<MentorVerificationRequestDetail>();
  const [lock, setLock] = useState<MentorVerificationLock>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selectedDocument, setSelectedDocument] = useState<MentorVerificationDocument>();
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [revisionError, setRevisionError] = useState<string>();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string>();
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string>();
  const [isUpdatingLock, setIsUpdatingLock] = useState(false);
  const [lockActionError, setLockActionError] = useState<string>();
  const [pendingLockAction, setPendingLockAction] = useState<'release' | 'refresh'>();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequestMentorRevisionForm>({
    resolver: yupResolver(requestMentorRevisionSchema),
  });
  const {
    register: registerReject,
    handleSubmit: handleRejectSubmit,
    formState: { errors: rejectErrors },
    reset: resetReject,
  } = useForm<RejectMentorVerificationForm>({
    resolver: yupResolver(rejectMentorVerificationSchema),
  });

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
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (loading) return <AdminLoadingState message="Đang tải thông tin hồ sơ mentor..." />;
  if (!detail)
    return (
      <main className="mentor-detail-page">
        <p className="mentor-detail-state">{error ?? 'Không tìm thấy hồ sơ.'}</p>
        <Link href={`/${locale}/admin/mentor-verification`}>Quay lại danh sách</Link>
      </main>
    );

  const lockedByAnotherAdmin = lock?.locked && !lock.canReview;
  const isCurrentAdminLockOwner = Boolean(lock?.locked && lock.lockedByAdminId === user?.id);
  const processingAdmin = lock
    ? lock.locked
      ? lock.lockedByAdminFullName || lock.lockedByAdminEmail
      : null
    : detail.lockedByAdminEmail;
  const lockExpiresAt = lock ? (lock.locked ? lock.lockExpiresAt : null) : detail.lockExpiresAt;
  const submitRevisionRequest = async ({ note }: RequestMentorRevisionForm) => {
    setIsSubmittingRevision(true);
    setRevisionError(undefined);
    try {
      const updatedRequest = await adminRepo.requestMentorRevision(requestId, note);
      setDetail(updatedRequest);
      setIsRevisionModalOpen(false);
      reset();
    } catch (reason) {
      setRevisionError(getErrorMessage(reason));
    } finally {
      setIsSubmittingRevision(false);
    }
  };
  const approveMentor = async () => {
    setIsApproving(true);
    setApproveError(undefined);
    try {
      setDetail(await adminRepo.approveMentorVerification(requestId));
      setIsApproveModalOpen(false);
    } catch (reason) {
      setApproveError(getErrorMessage(reason));
    } finally {
      setIsApproving(false);
    }
  };

  const submitRejection = async ({ note }: RejectMentorVerificationForm) => {
    setIsRejecting(true);
    setRejectError(undefined);
    try {
      const updatedRequest = await adminRepo.rejectMentorVerification(requestId, note);
      setDetail(updatedRequest);
      setIsRejectModalOpen(false);
      resetReject();
    } catch (reason) {
      setRejectError(getErrorMessage(reason));
    } finally {
      setIsRejecting(false);
    }
  };

  const updateLock = async (action: 'release' | 'refresh') => {
    setIsUpdatingLock(true);
    setLockActionError(undefined);
    try {
      const updatedLock =
        action === 'release'
          ? await adminRepo.releaseMentorVerificationLock(requestId)
          : await adminRepo.refreshMentorVerificationLock(requestId);
      setLock(updatedLock);
      setPendingLockAction(undefined);
    } catch (reason) {
      setLockActionError(getErrorMessage(reason, 'Không thể cập nhật thời gian giữ hồ sơ.'));
    } finally {
      setIsUpdatingLock(false);
    }
  };

  return (
    <main className="mentor-detail-page">
      <div className="mentor-detail-content">
        <Link className="mentor-back-link" href={`/${locale}/admin/mentor-verification`}>
          <ArrowLeft aria-hidden="true" /> Quay lại danh sách
        </Link>
        <header className="mentor-detail-heading">
          <div>
            <div className="mentor-detail-title">
              <h1>{detail.mentorFullName}</h1>
              <StatusBadge status={detail.status} />
            </div>
            <p>
              Mã yêu cầu: {detail.requestId} <span>•</span> Gửi lúc:{' '}
              {formatDate(detail.submittedAt)}
            </p>
          </div>
          <div className="mentor-review-actions">
            <button
              type="button"
              disabled={lockedByAnotherAdmin || !detail.canReview}
              onClick={() => {
                reset();
                setRevisionError(undefined);
                setIsRevisionModalOpen(true);
              }}
            >
              {lockedByAnotherAdmin && <LockKeyhole aria-hidden="true" />} Yêu cầu bổ sung
            </button>
            <button
              type="button"
              className="danger"
              disabled={lockedByAnotherAdmin || !detail.canReview}
              onClick={() => {
                resetReject();
                setRejectError(undefined);
                setIsRejectModalOpen(true);
              }}
            >
              {lockedByAnotherAdmin && <LockKeyhole aria-hidden="true" />} Từ chối
            </button>
            <button
              type="button"
              className="primary"
              disabled={lockedByAnotherAdmin || !detail.canReview}
              onClick={() => {
                setApproveError(undefined);
                setIsApproveModalOpen(true);
              }}
            >
              {lockedByAnotherAdmin && <LockKeyhole aria-hidden="true" />} Duyệt mentor
            </button>
          </div>
        </header>
        {lockedByAnotherAdmin && (
          <div className="mentor-lock-notice" role="status">
            <LockKeyhole aria-hidden="true" /> Hồ sơ đang được xử lý bởi{' '}
            {processingAdmin ?? 'một quản trị viên khác'}. Bạn chỉ có thể xem.
          </div>
        )}
        <div className="mentor-detail-grid">
          <div className="mentor-detail-main">
            <section className="mentor-detail-card">
              <h2>Thông tin ứng viên</h2>
              <div className="mentor-profile-summary">
                {detail.mentorAvatarUrl ? (
                  <img src={detail.mentorAvatarUrl} alt="" />
                ) : (
                  <span>{detail.mentorFullName.charAt(0)}</span>
                )}
                <dl>
                  <div>
                    <dt>Họ và tên</dt>
                    <dd>{detail.mentorFullName}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{detail.mentorEmail}</dd>
                  </div>
                  <div>
                    <dt>Mã sinh viên</dt>
                    <dd>{detail.studentProfile?.studentCode ?? 'Chưa có'}</dd>
                  </div>
                  <div>
                    <dt>Cơ sở</dt>
                    <dd>{detail.studentProfile?.campus?.name ?? 'Chưa có'}</dd>
                  </div>
                  <div>
                    <dt>Chuyên ngành</dt>
                    <dd>{detail.studentProfile?.program?.nameVi ?? 'Chưa có'}</dd>
                  </div>
                  <div>
                    <dt>Học kỳ</dt>
                    <dd>
                      {detail.studentProfile?.semester
                        ? `Học kỳ ${detail.studentProfile.semester}`
                        : 'Chưa có'}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
            <section className="mentor-detail-card">
              <h2>Thông tin đăng ký</h2>
              <dl className="mentor-detail-fields">
                <div>
                  <dt>Tiêu đề</dt>
                  <dd>{detail.mentorProfile?.headline ?? 'Chưa có'}</dd>
                </div>
                <div>
                  <dt>Giới thiệu &amp; chuyên môn</dt>
                  <dd>
                    {detail.mentorProfile?.expertiseDescription ?? detail.submitNote ?? 'Chưa có'}
                  </dd>
                </div>
                <div>
                  <dt>Liên kết GitHub</dt>
                  <dd>{detail.mentorProfile?.githubUrl ?? 'Chưa có'}</dd>
                </div>
                <div>
                  <dt>Portfolio</dt>
                  <dd>{detail.mentorProfile?.portfolioUrl ?? 'Chưa có'}</dd>
                </div>
              </dl>
            </section>
            <section className="mentor-detail-card">
              <h2>Tài liệu đính kèm</h2>
              <div className="mentor-documents">
                {detail.documents.length ? (
                  detail.documents.map((document) => (
                    <div key={document.id} className="mentor-document-item">
                      <FileText aria-hidden="true" />
                      <div>
                        <b>{document.originalFilename}</b>
                        <small>
                          {document.documentType.replaceAll('_', ' ')} ·{' '}
                          {formatFileSize(document.sizeBytes)}
                        </small>
                      </div>
                      <button type="button" onClick={() => setSelectedDocument(document)}>
                        <Eye aria-hidden="true" /> Xem
                      </button>
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Mở ${document.originalFilename} ở tab mới`}
                      >
                        <ExternalLink aria-hidden="true" />
                      </a>
                    </div>
                  ))
                ) : (
                  <p>Chưa có tài liệu đính kèm.</p>
                )}
              </div>
            </section>
          </div>
          <aside className="mentor-detail-side">
            <section className="mentor-detail-card">
              <h2>Danh sách rà soát</h2>
              <ul className="mentor-checklist">
                {checklistLabels.map(([key, label]) => (
                  <li key={key}>
                    <span className={detail.checklist[key] ? 'is-done' : ''}>
                      {detail.checklist[key] && <Check aria-hidden="true" />}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </section>
            <section className="mentor-detail-card mentor-lock-card">
              <h2>Trạng thái xử lý</h2>
              <dl>
                <div>
                  <dt>Quyền xử lý</dt>
                  <dd>
                    {detail.canReview && !lockedByAnotherAdmin ? 'Bạn có thể xử lý' : 'Chỉ xem'}
                  </dd>
                </div>
                <div>
                  <dt>Admin đang xử lý</dt>
                  <dd>{processingAdmin ?? 'Chưa có admin xử lý'}</dd>
                </div>
                <div>
                  <dt>Khóa đến</dt>
                  <dd>{lockExpiresAt ? formatDate(lockExpiresAt) : 'Chưa giữ hồ sơ'}</dd>
                </div>
              </dl>
              {isCurrentAdminLockOwner && (
                <div className="mentor-lock-actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={isUpdatingLock}
                    onClick={() => {
                      setLockActionError(undefined);
                      setPendingLockAction('refresh');
                    }}
                  >
                    <RefreshCw aria-hidden="true" />
                    {isUpdatingLock ? 'Đang gia hạn...' : 'Gia hạn giữ hồ sơ'}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    disabled={isUpdatingLock}
                    onClick={() => {
                      setLockActionError(undefined);
                      setPendingLockAction('release');
                    }}
                  >
                    <Unlock aria-hidden="true" />
                    Bỏ giữ hồ sơ
                  </button>
                </div>
              )}
              {lockActionError && <p className="mentor-lock-action-error">{lockActionError}</p>}
            </section>
          </aside>
        </div>
        <section className="mentor-detail-card mentor-timeline">
          <h2>Lịch sử xử lý</h2>
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Sự kiện</th>
                <th>Người thực hiện</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {detail.timeline.length ? (
                detail.timeline.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDate(event.createdAt)}</td>
                    <td>{event.eventType.replaceAll('_', ' ')}</td>
                    <td>{event.actorFullName || event.actorEmail}</td>
                    <td>{event.note ?? '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>Chưa có lịch sử xử lý.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        {selectedDocument && (
          <div
            className="mentor-document-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Xem ${selectedDocument.originalFilename}`}
          >
            <div className="mentor-document-preview">
              <header>
                <div>
                  <FileText aria-hidden="true" />
                  <strong>{selectedDocument.originalFilename}</strong>
                </div>
                <button
                  type="button"
                  aria-label="Đóng xem trước"
                  onClick={() => setSelectedDocument(undefined)}
                >
                  <X aria-hidden="true" />
                </button>
              </header>
              <div className="mentor-document-preview-content">
                {selectedDocument.contentType.startsWith('image/') ? (
                  <img src={selectedDocument.fileUrl} alt={selectedDocument.originalFilename} />
                ) : (
                  <iframe
                    title={selectedDocument.originalFilename}
                    src={selectedDocument.fileUrl}
                  />
                )}
              </div>
              <footer>
                <a href={selectedDocument.fileUrl} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden="true" /> Mở ở tab mới
                </a>
              </footer>
            </div>
          </div>
        )}
        {isRevisionModalOpen && (
          <div
            className="mentor-document-modal mentor-revision-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-revision-title"
          >
            <form className="mentor-revision-dialog" onSubmit={handleSubmit(submitRevisionRequest)}>
              <header>
                <div>
                  <h2 id="mentor-revision-title">Yêu cầu bổ sung hồ sơ</h2>
                  <p>Gửi lý do cụ thể để mentor cập nhật hồ sơ.</p>
                </div>
                <button
                  type="button"
                  aria-label="Đóng popup"
                  onClick={() => setIsRevisionModalOpen(false)}
                  disabled={isSubmittingRevision}
                >
                  <X aria-hidden="true" />
                </button>
              </header>
              <label htmlFor="revision-note">Lý do yêu cầu bổ sung</label>
              <textarea
                id="revision-note"
                rows={6}
                placeholder="Ví dụ: Vui lòng bổ sung minh chứng chuyên môn và cập nhật phần giới thiệu..."
                {...register('note')}
                disabled={isSubmittingRevision}
                autoFocus
              />
              {errors.note && <p className="mentor-form-error">{errors.note.message}</p>}
              {revisionError && <p className="mentor-form-error">{revisionError}</p>}
              <footer>
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  disabled={isSubmittingRevision}
                >
                  Hủy
                </button>
                <button className="primary" type="submit" disabled={isSubmittingRevision}>
                  {isSubmittingRevision ? 'Đang gửi...' : 'Xác nhận gửi'}
                </button>
              </footer>
            </form>
          </div>
        )}
        {isRejectModalOpen && (
          <div
            className="mentor-document-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-reject-title"
          >
            <form className="mentor-revision-dialog" onSubmit={handleRejectSubmit(submitRejection)}>
              <header>
                <div>
                  <h2 id="mentor-reject-title">Từ chối hồ sơ mentor</h2>
                  <p>Gửi lý do cụ thể để mentor biết nội dung cần cải thiện.</p>
                </div>
                <button
                  type="button"
                  aria-label="Đóng"
                  disabled={isRejecting}
                  onClick={() => setIsRejectModalOpen(false)}
                >
                  <X aria-hidden="true" />
                </button>
              </header>
              <label htmlFor="mentor-reject-note">Lý do từ chối</label>
              <textarea
                id="mentor-reject-note"
                rows={6}
                placeholder="Ví dụ: Hồ sơ chưa có đủ minh chứng chuyên môn..."
                disabled={isRejecting}
                {...registerReject('note')}
              />
              {rejectErrors.note && (
                <p className="mentor-form-error">{rejectErrors.note.message}</p>
              )}
              {rejectError && <p className="mentor-form-error">{rejectError}</p>}
              <footer>
                <button
                  type="button"
                  disabled={isRejecting}
                  onClick={() => setIsRejectModalOpen(false)}
                >
                  Hủy
                </button>
                <button className="danger" type="submit" disabled={isRejecting}>
                  {isRejecting ? 'Đang từ chối...' : 'Xác nhận từ chối'}
                </button>
              </footer>
            </form>
          </div>
        )}
        {pendingLockAction && (
          <div
            className="mentor-document-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-lock-action-title"
          >
            <section className="mentor-revision-dialog mentor-confirm-dialog">
              <header>
                <div>
                  <h2 id="mentor-lock-action-title">
                    {pendingLockAction === 'refresh' ? 'Gia hạn giữ hồ sơ' : 'Bỏ giữ hồ sơ'}
                  </h2>
                  <p>
                    {pendingLockAction === 'refresh'
                      ? 'Bạn có muốn gia hạn thêm thời gian xử lý hồ sơ này không?'
                      : 'Bạn có chắc muốn bỏ giữ hồ sơ này để quản trị viên khác có thể xử lý?'}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Đóng"
                  disabled={isUpdatingLock}
                  onClick={() => setPendingLockAction(undefined)}
                >
                  <X aria-hidden="true" />
                </button>
              </header>
              {lockActionError && <p className="mentor-form-error">{lockActionError}</p>}
              <footer>
                <button
                  type="button"
                  disabled={isUpdatingLock}
                  onClick={() => setPendingLockAction(undefined)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className={pendingLockAction === 'release' ? 'danger' : 'primary'}
                  disabled={isUpdatingLock}
                  onClick={() => void updateLock(pendingLockAction)}
                >
                  {isUpdatingLock
                    ? 'Đang xác nhận...'
                    : pendingLockAction === 'refresh'
                      ? 'Xác nhận gia hạn'
                      : 'Xác nhận bỏ giữ'}
                </button>
              </footer>
            </section>
          </div>
        )}
        {isApproveModalOpen && (
          <div
            className="mentor-document-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-approve-title"
          >
            <section className="mentor-revision-dialog mentor-confirm-dialog">
              <header>
                <div>
                  <h2 id="mentor-approve-title">Xác nhận duyệt mentor</h2>
                  <p>
                    Bạn có chắc muốn duyệt hồ sơ của {detail.mentorFullName}? Thao tác này sẽ gửi
                    kết quả duyệt đến mentor.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Đóng popup"
                  onClick={() => setIsApproveModalOpen(false)}
                  disabled={isApproving}
                >
                  <X aria-hidden="true" />
                </button>
              </header>
              {approveError && <p className="mentor-form-error">{approveError}</p>}
              <footer>
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  disabled={isApproving}
                >
                  Hủy
                </button>
                <button
                  className="primary"
                  type="button"
                  onClick={() => void approveMentor()}
                  disabled={isApproving}
                >
                  {isApproving ? 'Đang duyệt...' : 'Xác nhận duyệt'}
                </button>
              </footer>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
