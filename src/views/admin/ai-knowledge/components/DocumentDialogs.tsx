/**
 * @file DocumentDialogs.tsx
 * @description Hộp thoại nạp tài liệu (tải tệp / dán văn bản) và xác nhận xóa tài liệu khỏi kho
 * tri thức. Lỗi từ dịch vụ AI (trùng tài liệu, tệp quá lớn, sai định dạng…) hiện ngay trong hộp
 * thoại bằng thông báo tiếng Việt của server.
 */

'use client';

import { AdminDialog } from '@/components/domain/admin/AdminDialog';
import type { AiDocument } from '@/models/ai';
import { ApiClientError } from '@/models/apiClient';
import { aiRepo } from '@/repositories/aiRepo';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { ClipboardPaste, LoaderCircle, Trash2, Upload } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import styles from '../AiKnowledgeView.module.css';
import {
  ACCEPTED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  SCHOOL_CODE_MAX,
  TEXT_MIN,
  TITLE_MAX,
  TOPIC_MAX,
  formatBytes,
  getFileExtension,
} from '../aiKnowledge.constants';

function errorMessage(reason: unknown, fallback: string) {
  // The AI service answers in Vietnamese (`detail`), which apiClient keeps as the message.
  if (reason instanceof ApiClientError && reason.status >= 400 && reason.status < 500) {
    if (reason.status === 401 || reason.status === 403) {
      return 'Tài khoản của bạn không có quyền quản lý kho tri thức.';
    }
    return reason.message || fallback;
  }
  return getUserFriendlyErrorMessage(reason, fallback);
}

function SubmitLabel({
  busy,
  label,
  busyLabel,
}: {
  busy: boolean;
  label: string;
  busyLabel: string;
}) {
  return busy ? (
    <>
      <LoaderCircle className="is-spinning" aria-hidden="true" /> {busyLabel}
    </>
  ) : (
    <>{label}</>
  );
}

function ScopeFields({
  idPrefix,
  schoolCode,
  topic,
  disabled,
  onSchoolCode,
  onTopic,
}: {
  idPrefix: string;
  schoolCode: string;
  topic: string;
  disabled: boolean;
  onSchoolCode: (value: string) => void;
  onTopic: (value: string) => void;
}) {
  return (
    <div className={styles.fieldRow}>
      <div className="admin-dialog-field">
        <label htmlFor={`${idPrefix}-school`}>Mã trường (không bắt buộc)</label>
        <input
          id={`${idPrefix}-school`}
          className={styles.input}
          value={schoolCode}
          maxLength={SCHOOL_CODE_MAX}
          placeholder="VD: FPTU-HCM"
          disabled={disabled}
          onChange={(event) => onSchoolCode(event.target.value)}
        />
        <span className={styles.fieldHint}>Để trống nếu tài liệu dùng chung cho mọi trường.</span>
      </div>
      <div className="admin-dialog-field">
        <label htmlFor={`${idPrefix}-topic`}>Chủ đề (không bắt buộc)</label>
        <input
          id={`${idPrefix}-topic`}
          className={styles.input}
          value={topic}
          maxLength={TOPIC_MAX}
          placeholder="VD: quy chế, thanh toán"
          disabled={disabled}
          onChange={(event) => onTopic(event.target.value)}
        />
      </div>
    </div>
  );
}

export function UploadDocumentDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (document: AiDocument) => void;
}) {
  const titleId = useId();
  const [file, setFile] = useState<File>();
  const [title, setTitle] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const pickFile = (picked?: File) => {
    setError(undefined);
    if (!picked) return setFile(undefined);
    if (!ACCEPTED_EXTENSIONS.includes(getFileExtension(picked.name))) {
      setFile(undefined);
      return setError('Chỉ nhận tệp PDF, DOCX, MD hoặc TXT.');
    }
    if (picked.size > MAX_UPLOAD_BYTES) {
      setFile(undefined);
      return setError(`Tệp lớn hơn ${formatBytes(MAX_UPLOAD_BYTES)}. Hãy tách nhỏ tài liệu.`);
    }
    if (picked.size === 0) {
      setFile(undefined);
      return setError('Tệp rỗng.');
    }
    setFile(picked);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return setError('Chọn một tệp để tải lên.');
    setBusy(true);
    setError(undefined);
    try {
      const document = await aiRepo.uploadDocument({
        file,
        title: title.trim() || undefined,
        schoolCode: schoolCode.trim() || undefined,
        topic: topic.trim() || undefined,
      });
      onCreated(document);
    } catch (reason) {
      setError(errorMessage(reason, 'Không tải được tài liệu lên.'));
      setBusy(false);
    }
  };

  return (
    <AdminDialog
      titleId={titleId}
      icon={<Upload aria-hidden="true" />}
      title="Tải tài liệu lên"
      description="AI sẽ đọc tài liệu, cắt thành từng đoạn và dùng để trả lời sinh viên."
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="admin-button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="admin-button primary" disabled={busy} aria-busy={busy}>
            <SubmitLabel busy={busy} label="Tải lên" busyLabel="Đang tải lên…" />
          </button>
        </>
      }
    >
      <div className="admin-dialog-fields">
        <div className="admin-dialog-field">
          <label htmlFor={`${titleId}-file`}>Tệp tài liệu</label>
          <input
            id={`${titleId}-file`}
            className={styles.fileInput}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            disabled={busy}
            autoFocus
            onChange={(event) => pickFile(event.target.files?.[0])}
          />
          <span className={styles.fieldHint}>
            PDF, DOCX, MD hoặc TXT, tối đa 20 MB. PDF dạng ảnh scan chưa đọc được.
          </span>
        </div>
        <div className="admin-dialog-field">
          <label htmlFor={`${titleId}-title`}>Tên hiển thị (không bắt buộc)</label>
          <input
            id={`${titleId}-title`}
            className={styles.input}
            value={title}
            maxLength={TITLE_MAX}
            placeholder={file?.name ?? 'Mặc định dùng tên tệp'}
            disabled={busy}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <ScopeFields
          idPrefix={titleId}
          schoolCode={schoolCode}
          topic={topic}
          disabled={busy}
          onSchoolCode={setSchoolCode}
          onTopic={setTopic}
        />
      </div>
      {error && (
        <p className="mentor-form-error" role="alert">
          {error}
        </p>
      )}
    </AdminDialog>
  );
}

export function TextDocumentDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (document: AiDocument) => void;
}) {
  const titleId = useId();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const contentLength = content.trim().length;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return setError('Nhập tên tài liệu.');
    if (contentLength < TEXT_MIN) {
      return setError(`Nội dung cần ít nhất ${TEXT_MIN} ký tự để AI có đủ thông tin.`);
    }
    setBusy(true);
    setError(undefined);
    try {
      const document = await aiRepo.createTextDocument({
        title: title.trim(),
        content: content.trim(),
        schoolCode: schoolCode.trim() || undefined,
        topic: topic.trim() || undefined,
      });
      onCreated(document);
    } catch (reason) {
      setError(errorMessage(reason, 'Không lưu được nội dung.'));
      setBusy(false);
    }
  };

  return (
    <AdminDialog
      titleId={titleId}
      icon={<ClipboardPaste aria-hidden="true" />}
      title="Dán văn bản"
      description="Dùng cho nội dung ngắn như FAQ, thông báo, quy định mới mà không cần tạo tệp."
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="admin-button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="admin-button primary" disabled={busy} aria-busy={busy}>
            <SubmitLabel busy={busy} label="Lưu vào kho" busyLabel="Đang lưu…" />
          </button>
        </>
      }
    >
      <div className="admin-dialog-fields">
        <div className="admin-dialog-field">
          <label htmlFor={`${titleId}-title`}>Tên tài liệu</label>
          <input
            id={`${titleId}-title`}
            className={styles.input}
            value={title}
            maxLength={TITLE_MAX}
            placeholder="VD: Câu hỏi thường gặp về thanh toán"
            disabled={busy}
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="admin-dialog-field">
          <label htmlFor={`${titleId}-content`}>Nội dung</label>
          <textarea
            id={`${titleId}-content`}
            rows={8}
            value={content}
            placeholder="Dán nội dung vào đây. Nên có tiêu đề cho từng phần để AI cắt đoạn chính xác hơn."
            aria-describedby={`${titleId}-content-meta`}
            disabled={busy}
            onChange={(event) => setContent(event.target.value)}
          />
          <div id={`${titleId}-content-meta`} className="admin-dialog-field-meta">
            <span>Tối thiểu {TEXT_MIN} ký tự</span>
            <span>{contentLength.toLocaleString('vi-VN')} ký tự</span>
          </div>
        </div>
        <ScopeFields
          idPrefix={titleId}
          schoolCode={schoolCode}
          topic={topic}
          disabled={busy}
          onSchoolCode={setSchoolCode}
          onTopic={setTopic}
        />
      </div>
      {error && (
        <p className="mentor-form-error" role="alert">
          {error}
        </p>
      )}
    </AdminDialog>
  );
}

export function DeleteDocumentDialog({
  document,
  onClose,
  onDeleted,
}: {
  document: AiDocument;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const confirm = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await aiRepo.deleteDocument(document.id);
      onDeleted();
    } catch (reason) {
      setError(errorMessage(reason, 'Không xóa được tài liệu.'));
      setBusy(false);
    }
  };

  return (
    <AdminDialog
      titleId={titleId}
      tone="danger"
      alert
      icon={<Trash2 aria-hidden="true" />}
      title="Xóa tài liệu khỏi kho?"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="admin-button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className="admin-button danger"
            disabled={busy}
            aria-busy={busy}
            onClick={() => void confirm()}
          >
            <SubmitLabel busy={busy} label="Xóa tài liệu" busyLabel="Đang xóa…" />
          </button>
        </>
      }
    >
      <p className="admin-dialog-text">
        <b>{document.title}</b> và {document.chunkCount.toLocaleString('vi-VN')} đoạn đã cắt sẽ bị
        xóa vĩnh viễn. Từ lúc này chatbot và bot diễn đàn không dùng nội dung này để trả lời nữa.
      </p>
      {error && (
        <p className="mentor-form-error" role="alert">
          {error}
        </p>
      )}
    </AdminDialog>
  );
}
