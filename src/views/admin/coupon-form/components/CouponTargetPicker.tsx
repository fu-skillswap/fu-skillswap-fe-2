/**
 * @file CouponTargetPicker.tsx
 * @description Combobox that searches mentors and adds them as coupon targets, plus the chip list.
 */

'use client';

import type { AdminMentor } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { CouponTarget } from '../couponForm';
import styles from '../AdminCouponFormView.module.css';

const RESULT_LIMIT = 8;

type SearchState = 'idle' | 'loading' | 'ready' | 'error';

const KIND_LABEL: Record<CouponTarget['kind'], string> = { mentor: 'Mentor', service: 'Dịch vụ' };

export function CouponTargetPicker({
  inputId,
  targets,
  invalid,
  describedBy,
  onAdd,
  onRemove,
}: {
  inputId: string;
  targets: CouponTarget[];
  invalid: boolean;
  describedBy: string;
  onAdd: (target: CouponTarget) => void;
  onRemove: (target: CouponTarget) => void;
}) {
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminMentor[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // TODO(api): admin service search for applicableServiceIds — only mentors are searchable today.
  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) {
      setResults([]);
      setState('idle');
      return;
    }
    let cancelled = false;
    setState('loading');
    const timeout = window.setTimeout(() => {
      adminRepo
        .getMentors({ keyword, page: 0, size: RESULT_LIMIT })
        .then((data) => {
          if (cancelled) return;
          setResults(data.content);
          setState('ready');
          setActiveIndex(data.content.length ? 0 : -1);
        })
        .catch(() => {
          if (!cancelled) setState('error');
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const isSelected = (mentor: AdminMentor) =>
    targets.some((target) => target.kind === 'mentor' && target.id === mentor.mentorUserId);

  const select = (mentor: AdminMentor) => {
    if (isSelected(mentor)) return;
    onAdd({ kind: 'mentor', id: mentor.mentorUserId, label: mentor.displayName });
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : -1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) =>
        results.length ? (index - 1 + results.length) % results.length : -1,
      );
    } else if (event.key === 'Enter') {
      // Never submit the whole form from the search box.
      event.preventDefault();
      const mentor = results[activeIndex];
      if (open && mentor) select(mentor);
    } else if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        setOpen(false);
      }
    }
  };

  const showList = open && query.trim().length > 0;
  const activeId = showList && results[activeIndex] ? `${listboxId}-${activeIndex}` : undefined;

  return (
    <div className={styles.picker} ref={wrapperRef}>
      <div className={`${styles.pickerInput} ${invalid ? styles.isInvalid : ''}`}>
        <Search aria-hidden="true" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          placeholder="Tìm mentor hoặc dịch vụ"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>
      {showList && (
        <ul id={listboxId} role="listbox" aria-label="Kết quả tìm kiếm" className={styles.listbox}>
          {state === 'loading' && <li className={styles.listboxNote}>Đang tìm…</li>}
          {state === 'error' && (
            <li className={styles.listboxNote}>Không tìm được lúc này. Thử lại sau ít phút.</li>
          )}
          {state === 'ready' && !results.length && (
            <li className={styles.listboxNote}>Không có mentor nào khớp “{query.trim()}”.</li>
          )}
          {state === 'ready' &&
            results.map((mentor, index) => {
              const selected = isSelected(mentor);
              return (
                <li
                  key={mentor.mentorUserId}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  aria-disabled={selected || undefined}
                  className={`${styles.option} ${index === activeIndex ? styles.isActive : ''}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(mentor)}
                >
                  <span className={styles.optionKind}>Mentor</span>
                  <span className={styles.optionText}>
                    <strong>{mentor.displayName}</strong>
                    <small>{mentor.primaryLabel ?? mentor.email}</small>
                  </span>
                  {selected && <span className={styles.optionAdded}>Đã chọn</span>}
                </li>
              );
            })}
        </ul>
      )}
      {targets.length > 0 && (
        <ul className={styles.chips} aria-label="Đã chọn">
          {targets.map((target) => (
            <li key={`${target.kind}:${target.id}`} className={styles.chip}>
              <span>
                {KIND_LABEL[target.kind]} · {target.label}
              </span>
              <button
                type="button"
                aria-label={`Bỏ ${target.label}`}
                onClick={() => onRemove(target)}
              >
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
