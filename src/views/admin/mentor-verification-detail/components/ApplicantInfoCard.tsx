/**
 * @file ApplicantInfoCard.tsx
 * @description Thẻ "Thông tin ứng viên" dạng lưới nhãn / giá trị.
 */

import type { MentorVerificationRequestDetail } from '@/models/admin';
import styles from '../MentorVerificationDetailView.module.css';

export function ApplicantInfoCard({ detail }: { detail: MentorVerificationRequestDetail }) {
  const student = detail.studentProfile;
  const fields: Array<[string, string | null | undefined]> = [
    ['Họ và tên', detail.mentorFullName],
    ['Email', detail.mentorEmail],
    ['Mã sinh viên', student?.studentCode],
    ['Cơ sở', student?.campus?.name],
    ['Chuyên ngành', student?.program?.nameVi],
    ['Học kỳ', student?.semester ? `Học kỳ ${student.semester}` : null],
  ];

  return (
    <section className={styles.card}>
      <h2 className="admin-card-title">Thông tin ứng viên</h2>
      <dl className={styles.infoGrid}>
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={value ? undefined : styles.muted}>{value || 'Chưa có'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
