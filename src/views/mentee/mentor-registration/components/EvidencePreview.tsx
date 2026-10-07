/**
 * @file EvidencePreview.tsx
 * @description Xem trước file minh chứng (ảnh hoặc PDF) để người dùng kiểm tra trước khi nộp hồ sơ.
 */

'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

type EvidencePreviewProps = {
  /** Local file just selected (preview via an object URL). */
  file?: File;
  /** Already uploaded file URL from the API. */
  url?: string;
  contentType?: string;
  name: string;
  /** `thumb` renders a small square tile (used in the review step). */
  variant?: 'full' | 'thumb';
};

const IMAGE_EXTENSIONS = /\.(jpe?g|png)$/i;
const PDF_EXTENSION = /\.pdf$/i;

export function EvidencePreview({
  file,
  url,
  contentType,
  name,
  variant = 'full',
}: EvidencePreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!file) return;
    const created = URL.createObjectURL(file);
    setObjectUrl(created);
    setFailed(false);
    return () => URL.revokeObjectURL(created);
  }, [file]);

  const src = file ? objectUrl : url;
  const type = file?.type || contentType || '';
  const isImage = type.startsWith('image/') || (!type && IMAGE_EXTENSIONS.test(name));
  const isPdf = type === 'application/pdf' || (!type && PDF_EXTENSION.test(name));

  if (variant === 'thumb') {
    const tileClass =
      'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-500';
    if (src && isImage && !failed) {
      return (
        <a href={src} target="_blank" rel="noreferrer" className={tileClass} title={name}>
          <img
            src={src}
            alt={`Xem trước ${name}`}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        </a>
      );
    }
    const icon = <FileText className="h-6 w-6" aria-hidden="true" />;
    return src ? (
      <a href={src} target="_blank" rel="noreferrer" className={tileClass} title={name}>
        {icon}
      </a>
    ) : (
      <span className={tileClass}>{icon}</span>
    );
  }

  if (!src || (!isImage && !isPdf)) return null;

  if (isImage && !failed) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-lg border border-slate-200 bg-white"
        aria-label={`Mở ảnh ${name} ở tab mới`}
      >
        <img
          src={src}
          alt={`Xem trước ${name}`}
          onError={() => setFailed(true)}
          className="mx-auto max-h-72 w-full object-contain"
        />
      </a>
    );
  }

  if (isPdf) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <object data={src} type="application/pdf" className="block h-80 w-full" aria-label={name}>
          <p className="m-0 p-4 text-xs text-slate-600">
            Trình duyệt không hỗ trợ xem PDF trực tiếp.{' '}
            <a href={src} target="_blank" rel="noreferrer" className="font-bold text-sky-700">
              Mở file PDF
            </a>
          </p>
        </object>
      </div>
    );
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
    >
      Không tải được ảnh xem trước — mở file <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
