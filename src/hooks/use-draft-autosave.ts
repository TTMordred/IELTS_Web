"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DRAFT_PREFIX = "ielts:draft:";

export type DraftStatus = "idle" | "saving" | "saved" | "error";

type StoredDraft<T> = {
  value: T;
  savedAt: string;
};

type UseDraftAutosaveOptions<T> = {
  /** Unique storage key for this form instance. */
  key: string;
  /** Current form value (must be JSON-serializable). */
  value: T;
  /** Debounce delay in ms before writing to localStorage (default 1000). */
  debounceMs?: number;
  /** Set false to pause autosaving (e.g. while submitting). */
  enabled?: boolean;
  /** Optional custom dirty check; default: value differs from the initial mount value. */
  isDirty?: (value: T) => boolean;
};

export type UseDraftAutosaveResult<T> = {
  status: DraftStatus;
  savedAt: Date | null;
  draft: T | null;
  showRestore: boolean;
  consumeDraft: () => void;
  clearDraft: () => void;
};

/**
 * Google-Forms-style autosave for long input forms. Debounced writes of the
 * current value go to localStorage (namespaced by `key`). On mount, any draft
 * saved by a previous session is surfaced via `showRestore`/`draft` so the
 * form can offer to restore it â€” the user's input survives crashes, refreshes
 * and power loss without any network round-trips.
 *
 * While the restore banner is being offered, the saved draft is left untouched
 * (the pristine mount value is never written over it). As soon as the user
 * types, the banner is dismissed and the new input becomes the draft.
 */
export function useDraftAutosave<T>({
  key,
  value,
  debounceMs = 1000,
  enabled = true,
  isDirty,
}: UseDraftAutosaveOptions<T>): UseDraftAutosaveResult<T> {
  const storageKey = `${DRAFT_PREFIX}${key}`;
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [showRestore, setShowRestore] = useState(false);
  const baselineRef = useRef<T>(value);
  const draftRef = useRef<T | null>(null);
  const restoreOfferedRef = useRef(false);

  // Load a draft saved by a previous session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredDraft<T>;
      if (parsed && parsed.value !== null && parsed.value !== undefined) {
        draftRef.current = parsed.value;
        // Restore a previously saved draft on mount. Intentionally effect-based
        // (not a lazy initializer) so the SSR'd HTML — which never shows the
        // banner — can't mismatch the client's hydration. Runs at most once,
        // guarded by restoreOfferedRef, so it never cascades.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft(parsed.value);
        setSavedAt(new Date(parsed.savedAt));
        restoreOfferedRef.current = true;
        setShowRestore(true);
      }
    } catch {
      // Corrupt/unreadable draft â€” ignore.
    }
  }, [storageKey]);

  // Debounced autosave whenever the value changes.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // While a restore banner is being offered, don't overwrite the saved draft:
    // leave it alone until the user actually changes something. Once they do,
    // stop offering restore and let their input become the new draft.
    if (restoreOfferedRef.current) {
      const isUserEditing = JSON.stringify(value) !== JSON.stringify(baselineRef.current);
      if (!isUserEditing) return;
      restoreOfferedRef.current = false;
      // User started typing — stop offering restore and adopt their input as
      // the new draft. One-shot dismissal; subsequent edits flow through the
      // debounced write below, so this never loops.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowRestore(false);
    }

    const dirty = isDirty
      ? isDirty(value)
      : JSON.stringify(value) !== JSON.stringify(baselineRef.current);
    if (!dirty) return;

    setStatus("saving");
    const timer = window.setTimeout(() => {
      try {
        const payload: StoredDraft<T> = { value, savedAt: new Date().toISOString() };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
        setDraft(value);
        setSavedAt(new Date());
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [value, storageKey, debounceMs, enabled, isDirty]);

  const consumeDraft = useCallback(() => {
    restoreOfferedRef.current = false;
    setShowRestore(false);
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    restoreOfferedRef.current = false;
    setDraft(null);
    setSavedAt(null);
    setShowRestore(false);
    setStatus("idle");
  }, [storageKey]);

  return { status, savedAt, draft, showRestore, consumeDraft, clearDraft };
}