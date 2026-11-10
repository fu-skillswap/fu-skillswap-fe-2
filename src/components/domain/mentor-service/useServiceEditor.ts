/**
 * @file useServiceEditor.ts
 * @description State + validation for the structured mentor service editor (create & edit).
 * Over-limit values (including legacy data) are never truncated: they show an error and block save.
 */

'use client';

import type { MentorServiceManagementResponse } from '@/models/auth';
import { useCallback, useMemo, useState } from 'react';
import { parseServiceDescription, serializeServiceDescription } from './serviceDescription';
import {
  AUDIENCE_ITEM_MAX,
  AUDIENCE_MAX_COUNT,
  INTRO_MAX,
  ITEMS_MAX,
  ITEMS_MIN,
  ITEM_MAX,
  OUTCOME_MAX,
  TITLE_MAX,
  countChars,
} from './serviceLimits';
import { useServiceCoverUpload } from './useServiceCoverUpload';

/** Max public price accepted by the existing edit schema. */
const PRICE_MAX = 45_000_000;

export interface ServiceEditorPayload {
  title: string;
  description: string;
  expectedOutcome: string;
  isFree: boolean;
  priceScoin: number;
  maintainPostSessionChat: boolean;
  durationMinutes?: number;
  coverAssetId?: string;
  removeCoverImage?: boolean;
}

export interface ServiceEditorDefaults {
  title?: string;
  description?: string;
  expectedOutcome?: string;
  isFree?: boolean;
  priceScoin?: number;
  maintainPostSessionChat?: boolean;
  durationMinutes?: number;
  coverImageUrl?: string | null;
}

export const serviceToEditorDefaults = (
  service: MentorServiceManagementResponse,
): ServiceEditorDefaults => ({
  title: service.title,
  description: service.description,
  expectedOutcome: service.expectedOutcome,
  isFree: service.isFree,
  priceScoin: service.publicPriceScoin ?? 0,
  maintainPostSessionChat: service.maintainPostSessionChat,
  durationMinutes: service.durationMinutes,
  coverImageUrl: service.coverImageUrl,
});

const tooLong = (label: string, length: number, max: number) =>
  `${label} dài ${length} ký tự. Rút gọn còn tối đa ${max}.`;

const padItems = (items: string[]) =>
  items.length >= ITEMS_MIN ? items : [...items, ...Array(ITEMS_MIN - items.length).fill('')];

function initialTextState(defaults: ServiceEditorDefaults) {
  const parsed = parseServiceDescription(defaults.description);
  const savedOutcome = defaults.expectedOutcome?.trim() ?? '';
  return {
    title: defaults.title ?? '',
    intro: parsed.intro,
    audience: parsed.audience,
    items: padItems(parsed.items),
    // Legacy migration: an outcome sentence that used to live in the description.
    outcome: savedOutcome || parsed.legacyOutcome || '',
  };
}

export function useServiceEditor(defaults: ServiceEditorDefaults, mode: 'create' | 'edit') {
  const initial = useMemo(() => initialTextState(defaults), [defaults]);
  const [title, setTitle] = useState(initial.title);
  const [intro, setIntro] = useState(initial.intro);
  const [audience, setAudience] = useState<string[]>(initial.audience);
  const [audienceDraft, setAudienceDraft] = useState('');
  const [audienceDraftError, setAudienceDraftError] = useState<string>();
  const [items, setItems] = useState<string[]>(initial.items);
  const [outcome, setOutcome] = useState(initial.outcome);
  const [isFree, setIsFree] = useState(defaults.isFree ?? false);
  const [priceInput, setPriceInput] = useState(String(defaults.priceScoin ?? 0));
  const [maintainPostSessionChat, setMaintainPostSessionChat] = useState(
    defaults.maintainPostSessionChat ?? true,
  );
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(
    defaults.durationMinutes,
  );
  const [submitted, setSubmitted] = useState(false);
  const cover = useServiceCoverUpload(defaults.coverImageUrl);

  // ---- Audience tags --------------------------------------------------------------------
  const addAudience = useCallback((raw: string) => {
    const value = raw.trim();
    if (!value) return true;
    const length = countChars(value);
    if (length > AUDIENCE_ITEM_MAX) {
      setAudienceDraftError(
        `Đối tượng này dài ${length} ký tự. Rút gọn còn tối đa ${AUDIENCE_ITEM_MAX}.`,
      );
      return false;
    }
    setAudienceDraftError(undefined);
    setAudience((current) => {
      if (current.length >= AUDIENCE_MAX_COUNT) return current;
      if (current.some((entry) => entry.toLocaleLowerCase() === value.toLocaleLowerCase())) {
        return current;
      }
      return [...current, value];
    });
    return true;
  }, []);

  /** Commits the draft when it contains a comma (typing or paste); keeps the rest as draft. */
  const changeAudienceDraft = useCallback(
    (value: string) => {
      if (!value.includes(',')) {
        setAudienceDraft(value);
        const length = countChars(value);
        setAudienceDraftError(
          length > AUDIENCE_ITEM_MAX
            ? `Đối tượng này dài ${length} ký tự. Rút gọn còn tối đa ${AUDIENCE_ITEM_MAX}.`
            : undefined,
        );
        return;
      }
      const parts = value.split(',');
      const rest = parts.pop() ?? '';
      const failed = parts.find((part) => !addAudience(part));
      setAudienceDraft(failed !== undefined ? failed.trim() : rest);
    },
    [addAudience],
  );

  const commitAudienceDraft = useCallback(() => {
    if (addAudience(audienceDraft)) setAudienceDraft('');
  }, [addAudience, audienceDraft]);

  const removeAudience = useCallback((index: number) => {
    setAudience((current) => current.filter((_, i) => i !== index));
  }, []);

  // ---- Items --------------------------------------------------------------------------------
  const changeItem = useCallback((index: number, value: string) => {
    setItems((current) => current.map((item, i) => (i === index ? value : item)));
  }, []);
  const addItem = useCallback(() => {
    setItems((current) => (current.length >= ITEMS_MAX ? current : [...current, '']));
  }, []);
  const removeItem = useCallback((index: number) => {
    setItems((current) =>
      current.length <= ITEMS_MIN ? current : current.filter((_, i) => i !== index),
    );
  }, []);

  // ---- Validation ---------------------------------------------------------------------------
  const lengths = {
    title: countChars(title),
    intro: countChars(intro),
    outcome: countChars(outcome),
    items: items.map(countChars),
    audience: audience.map(countChars),
  };
  const filledItems = items.filter((item) => item.trim()).length;

  /** Over-limit errors: always visible (legacy data included) and always block save. */
  const limitErrors = {
    title: lengths.title > TITLE_MAX ? tooLong('Tên dịch vụ', lengths.title, TITLE_MAX) : undefined,
    intro: lengths.intro > INTRO_MAX ? tooLong('Giới thiệu', lengths.intro, INTRO_MAX) : undefined,
    outcome:
      lengths.outcome > OUTCOME_MAX ? tooLong('Kết quả', lengths.outcome, OUTCOME_MAX) : undefined,
    items: lengths.items.map((length) =>
      length > ITEM_MAX ? tooLong('Nội dung', length, ITEM_MAX) : undefined,
    ),
    itemsCount:
      items.length > ITEMS_MAX
        ? `Tối đa ${ITEMS_MAX} nội dung. Hãy gộp hoặc xoá bớt ${items.length - ITEMS_MAX} nội dung.`
        : undefined,
    audience:
      audience.length > AUDIENCE_MAX_COUNT
        ? `Tối đa ${AUDIENCE_MAX_COUNT} đối tượng. Hãy xoá bớt ${audience.length - AUDIENCE_MAX_COUNT}.`
        : lengths.audience.some((length) => length > AUDIENCE_ITEM_MAX)
          ? `Mỗi đối tượng tối đa ${AUDIENCE_ITEM_MAX} ký tự. Hãy xoá và nhập lại đối tượng quá dài.`
          : undefined,
  };

  const price = Number(priceInput);
  const priceInvalid =
    !isFree &&
    (priceInput.trim() === '' ||
      !Number.isInteger(price) ||
      price < 0 ||
      (mode === 'edit' && price > PRICE_MAX));

  /** Required/format errors: shown after the first save attempt. */
  const requiredErrors = {
    title: lengths.title === 0 ? 'Vui lòng nhập tên dịch vụ.' : undefined,
    intro: lengths.intro === 0 ? 'Vui lòng nhập giới thiệu ngắn.' : undefined,
    outcome: lengths.outcome === 0 ? 'Vui lòng nhập kết quả sau buổi tư vấn.' : undefined,
    items:
      filledItems < ITEMS_MIN ? `Cần ít nhất ${ITEMS_MIN} nội dung cho buổi tư vấn.` : undefined,
    price: priceInvalid ? 'Giá phải là số nguyên hợp lệ.' : undefined,
    duration: mode === 'create' && !durationMinutes ? 'Vui lòng chọn thời lượng.' : undefined,
  };

  const errors = {
    title: limitErrors.title ?? (submitted ? requiredErrors.title : undefined),
    intro: limitErrors.intro ?? (submitted ? requiredErrors.intro : undefined),
    outcome: limitErrors.outcome ?? (submitted ? requiredErrors.outcome : undefined),
    items: limitErrors.items,
    itemsList: limitErrors.itemsCount ?? (submitted ? requiredErrors.items : undefined),
    audience: limitErrors.audience,
    price: submitted ? requiredErrors.price : undefined,
    duration: submitted ? requiredErrors.duration : undefined,
  };

  const hasLimitErrors =
    Boolean(
      limitErrors.title ||
      limitErrors.intro ||
      limitErrors.outcome ||
      limitErrors.itemsCount ||
      limitErrors.audience,
    ) || limitErrors.items.some(Boolean);
  const hasRequiredErrors = Object.values(requiredErrors).some(Boolean);
  const canSave = !hasLimitErrors && !cover.isUploading;

  const description = serializeServiceDescription({ intro, items, audience });

  /** Returns the API payload, or null (and reveals errors) when the form is invalid. */
  const buildPayload = (): ServiceEditorPayload | null => {
    setSubmitted(true);
    if (!canSave || hasRequiredErrors) return null;
    return {
      title: title.trim(),
      description,
      expectedOutcome: outcome.trim(),
      isFree,
      priceScoin: isFree ? 0 : price,
      maintainPostSessionChat,
      ...(mode === 'create' ? { durationMinutes } : {}),
      ...(cover.coverAssetId ? { coverAssetId: cover.coverAssetId } : {}),
      ...(mode === 'edit' && cover.removeCoverImage && !cover.coverAssetId
        ? { removeCoverImage: true }
        : {}),
    };
  };

  return {
    values: {
      title,
      intro,
      audience,
      audienceDraft,
      items,
      outcome,
      isFree,
      priceInput,
      maintainPostSessionChat,
      durationMinutes,
    },
    setTitle,
    setIntro,
    setOutcome,
    setIsFree,
    setPriceInput,
    setMaintainPostSessionChat,
    setDurationMinutes,
    changeAudienceDraft,
    commitAudienceDraft,
    removeAudience,
    audienceDraftError,
    changeItem,
    addItem,
    removeItem,
    lengths,
    errors,
    canSave,
    cover,
    description,
    buildPayload,
  };
}

export type ServiceEditorState = ReturnType<typeof useServiceEditor>;
