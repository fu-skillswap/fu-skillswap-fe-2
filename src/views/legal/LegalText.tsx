/**
 * @file LegalText.tsx
 * @description Hiển thị một dòng văn bản pháp lý: `**chữ**` thành in đậm, `[chỗ trống]` được tô
 * vàng ở môi trường dev để nhóm dễ thấy giá trị chưa điền (production hiển thị chữ thường).
 */

import { Fragment } from 'react';

const highlightPlaceholders = process.env.NODE_ENV !== 'production';

function withPlaceholders(text: string, key: string) {
  if (!highlightPlaceholders) return text;
  return text.split(/(\[[^\]]+\])/g).map((part, index) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <mark key={`${key}-${index}`} className="rounded bg-amber-100 px-1 text-amber-900">
        {part}
      </mark>
    ) : (
      <Fragment key={`${key}-${index}`}>{part}</Fragment>
    ),
  );
}

export function LegalText({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={index} className="font-bold text-[#12386e]">
        {withPlaceholders(part.slice(2, -2), `b${index}`)}
      </strong>
    ) : (
      <Fragment key={index}>{withPlaceholders(part, `t${index}`)}</Fragment>
    ),
  );
}
