"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  type LinkableTable,
  type RecordLink,
  type RelationType,
  createRecordLink,
  deleteRecordLink,
  searchRecords,
} from "@/app/(app)/record-links-actions";

type SearchResult = { id: string; label: string; subtitle?: string };

const TABLE_OPTIONS: { value: LinkableTable; label: string }[] = [
  { value: "listening_records", label: "Listening" },
  { value: "reading_records", label: "Reading" },
  { value: "writing_entries", label: "Writing" },
  { value: "speaking_entries", label: "Speaking" },
];

type Props = {
  sourceTable: LinkableTable;
  sourceId: string;
  initialLinks: RecordLink[];
  accentColor?: string;
};

export function RelatedRecords({
  sourceTable,
  sourceId,
  initialLinks,
  accentColor = "var(--color-accent)",
}: Props) {
  const [links, setLinks] = useState<RecordLink[]>(initialLinks);
  const [targetTable, setTargetTable] = useState<LinkableTable>(
    TABLE_OPTIONS[0].value
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchRecords(targetTable, searchQuery);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, targetTable]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setShowDropdown(false);
      setSearchQuery("");

      // Optimistic add
      const optimisticLink: RecordLink = {
        id: `optimistic-${Date.now()}`,
        target_table: targetTable,
        target_id: result.id,
        relation_type: "related" as RelationType,
        note: null,
        label: result.label,
        href: buildHref(targetTable, result.id),
      };
      setLinks((prev) => [...prev, optimisticLink]);

      startTransition(async () => {
        try {
          await createRecordLink({
            source_table: sourceTable,
            source_id: sourceId,
            target_table: targetTable,
            target_id: result.id,
            relation_type: "related",
          });
        } catch {
          // Roll back optimistic update
          setLinks((prev) =>
            prev.filter((l) => l.id !== optimisticLink.id)
          );
        }
      });
    },
    [sourceTable, sourceId, targetTable]
  );

  const handleDelete = useCallback((linkId: string) => {
    // Optimistic remove
    setLinks((prev) => prev.filter((l) => l.id !== linkId));

    startTransition(async () => {
      try {
        await deleteRecordLink(linkId);
      } catch {
        // Can't recover the exact link easily — page refresh will fix it
      }
    });
  }, []);

  return (
    <div className="space-y-3">
      {/* Chips */}
      {links.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)] italic">
          No linked records yet — connect this to related practice sessions
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: accentColor }}
            >
              <Link
                href={link.href}
                className="hover:underline"
                prefetch={false}
              >
                {link.label}
              </Link>
              <button
                onClick={() => handleDelete(link.id)}
                disabled={isPending}
                className="ml-1 opacity-70 hover:opacity-100 transition-opacity leading-none"
                aria-label={`Remove link to ${link.label}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Link form */}
      <div className="flex items-center gap-2 flex-wrap" ref={dropdownRef}>
        <select
          value={targetTable}
          onChange={(e) => {
            setTargetTable(e.target.value as LinkableTable);
            setSearchQuery("");
            setSearchResults([]);
            setShowDropdown(false);
          }}
          className="text-xs border border-[var(--color-line)] rounded-lg px-2 py-1.5 bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        >
          {TABLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[160px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search to link a record…"
            className="w-full text-xs border border-[var(--color-line)] rounded-lg px-2 py-1.5 bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          {isSearching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div
                className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: accentColor, borderTopColor: "transparent" }}
              />
            </div>
          )}

          {showDropdown && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg shadow-lg overflow-hidden">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(result);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-line)] transition-colors"
                >
                  <span className="font-medium text-[var(--color-ink)]">
                    {result.label}
                  </span>
                  {result.subtitle && (
                    <span className="ml-2 text-[var(--color-ink-muted)]">
                      {result.subtitle}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildHref(table: LinkableTable, id: string): string {
  switch (table) {
    case "listening_records":
      return `/listening/${id}`;
    case "reading_records":
      return `/reading/${id}`;
    case "writing_entries":
      return `/writing/${id}`;
    case "speaking_entries":
      return `/speaking/${id}`;
    case "vocab_cards":
      return `/vocab`;
    case "mistake_entries":
      return `/mistakes`;
  }
}
