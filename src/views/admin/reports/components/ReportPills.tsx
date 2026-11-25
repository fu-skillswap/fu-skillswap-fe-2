/**
 * @file ReportPills.tsx
 * @description Pill / chip hiển thị lý do, trạng thái, loại nội dung và trạng thái nội dung của báo cáo.
 * Luôn có chữ, không chỉ dựa vào màu.
 */

import { FileText, MessageSquare } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import styles from '../ReportModeration.module.css';
import {
  TARGET_TYPE_LABEL,
  getReasonUi,
  getStatusUi,
  getTargetStatusUi,
  getTargetType,
  type LabelTone,
} from '../reportModeration.constants';

export function TonePill({ ui, icon }: { ui: LabelTone; icon?: ReactNode }) {
  const style = {
    '--pill-color': ui.tone.color,
    '--pill-bg': ui.tone.background,
    '--pill-border': ui.tone.border,
  } as CSSProperties;
  return (
    <span className={styles.pill} style={style}>
      {icon}
      {ui.label}
    </span>
  );
}

export function ReasonPill({ reasonType }: { reasonType: string }) {
  return <TonePill ui={getReasonUi(reasonType)} />;
}

export function StatusPill({ status }: { status: string }) {
  return <TonePill ui={getStatusUi(status)} />;
}

export function TargetStatusPill({ targetStatus }: { targetStatus: string | null }) {
  const ui = getTargetStatusUi(targetStatus);
  return ui ? <TonePill ui={ui} /> : null;
}

export function TargetTypeChip({ targetType }: { targetType: string }) {
  const type = getTargetType(targetType);
  const Icon = type === 'COMMENT' ? MessageSquare : FileText;
  return (
    <span className={styles.typeChip}>
      <Icon aria-hidden="true" />
      {TARGET_TYPE_LABEL[type]}
    </span>
  );
}
