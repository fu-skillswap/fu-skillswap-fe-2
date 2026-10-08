/**
 * @file ContentCell.tsx
 * @description Ô "Nội dung": tiêu đề, trích đoạn 2 dòng và dòng tác giả · loại nội dung.
 */

import styles from '../AdminReportsView.module.css';
import { labelOf } from '../reports.constants';

export function ContentCell({
  targetType,
  title,
  parentPostTitle,
  excerpt,
  authorName,
}: {
  targetType: string;
  title: string | null;
  parentPostTitle?: string | null;
  excerpt: string | null;
  authorName: string | null;
}) {
  const heading =
    targetType === 'COMMENT'
      ? `Bình luận trong "${parentPostTitle ?? title ?? 'bài viết'}"`
      : (title ?? 'Bài viết không có tiêu đề');

  return (
    <div className={styles.content}>
      <strong title={heading}>{heading}</strong>
      {excerpt ? (
        <p>&ldquo;{excerpt}&rdquo;</p>
      ) : (
        <p className={styles.muted}>Không có nội dung xem trước.</p>
      )}
      <span>
        Bởi {authorName ?? 'người dùng không xác định'} · {labelOf(targetType)}
      </span>
    </div>
  );
}
