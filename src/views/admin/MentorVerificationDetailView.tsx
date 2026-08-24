/**
 * @file MentorVerificationDetailView.tsx
 * @description Xem chi tiết và trạng thái xử lý hồ sơ xác minh mentor.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import { AdminLoadingState } from '@/components/domain/admin/AdminLoadingState';
import type {
  MentorVerificationDocument,
  MentorVerificationLock,
  MentorVerificationRequestDetail,
} from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { ArrowLeft, Check, ExternalLink, Eye, FileText, LockKeyhole, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const checklistLabels: Array<[keyof MentorVerificationRequestDetail['checklist'], string]> = [
  ['academicProfileCompleted', 'Hồ sơ học thuật đã hoàn tất'],
  ['mentorProfileCompleted', 'Hồ sơ mentor đã hoàn tất'],
  ['hasAffiliationProof', 'Đã có minh chứng liên kết với trường'],
  ['hasExpertiseProof', 'Đã có minh chứng chuyên môn'],
  ['canSubmit', 'Đủ điều kiện gửi hồ sơ'],
];

function getErrorMessage(reason: unknown) {
  return reason instanceof ApiClientError ? reason.message : 'Không thể tải chi tiết hồ sơ mentor.';
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

export function MentorVerificationDetailView({ requestId }: { requestId: string }) {
  const [detail, setDetail] = useState<MentorVerificationRequestDetail>();
  const [lock, setLock] = useState<MentorVerificationLock>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selectedDocument, setSelectedDocument] = useState<MentorVerificationDocument>();

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
        <Link href="../">Quay lại danh sách</Link>
      </main>
    );

  const lockedByAnotherAdmin = lock?.locked && !lock.canReview;
  const processingAdmin =
    lock?.lockedByAdminFullName || lock?.lockedByAdminEmail || detail.lockedByAdminEmail;

  return (
    <main className="mentor-detail-page">
      <div className="mentor-detail-content">
        <Link className="mentor-back-link" href="../">
          <ArrowLeft aria-hidden="true" /> Quay lại danh sách xác minh mentor
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
            <button type="button" disabled={lockedByAnotherAdmin || !detail.canReview}>
              {lockedByAnotherAdmin && <LockKeyhole aria-hidden="true" />} Yêu cầu bổ sung
            </button>
            <button
              type="button"
              className="danger"
              disabled={lockedByAnotherAdmin || !detail.canReview}
            >
              {lockedByAnotherAdmin && <LockKeyhole aria-hidden="true" />} Từ chối
            </button>
            <button
              type="button"
              className="primary"
              disabled={lockedByAnotherAdmin || !detail.canReview}
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
                  <dd>{formatDate(lock?.lockExpiresAt ?? detail.lockExpiresAt)}</dd>
                </div>
              </dl>
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
      </div>
    </main>
  );
}
