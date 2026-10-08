/**
 * @file RegistrationInfoCard.tsx
 * @description Thẻ "Thông tin đăng ký": tiêu đề hồ sơ, giới thiệu (thu gọn được) và liên kết.
 */

'use client';

import type { MentorVerificationRequestDetail } from '@/models/admin';
import { ExternalLink } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import styles from '../MentorVerificationDetailView.module.css';

function ProfileLink({ label, url }: { label: string; url?: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className={styles.externalLink}>
            <span>{url.replace(/^https?:\/\//, '')}</span>
            <ExternalLink aria-hidden="true" />
          </a>
        ) : (
          <span className={styles.muted}>Chưa cung cấp</span>
        )}
      </dd>
    </div>
  );
}

export function RegistrationInfoCard({ detail }: { detail: MentorVerificationRequestDetail }) {
  const profile = detail.mentorProfile;
  const introduction = profile?.expertiseDescription ?? detail.submitNote;
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const introRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const element = introRef.current;
    if (element && !expanded) setCanExpand(element.scrollHeight > element.clientHeight + 1);
  }, [introduction, expanded]);

  return (
    <section className={styles.card}>
      <h2 className="admin-card-title">Thông tin đăng ký</h2>
      <div className={styles.field}>
        <span className={styles.label}>Tiêu đề hồ sơ</span>
        {profile?.headline ? (
          <strong className={styles.headline}>{profile.headline}</strong>
        ) : (
          <span className={styles.muted}>Chưa có</span>
        )}
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Giới thiệu và chuyên môn</span>
        {introduction ? (
          <>
            <p
              ref={introRef}
              id="mentor-introduction"
              className={`${styles.introduction} ${expanded ? '' : styles.clamped}`}
            >
              {introduction}
            </p>
            {(canExpand || expanded) && (
              <button
                type="button"
                className={styles.textButton}
                aria-expanded={expanded}
                aria-controls="mentor-introduction"
                onClick={() => setExpanded((current) => !current)}
              >
                {expanded ? 'Thu gọn' : 'Xem toàn bộ'}
              </button>
            )}
          </>
        ) : (
          <span className={styles.muted}>Chưa có</span>
        )}
      </div>
      <dl className={styles.linkRow}>
        <ProfileLink label="GitHub" url={profile?.githubUrl} />
        <ProfileLink label="Portfolio" url={profile?.portfolioUrl} />
      </dl>
    </section>
  );
}
