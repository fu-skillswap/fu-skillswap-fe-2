/**
 * @file DetailHeader.tsx
 * @description Đầu trang hồ sơ xác minh: ảnh đại diện, tên, trạng thái, thời gian chờ và mã yêu cầu.
 */

'use client';

import type { MentorVerificationRequestDetail } from '@/models/admin';
import { showError, showSuccess } from '@/utils/toast';
import { Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from '../MentorVerificationDetailView.module.css';
import {
  formatDateTime,
  formatElapsed,
  getStatusLabel,
  getStatusTone,
  isAwaitingDecision,
} from '../mentorVerificationDetail.constants';

function shortenId(id: string) {
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-5)}` : id;
}

export function DetailHeader({ detail }: { detail: MentorVerificationRequestDetail }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const copyRequestId = async () => {
    try {
      await navigator.clipboard.writeText(detail.requestId);
      showSuccess('Đã sao chép mã yêu cầu');
    } catch (reason) {
      showError(reason, { title: 'Không sao chép được mã yêu cầu' });
    }
  };

  const initial = detail.mentorFullName.trim().charAt(0).toUpperCase() || 'M';

  return (
    <header className={styles.header}>
      {detail.mentorAvatarUrl ? (
        <img className={styles.avatar} src={detail.mentorAvatarUrl} alt="" />
      ) : (
        <span className={styles.avatar} aria-hidden="true">
          {initial}
        </span>
      )}
      <div className={styles.headerText}>
        <div className={styles.titleRow}>
          <h1>{detail.mentorFullName}</h1>
          <span className={`mentor-status ${getStatusTone(detail.status)}`}>
            {getStatusLabel(detail.status)}
          </span>
        </div>
        <p className={styles.meta}>
          <span>Gửi lúc {formatDateTime(detail.submittedAt)}</span>
          {detail.submittedAt && isAwaitingDecision(detail.status) && (
            <span>Đã chờ {formatElapsed(detail.submittedAt, now)}</span>
          )}
          <span className={styles.requestId}>
            Mã <span title={detail.requestId}>{shortenId(detail.requestId)}</span>
            <button
              type="button"
              className={styles.copyButton}
              aria-label="Sao chép mã yêu cầu"
              title="Sao chép mã yêu cầu"
              onClick={() => void copyRequestId()}
            >
              <Copy aria-hidden="true" />
            </button>
          </span>
        </p>
      </div>
    </header>
  );
}
