/**
 * @file DocumentPreviewDialog.tsx
 * @description Hộp thoại xem trước tài liệu minh chứng (ảnh hoặc PDF) trong khu vực quản trị.
 * Tải file kèm access token rồi hiển thị bằng blob URL, nên xem được cả file cần xác thực
 * hoặc file máy chủ trả về dạng tải xuống.
 */

'use client';

import { AlertTriangle, Download, ExternalLink, FileText, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminDialog } from '@/components/domain/admin/AdminDialog';
import { getAccessToken } from '@/models/apiClient';

export type PreviewDocument = {
  originalFilename: string;
  contentType: string;
  fileUrl: string;
  /** Secondary line under the file name, e.g. document type and size. */
  meta?: string;
};

type PreviewState = { status: 'loading' } | { status: 'ready'; src: string } | { status: 'error' };

function isSameOrigin(url: string) {
  if (url.startsWith('/')) return true;
  try {
    return new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Loads the file as a blob (with the access token for same-origin API URLs). */
function usePreviewSource(url: string, contentType: string): PreviewState {
  const [state, setState] = useState<PreviewState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setState({ status: 'loading' });

    const token = getAccessToken();
    const sameOrigin = isSameOrigin(url);
    fetch(url, {
      headers: sameOrigin && token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: sameOrigin ? 'include' : 'omit',
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        // Force the declared type so PDFs render inline even when served as a download.
        objectUrl = URL.createObjectURL(
          new Blob([blob], { type: contentType || blob.type || 'application/octet-stream' }),
        );
        setState({ status: 'ready', src: objectUrl });
      })
      .catch(() => {
        // CORS or auth failure: fall back to the raw URL and let the element try it directly.
        if (!cancelled) setState({ status: 'ready', src: url });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, contentType]);

  return state;
}

export function DocumentPreviewDialog({
  document,
  onClose,
}: {
  document: PreviewDocument;
  onClose: () => void;
}) {
  const source = usePreviewSource(document.fileUrl, document.contentType);
  const [renderFailed, setRenderFailed] = useState(false);
  const isImage = document.contentType.startsWith('image/');
  const isPdf = document.contentType === 'application/pdf';

  useEffect(() => setRenderFailed(false), [document.fileUrl]);

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
          <a
            className="admin-button"
            href={source.status === 'ready' ? source.src : document.fileUrl}
            download={document.originalFilename}
          >
            <Download aria-hidden="true" /> Tải xuống
          </a>
          <a className="admin-button" href={document.fileUrl} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" /> Mở ở tab mới
          </a>
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
            <span>Hãy mở tài liệu ở tab mới hoặc tải xuống để kiểm tra.</span>
          </div>
        ) : isImage ? (
          <img
            src={source.status === 'ready' ? source.src : undefined}
            alt={`Xem trước ${document.originalFilename}`}
            onError={() => setRenderFailed(true)}
          />
        ) : (
          <iframe
            title={`Xem trước ${document.originalFilename}`}
            src={source.status === 'ready' ? source.src : undefined}
          />
        )}
      </div>
    </AdminDialog>
  );
}
