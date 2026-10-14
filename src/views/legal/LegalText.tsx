/**
 * @file LegalText.tsx
 * @description Hiển thị một dòng văn bản pháp lý: `**chữ**` thành in đậm, địa chỉ email thành
 * liên kết `mailto:`.
 */

import { Fragment } from 'react';

const EMAIL_PATTERN = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

function withEmailLinks(text: string, key: string) {
  // `split` with a capture group puts the matched emails at the odd indexes.
  return text.split(EMAIL_PATTERN).map((part, index) =>
    index % 2 === 1 ? (
      <a
        key={`${key}-${index}`}
        href={`mailto:${part}`}
        className="break-all rounded-sm text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {part}
      </a>
    ) : (
      <Fragment key={`${key}-${index}`}>{part}</Fragment>
    ),
  );
}

export function LegalText({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={index} className="font-bold text-[#12386e]">
        {withEmailLinks(part.slice(2, -2), `b${index}`)}
      </strong>
    ) : (
      <Fragment key={index}>{withEmailLinks(part, `t${index}`)}</Fragment>
    ),
  );
}
