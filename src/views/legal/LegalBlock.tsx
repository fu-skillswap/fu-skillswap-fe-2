/**
 * @file LegalBlock.tsx
 * @description Hiển thị một khối văn bản pháp lý (đoạn, danh sách, các bước, bảng, ghi chú). Dùng
 * chung cho trang Chính sách bảo mật và hộp thoại điều khoản ở trang thanh toán.
 */

import type { PrivacyBlock } from '@/constants/privacyPolicy';
import { Info, TriangleAlert } from 'lucide-react';
import { LegalText } from './LegalText';

export function LegalBlock({ block }: { block: PrivacyBlock }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="my-4">
          <LegalText text={block.text} />
        </p>
      );
    case 'list':
      return (
        <ul className="my-4 grid list-disc gap-2 pl-6 marker:text-primary">
          {block.items.map((item, index) => (
            <li key={index}>
              <LegalText text={item} />
            </li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className="my-4 grid list-none gap-3 p-0">
          {block.items.map((item, index) => (
            <li key={index} className="flex gap-3">
              <span
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-50 text-sm font-bold text-primary"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="sr-only">Bước {index + 1}: </span>
                <LegalText text={item} />
              </span>
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div className="my-5 overflow-x-auto rounded-2xl border border-solid border-sky-100">
          <table className="w-full min-w-[520px] border-collapse text-left text-[15px] leading-6">
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="border-0 border-b border-solid border-sky-100 bg-sky-50 px-4 py-3 font-bold text-[#12386e]"
                  >
                    <LegalText text={column} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="align-top">
                  {row.map((cell, cellIndex) =>
                    cellIndex === 0 ? (
                      <th
                        key={cellIndex}
                        scope="row"
                        className="border-0 border-t border-solid border-sky-100 px-4 py-3 font-bold text-[#12386e]"
                      >
                        <LegalText text={cell} />
                      </th>
                    ) : (
                      <td
                        key={cellIndex}
                        className="border-0 border-t border-solid border-sky-100 px-4 py-3"
                      >
                        <LegalText text={cell} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'note': {
      const isWarning = block.tone === 'warning';
      const Icon = isWarning ? TriangleAlert : Info;
      return (
        <div
          className={`my-5 flex gap-3 rounded-2xl border border-solid px-4 py-3.5 ${
            isWarning ? 'border-amber-200 bg-amber-50' : 'border-sky-100 bg-sky-50'
          }`}
        >
          <Icon
            className={`mt-1 h-5 w-5 shrink-0 ${isWarning ? 'text-amber-600' : 'text-primary'}`}
            aria-hidden="true"
          />
          <p className="m-0">
            <LegalText text={block.text} />
          </p>
        </div>
      );
    }
  }
}
