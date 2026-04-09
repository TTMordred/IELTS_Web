"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  BookMarked,
  BookOpen,
  Headphones,
  PenTool,
  MessageSquare,
  Library,
  Search,
  Headphones as HeadphonesIcon,
  BarChart3,
} from "lucide-react";
import { globalSearch, SearchResultItem, SearchResults } from "@/app/(app)/search/actions";

// ── Quick actions always shown at the bottom ──────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Log Listening", href: "/listening/new", icon: HeadphonesIcon },
  { label: "Add Vocab", href: "/vocab", icon: BookMarked },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

// ── Category metadata ─────────────────────────────────────────────────────────
const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  vocab: { label: "Vocab", icon: BookMarked },
  grammar: { label: "Grammar", icon: BookOpen },
  listening: { label: "Listening", icon: Headphones },
  reading: { label: "Reading", icon: BookOpen },
  writing: { label: "Writing", icon: PenTool },
  speaking: { label: "Speaking", icon: MessageSquare },
  topics: { label: "Topics", icon: Library },
};

function flattenResults(results: SearchResults): SearchResultItem[] {
  return [
    ...results.vocab,
    ...results.grammar,
    ...results.listening,
    ...results.reading,
    ...results.writing,
    ...results.speaking,
    ...results.topics,
  ];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open with Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(null);
      setActiveIndex(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(query);
        setResults(data);
        setActiveIndex(0);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(null);
  }, []);

  // Build flat navigable list: result items + quick actions
  const flatItems = results ? flattenResults(results) : [];
  const totalItems = flatItems.length + QUICK_ACTIONS.length;

  const navigateTo = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % totalItems);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + totalItems) % totalItems);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex < flatItems.length) {
          navigateTo(flatItems[activeIndex].href);
        } else {
          const qaIndex = activeIndex - flatItems.length;
          navigateTo(QUICK_ACTIONS[qaIndex].href);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, activeIndex, flatItems, totalItems, close, navigateTo]);

  if (!open) return null;
  if (typeof window === "undefined") return null;

  // Group result items by category for display
  const groupedEntries = results
    ? (
        Object.entries(results) as [keyof SearchResults, SearchResultItem[]][]
      ).filter(([, items]) => items.length > 0)
    : [];

  // Compute per-item absolute index for keyboard highlight
  let itemOffset = 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={(e) => e.target === e.currentTarget && close()}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Palette panel */}
      <div
        className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] shadow-[var(--shadow-xl)] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-line)]">
          <Search className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search vocab, grammar, tests, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] outline-none"
          />
          {loading && (
            <div className="w-4 h-4 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin shrink-0" />
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--color-ink-muted)] border border-[var(--color-line)] bg-[var(--color-body)] shrink-0">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Grouped search results */}
          {groupedEntries.length > 0 && (
            <div className="py-2">
              {groupedEntries.map(([category, items]) => {
                const meta = CATEGORY_META[category];
                const Icon = meta?.icon ?? Search;
                const groupStart = itemOffset;
                itemOffset += items.length;

                return (
                  <div key={category}>
                    {/* Category header */}
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                      <Icon className="w-3.5 h-3.5 text-[var(--color-ink-muted)]" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                        {meta?.label ?? category}
                      </span>
                    </div>
                    {/* Items */}
                    {items.map((item, i) => {
                      const idx = groupStart + i;
                      const isActive = idx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigateTo(item.href)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                            isActive
                              ? "bg-[var(--color-accent-light)] text-[var(--color-accent-text)]"
                              : "hover:bg-[var(--color-surface-hover)] text-[var(--color-ink)]"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0 text-[var(--color-ink-muted)]" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{item.title}</div>
                            {item.subtitle && (
                              <div className="text-xs text-[var(--color-ink-muted)] truncate">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state when query typed but no results */}
          {query.trim() && !loading && results && flatItems.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
              No results for &quot;{query}&quot;
            </div>
          )}

          {/* Quick actions */}
          <div className={groupedEntries.length > 0 ? "border-t border-[var(--color-line)]" : ""}>
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Quick Actions
              </span>
            </div>
            {QUICK_ACTIONS.map((action, i) => {
              const idx = flatItems.length + i;
              const isActive = idx === activeIndex;
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => navigateTo(action.href)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    isActive
                      ? "bg-[var(--color-accent-light)] text-[var(--color-accent-text)]"
                      : "hover:bg-[var(--color-surface-hover)] text-[var(--color-ink)]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[var(--color-ink-muted)]" />
                  <span className="text-sm">{action.label}</span>
                </button>
              );
            })}
            <div className="h-2" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
