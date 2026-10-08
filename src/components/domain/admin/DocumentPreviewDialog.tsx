/**
 * @file DocumentPreviewDialog.tsx
 * @description Hộp thoại xem trước tài liệu minh chứng (ảnh hoặc PDF) trong khu vực quản trị.
 * Lấy signed URL ngắn hạn qua `resolveUrl`, tải file thành blob để hiển thị (PDF vẫn xem được dù
 * máy chủ trả về dạng tải xuống); nếu bị chặn CORS thì dùng thẳng signed URL. Hỗ trợ chuyển qua
 * lại giữa các tài liệu mà không đóng hộp thoại.
 */

'use client';

import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  RotateCw,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminDialog } from '@/components/domain/admin/AdminDialog';

export type PreviewDocument = {
  /** Changes when another document is shown, so the preview reloads. */
  id: string;
  /** Dialog title, e.g. the document type label. */
  title: string;
  originalFilename: string;
  contentType: string;
  /** Secondary line under the title, e.g. "PDF · 179 KB · filename". */
  meta?: string;
};

export type PreviewNavigation = {
  /** Zero-based position of the current document. */
  index: number;
  total: number;
  previousLabel?: string;
  nextLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
};

type PreviewState =
  { status: 'loading' } | { status: 'ready'; src: string; signedUrl: string } | { status: 'error' };

function usePreviewSource(
  resolveUrl: () => Promise<string>,
  documentId: string,
  contentType: string,
) {
  const [state, setState] = useState<PreviewState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  // The parent recreates `resolveUrl` every render; keep the latest without re-running the load.
  const resolveRef = useRef(resolveUrl);
  resolveRef.current = resolveUrl;

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setState({ status: 'loading' });

    (async () => {
      let signedUrl: string;
      try {
        signedUrl = await resolveRef.current();
      } catch {
        if (!cancelled) setState({ status: 'error' });
        return;
      }
      try {
        const response = await fetch(signedUrl, { credentials: 'omit' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (cancelled) return;
        // Force the declared type so PDFs render inline even when served as a download.
        objectUrl = URL.createObjectURL(
          new Blob([blob], { type: contentType || blob.type || 'application/octet-stream' }),
        );
        setState({ status: 'ready', src: objectUrl, signedUrl });
      } catch {
        // Storage without CORS for this origin: let <img>/<iframe> load the signed URL directly.
        if (!cancelled) setState({ status: 'ready', src: signedUrl, signedUrl });
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attempt, documentId, contentType]);

  return { state, retry };
}

export function DocumentPreviewDialog({
  document,
  resolveUrl,
  onClose,
  navigation,
}: {
  document: PreviewDocument;
  /** Returns a fresh, short-lived URL for the file. */
  resolveUrl: () => Promise<string>;
  onClose: () => void;
  navigation?: PreviewNavigation;
}) {
  const { state: source, retry } = usePreviewSource(resolveUrl, document.id, document.contentType);
  const [renderFailed, setRenderFailed] = useState(false);
  const isImage = document.contentType.startsWith('image/');
  const isPdf = document.contentType === 'application/pdf';

  useEffect(() => setRenderFailed(false), [document.id]);

  const handleRetry = () => {
    setRenderFailed(false);
    retry();
  };

  const linkFailed = source.status === 'error';
  const cannotRender = source.status === 'ready' && (renderFailed || (!isImage && !isPdf));
  // Unsupported types are known up front, so they never open at the wide preview size.
  const isCompact = linkFailed || renderFailed || (!isImage && !isPdf);

  const fileActions = (primary: boolean) =>
    source.status === 'ready' && (
      <div className="admin-document-actions">
        <a
          className={`admin-button ${primary ? 'is-primary' : ''}`}
          href={source.src}
          download={document.originalFilename}
        >
          <Download aria-hidden="true" /> Tải xuống
        </a>
        <a className="admin-button" href={source.signedUrl} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" /> Mở ở tab mới
        </a>
      </div>
    );

  const hasPrevious = Boolean(navigation?.onPrevious) && (navigation?.index ?? 0) > 0;
  const hasNext =
    Boolean(navigation?.onNext) && (navigation?.index ?? 0) < (navigation?.total ?? 0) - 1;

  return (
    <AdminDialog
      titleId="document-preview-title"
      size={isCompact ? 'default' : 'wide'}
      icon={<FileText aria-hidden="true" />}
      title={<span title={document.originalFilename}>{document.title}</span>}
      description={document.meta}
      onClose={onClose}
      footerStart={
        navigation && navigation.total > 1
          ? `Tài liệu ${navigation.index + 1}/${navigation.total}`
          : undefined
      }
      footer={
        navigation && navigation.total > 1 ? (
          <>
            <button
              type="button"
              className="admin-button"
              disabled={!hasPrevious}
              onClick={navigation.onPrevious}
            >
              {hasPrevious && navigation.previousLabel ? navigation.previousLabel : 'Trước'}
            </button>
            <button
              type="button"
              className="admin-button"
              disabled={!hasNext}
              onClick={navigation.onNext}
            >
              {hasNext && navigation.nextLabel ? navigation.nextLabel : 'Sau'}
            </button>
          </>
        ) : (
          <button type="button" className="admin-button" onClick={onClose}>
            Đóng
          </button>
        )
      }
    >
      {source.status === 'loading' ? (
        <div className="admin-document-stage">
          <div className="admin-document-state" role="status">
            <LoaderCircle className="is-spinning" aria-hidden="true" />
            <span>Đang tải bản xem trước…</span>
          </div>
        </div>
      ) : linkFailed ? (
        <div className="admin-document-notice" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>Không lấy được đường dẫn xem tài liệu</strong>
            <span>Đường dẫn có thể đã hết hạn hoặc bạn không có quyền xem.</span>
          </div>
          <button type="button" className="admin-button" onClick={handleRetry}>
            <RotateCw aria-hidden="true" /> Thử lại
          </button>
        </div>
      ) : cannotRender ? (
        <>
          <div className="admin-document-notice" role="status">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>Trình duyệt không xem trước được file này</strong>
              <span>Tải xuống hoặc mở ở tab mới để kiểm tra nội dung.</span>
            </div>
          </div>
          {fileActions(true)}
        </>
      ) : (
        <>
          <div className="admin-document-stage">
            {isImage ? (
              <img
                src={source.status === 'ready' ? source.src : undefined}
                alt={`Xem trước ${document.title}`}
                onError={() => setRenderFailed(true)}
              />
            ) : (
              <iframe
                title={`Xem trước ${document.title}`}
                src={source.status === 'ready' ? source.src : undefined}
              />
            )}
          </div>
          {fileActions(false)}
        </>
      )}
    </AdminDialog>
  );
}
