/**
 * @file ServiceDescriptionFields.tsx
 * @description Các ô nhập có cấu trúc cho mô tả dịch vụ (giới thiệu, đối tượng phù hợp, nội dung
 * buổi tư vấn). Ghép lại thành một chuỗi `description` mà thẻ dịch vụ trên hồ sơ mentor đọc được.
 */

'use client';

import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { composeServiceDescription, parseServiceDescription } from './serviceDescription';

const MAX_ITEMS = 8;
const MAX_AUDIENCE = 6;

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-sky-300 focus:border-primary focus:ring-4 focus:ring-primary/10';

interface ServiceDescriptionFieldsProps {
  /** Prefix for element ids so two forms on one page do not collide. */
  idPrefix: string;
  value: string;
  onChange: (description: string) => void;
  error?: string;
  maxLength?: number;
}

function toParts(description: string) {
  const parsed = parseServiceDescription(description);
  return {
    intro: parsed.intro,
    outcome: parsed.outcome ?? '',
    items: parsed.items.length ? parsed.items : ['', ''],
    audience: parsed.audience,
  };
}

export function ServiceDescriptionFields({
  idPrefix,
  value,
  onChange,
  error,
  maxLength = 1000,
}: ServiceDescriptionFieldsProps) {
  const [parts, setParts] = useState(() => toParts(value));
  const [audienceDraft, setAudienceDraft] = useState('');
  // Older descriptions carry their outcome sentence inline; keep it visible so it stays editable.
  const [showOutcome, setShowOutcome] = useState(() => Boolean(parts.outcome));
  const lastEmitted = useRef(value);

  // Re-read the parts only when the form value changes from outside (e.g. form.reset).
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    const next = toParts(value);
    setParts(next);
    setShowOutcome(Boolean(next.outcome));
  }, [value]);

  const update = (next: typeof parts) => {
    setParts(next);
    const description = composeServiceDescription(next);
    lastEmitted.current = description;
    onChange(description);
  };

  const composedLength = composeServiceDescription(parts).length;

  const addAudience = () => {
    const entries = audienceDraft
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry && !parts.audience.includes(entry));
    if (entries.length) {
      update({ ...parts, audience: [...parts.audience, ...entries].slice(0, MAX_AUDIENCE) });
    }
    setAudienceDraft('');
  };

  const handleAudienceKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addAudience();
    } else if (event.key === 'Backspace' && !audienceDraft && parts.audience.length) {
      update({ ...parts, audience: parts.audience.slice(0, -1) });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          className="mb-1.5 block text-sm font-semibold text-slate-700"
          htmlFor={`${idPrefix}-intro`}
        >
          Giới thiệu ngắn <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`${idPrefix}-intro`}
          className={`${inputClassName} min-h-16 resize-y py-2.5 leading-5`}
          rows={2}
          placeholder="VD: Review CV theo góc nhìn của nhà tuyển dụng và mentor trong ngành IT"
          value={parts.intro}
          aria-invalid={Boolean(error)}
          onChange={(event) => update({ ...parts, intro: event.target.value })}
        />
        <span className="mt-1 block text-xs text-slate-500">
          Hiển thị ngay dưới tên dịch vụ trên hồ sơ của bạn.
        </span>
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-semibold text-slate-700"
          htmlFor={`${idPrefix}-audience`}
        >
          Phù hợp cho
        </label>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 hover:border-sky-300">
          {parts.audience.map((entry) => (
            <span
              key={entry}
              className="inline-flex items-center gap-1 rounded-full bg-primary-light py-1 pr-1 pl-3 text-xs font-semibold text-sky-800"
            >
              {entry}
              <button
                type="button"
                aria-label={`Xóa ${entry}`}
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-sky-800 outline-none hover:bg-sky-100 focus-visible:ring-2 focus-visible:ring-primary/40"
                onClick={() =>
                  update({ ...parts, audience: parts.audience.filter((item) => item !== entry) })
                }
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          {parts.audience.length < MAX_AUDIENCE && (
            <input
              id={`${idPrefix}-audience`}
              className="h-7 min-w-40 flex-1 border-0 bg-transparent px-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder={parts.audience.length ? 'Thêm đối tượng…' : 'VD: Sinh viên IT, Fresher'}
              value={audienceDraft}
              onChange={(event) => setAudienceDraft(event.target.value)}
              onKeyDown={handleAudienceKeyDown}
              onBlur={addAudience}
            />
          )}
        </div>
        <span className="mt-1 block text-xs text-slate-500">
          Nhấn Enter hoặc dấu phẩy để thêm. Tối đa {MAX_AUDIENCE} đối tượng.
        </span>
      </div>

      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-1.5 block p-0 text-sm font-semibold text-slate-700">
          Trong buổi tư vấn, bạn sẽ giúp mentee
        </legend>
        <ol className="m-0 list-none space-y-2 p-0">
          {parts.items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-right text-xs font-semibold text-slate-500">
                {index + 1}.
              </span>
              <input
                className={`${inputClassName} h-10`}
                aria-label={`Nội dung ${index + 1}`}
                placeholder={
                  index === 0
                    ? 'VD: Review chi tiết CV theo góc nhìn nhà tuyển dụng'
                    : 'Thêm một nội dung bạn sẽ hỗ trợ'
                }
                value={item}
                onChange={(event) =>
                  update({
                    ...parts,
                    items: parts.items.map((current, itemIndex) =>
                      itemIndex === index ? event.target.value : current,
                    ),
                  })
                }
              />
              <button
                type="button"
                aria-label={`Xóa nội dung ${index + 1}`}
                disabled={parts.items.length <= 1}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-slate-500 outline-none transition hover:bg-slate-100 hover:text-red-600 focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() =>
                  update({ ...parts, items: parts.items.filter((_, i) => i !== index) })
                }
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
        {parts.items.length < MAX_ITEMS && (
          <button
            type="button"
            className="mt-2 inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-transparent px-2 text-sm font-semibold text-sky-800 outline-none hover:bg-primary-light focus-visible:ring-4 focus-visible:ring-primary/20"
            onClick={() => update({ ...parts, items: [...parts.items, ''] })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Thêm nội dung
          </button>
        )}
        <span className="mt-1 block text-xs text-slate-500">
          Từ 2 nội dung trở lên sẽ hiển thị thành danh sách có dấu tích trên hồ sơ.
        </span>
      </fieldset>

      {showOutcome && (
        <div>
          <label
            className="mb-1.5 block text-sm font-semibold text-slate-700"
            htmlFor={`${idPrefix}-inline-outcome`}
          >
            Câu kết quả trong mô tả cũ
          </label>
          <textarea
            id={`${idPrefix}-inline-outcome`}
            className={`${inputClassName} min-h-16 resize-y py-2.5 leading-5`}
            rows={2}
            value={parts.outcome}
            onChange={(event) => update({ ...parts, outcome: event.target.value })}
          />
          <span className="mt-1 block text-xs text-slate-500">
            Câu này hiển thị trong khung kết quả trên hồ sơ, thay cho ô Kết quả mong đợi. Xóa trống
            để dùng ô Kết quả mong đợi.
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        {error ? (
          <span className="block text-xs font-medium text-red-600" role="alert">
            {error}
          </span>
        ) : (
          <span />
        )}
        <span
          className={`shrink-0 text-xs ${composedLength > maxLength ? 'font-semibold text-red-600' : 'text-slate-500'}`}
        >
          {composedLength}/{maxLength} ký tự
        </span>
      </div>
    </div>
  );
}
