'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFormGetValues, UseFormReset, UseFormWatch } from 'react-hook-form';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';

export function useMentorDraft({
  userId,
  loading,
  watch,
  getValues,
  reset,
}: {
  userId?: string;
  loading: boolean;
  watch: UseFormWatch<MentorProfileFormValues>;
  getValues: UseFormGetValues<MentorProfileFormValues>;
  reset: UseFormReset<MentorProfileFormValues>;
}) {
  const key = userId ? `skillswap:mentor-draft:${userId}` : null;
  const restored = useRef(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!key || loading || restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const draft = JSON.parse(raw) as { values?: MentorProfileFormValues; savedAt?: string };
        if (draft.values) reset({ ...getValues(), ...draft.values, agreeTerms: false });
        if (draft.savedAt) setLastSavedAt(new Date(draft.savedAt));
      }
    } catch {
      localStorage.removeItem(key);
    }
  }, [getValues, key, loading, reset]);

  const save = useCallback(() => {
    if (!key) return;
    const savedAt = new Date();
    localStorage.setItem(
      key,
      JSON.stringify({ values: getValues(), savedAt: savedAt.toISOString() }),
    );
    setLastSavedAt(savedAt);
    setDirty(false);
  }, [getValues, key]);

  useEffect(() => {
    if (!key || loading || !restored.current) return;
    const subscription = watch(() => setDirty(true));
    return () => subscription.unsubscribe();
  }, [key, loading, watch]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(save, 2000);
    return () => clearTimeout(timer);
  }, [dirty, save]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return {
    saveDraft: save,
    lastSavedAt,
    clearDraft: () => {
      if (key) localStorage.removeItem(key);
      setDirty(false);
    },
  };
}
