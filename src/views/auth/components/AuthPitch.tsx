/**
 * @file AuthPitch.tsx
 * @description Right-hand pitch shown on every auth screen. No metrics: SkillSwap is new and the
 * copy only describes what the product does.
 */

import { CalendarCheck, Search, Sparkles } from 'lucide-react';
import Image from 'next/image';
import styles from './Auth.module.css';

const features = [
  {
    icon: Search,
    title: 'Tìm mentor theo môn',
    text: 'Lọc theo môn học, kỳ học hoặc kinh nghiệm OJT.',
  },
  {
    icon: CalendarCheck,
    title: 'Đặt lịch 1:1',
    text: 'Chọn khung giờ mentor đã mở sẵn, không cần nhắn qua lại.',
  },
  {
    icon: Sparkles,
    title: 'Hỏi KooKoo AI',
    text: 'Chưa biết hỏi ai? KooKoo gợi ý mentor hợp với vấn đề của bạn.',
  },
];

export function AuthPitch() {
  return (
    <section className={styles.pitch} aria-labelledby="auth-pitch-title">
      <h2 id="auth-pitch-title" className={styles.pitchTitle}>
        Đôi khi bạn chỉ cần người đi trước <span className={styles.pitchAccent}>vài bước</span>
      </h2>
      <p className={styles.pitchLead}>
        Anh chị khóa trên ở FPTU HCM chia sẻ cách học PE, FE, làm dự án và đi OJT. Bạn đặt lịch 1:1
        vào đúng giờ họ đã mở.
      </p>

      <ul className={styles.featureList}>
        {features.map(({ icon: Icon, title, text }) => (
          <li key={title} className={styles.featureItem}>
            <span className={styles.featureIcon} aria-hidden="true">
              <Icon size={22} strokeWidth={2} />
            </span>
            <div>
              <p className={styles.featureTitle}>{title}</p>
              <p className={styles.featureText}>{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.mascotRow}>
        <Image
          src="/images/Koko.png"
          alt="Cú KooKoo, linh vật SkillSwap"
          width={112}
          height={112}
          className={styles.mascot}
        />
        <div className={styles.bubble}>
          <p className={styles.bubbleTitle}>
            SkillSwap mới mở cửa, bạn là một trong những người đầu tiên!
          </p>
          <p className={styles.bubbleText}>
            Năm nay SkillSwap chưa thu phí hoa hồng trên mỗi buổi học.
          </p>
        </div>
      </div>
    </section>
  );
}
