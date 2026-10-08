/**
 * @file EvidenceCard.tsx
 * @description Thẻ "Minh chứng": mỗi tài liệu một hàng với nút xem và tải xuống.
 */

import type { MentorVerificationDocument } from '@/models/admin';
import { Download, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import styles from '../MentorVerificationDetailView.module.css';
import {
  formatFileSize,
  getDocumentTypeLabel,
  getFileKind,
  truncateMiddle,
} from '../mentorVerificationDetail.constants';

export function EvidenceCard({
  documents,
  onView,
  onDownload,
}: {
  documents: MentorVerificationDocument[];
  onView: (document: MentorVerificationDocument) => void;
  onDownload: (document: MentorVerificationDocument) => void;
}) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className="admin-card-title">Minh chứng</h2>
        <span className={styles.cardCount}>{documents.length} tài liệu</span>
      </header>
      {documents.length ? (
        <ul className={styles.documents}>
          {documents.map((document) => {
            const typeLabel = getDocumentTypeLabel(document.documentType);
            const Icon = document.contentType.startsWith('image/') ? ImageIcon : FileText;
            return (
              <li key={document.id} className={styles.document}>
                <span className={styles.documentIcon} aria-hidden="true">
                  <Icon />
                </span>
                <div className={styles.documentText}>
                  <strong>{typeLabel}</strong>
                  <small title={document.originalFilename}>
                    {getFileKind(document)} · {formatFileSize(document.sizeBytes)} ·{' '}
                    {truncateMiddle(document.originalFilename)}
                  </small>
                </div>
                <button type="button" className="admin-button" onClick={() => onView(document)}>
                  <Eye aria-hidden="true" /> Xem
                </button>
                <button
                  type="button"
                  className={`admin-button ${styles.iconButton}`}
                  aria-label={`Tải xuống ${typeLabel}`}
                  title="Tải xuống"
                  onClick={() => onDownload(document)}
                >
                  <Download aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.muted}>Chưa có tài liệu đính kèm.</p>
      )}
    </section>
  );
}
