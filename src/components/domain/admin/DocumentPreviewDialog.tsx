/**
 * @file DocumentPreviewDialog.tsx
 * @description Hộp thoại xem trước tài liệu minh chứng (ảnh hoặc PDF) trong khu vực quản trị.
 * Lấy signed URL ngắn hạn qua `resolveUrl`, tải file thành blob để hiển thị (PDF vẫn xem được dù
 * máy chủ trả về dạng tải xuống); nếu bị chặn CORS thì dùng thẳng signed URL.
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
  originalFilename: string;
  contentType: string;
  /** Secondary line under the file name, e.g. document type and size. */
  meta?: string;
};

type PreviewState =
  { status: 'loading' } | { status: 'ready'; src: string; signedUrl: string } | { status: 'error' };

function usePreviewSource(resolveUrl: () => Promise<string>, contentType: string) {
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
  }, [attempt, contentType]);

  return { state, retry };
}

export function DocumentPreviewDialog({
  document,
  resolveUrl,
  onClose,
}: {
  document: PreviewDocument;
  /** Returns a fresh, short-lived URL for the file. */
  resolveUrl: () => Promise<string>;
  onClose: () => void;
}) {
  const { state: source, retry } = usePreviewSource(resolveUrl, document.contentType);
  const [renderFailed, setRenderFailed] = useState(false);
  const isImage = document.contentType.startsWith('image/');
  const isPdf = document.contentType === 'application/pdf';
  const isReady = source.status === 'ready';

  const handleRetry = () => {
    setRenderFailed(false);
    retry();
  };

  const showError = source.status === 'error' || renderFailed || (!isImage && !isPdf);

  return (
    <AdminDialog
      titleId="document-preview-title"
      size="wide"
      icon={<FileText aria-hidden="true" />}
      title={<span title={document.originalFilename}>{document.originalFilename}</span>}
      description={document.meta}
      onClose={onClose}
      footer={
        <>
          {isReady && (
            <>
              <a className="admin-button" href={source.src} download={document.originalFilename}>
                <Download aria-hidden="true" /> Tải xuống
              </a>
              <a className="admin-button" href={source.signedUrl} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" /> Mở ở tab mới
              </a>
            </>
          )}
          <button type="button" className="admin-button is-primary" onClick={onClose}>
            Đóng
          </button>
        </>
      }
    >
      <div className="admin-document-stage">
        {source.status === 'loading' ? (
          <div className="admin-document-state" role="status">
            <LoaderCircle className="is-spinning" aria-hidden="true" />
            <span>Đang tải bản xem trước…</span>
          </div>
        ) : showError ? (
          <div className="admin-document-state is-error" role="alert">
            <AlertTriangle aria-hidden="true" />
            <strong>Không thể hiển thị bản xem trước</strong>
            <span>
              {source.status === 'error'
                ? 'Không lấy được đường dẫn xem tài liệu. Đường dẫn có thể đã hết hạn hoặc bạn không có quyền xem.'
                : 'Định dạng này không xem trước được. Hãy tải xuống hoặc mở ở tab mới để kiểm tra.'}
            </span>
            <button type="button" className="admin-button" onClick={handleRetry}>
              <RotateCw aria-hidden="true" /> Thử lại
            </button>
          </div>
        ) : isImage ? (
          <img
            src={isReady ? source.src : undefined}
            alt={`Xem trước ${document.originalFilename}`}
            onError={() => setRenderFailed(true)}
          />
        ) : (
          <iframe
            title={`Xem trước ${document.originalFilename}`}
            src={isReady ? source.src : undefined}
          />
        )}
      </div>
    </AdminDialog>
  );
}
