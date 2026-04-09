"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Headphones,
  BookOpen,
  MessageSquare,
  PenTool,
  BookMarked,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/app/(app)/activity/actions";

type Module = ActivityItem["module"] | "all";

const MODULE_META: Record<
  ActivityItem["module"],
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  listening: { label: "Listening", icon: Headphones, color: "#378ADD", bg: "bg-blue-500/10" },
  reading: { label: "Reading", icon: BookOpen, color: "#D85A30", bg: "bg-orange-500/10" },
  writing: { label: "Writing", icon: PenTool, color: "#993556", bg: "bg-pink-500/10" },
  speaking: { label: "Speaking", icon: MessageSquare, color: "#1D9E75", bg: "bg-emerald-500/10" },
  vocab: { label: "Vocab", icon: BookMarked, color: "#7C3AED", bg: "bg-purple-500/10" },
  grammar: { label: "Grammar", icon: BookOpen, color: "#B45309", bg: "bg-amber-500/10" },
};

const FILTERS: { key: Module; label: string }[] = [
  { key: "all", label: "All" },
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "speaking", label: "Speaking" },
  { key: "writing", label: "Writing" },
  { key: "vocab", label: "Vocab" },
  { key: "grammar", label: "Grammar" },
];

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (itemDate.getTime() === today.getTime()) return "Today";
  if (itemDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate(items: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
  const groups = new Map<string, ActivityItem[]>();
  for (const item of items) {
    const label = formatDateLabel(item.created_at);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const [activeFilter, setActiveFilter] = useState<Module>("all");

  const filtered = useMemo(
    () => (activeFilter === "all" ? items : items.filter((i) => i.module === activeFilter)),
    [items, activeFilter]
  );

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              activeFilter === f.key
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {groups.length === 0 ? (
        <div className="card-base p-12 text-center">
          <Activity className="w-10 h-10 text-[var(--color-ink-muted)] mx-auto mb-3" />
          <p className="text-[var(--color-ink-secondary)] text-sm">No activity yet. Start practicing!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="section-label mb-3">{group.label}</p>
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-0 bottom-0 w-px bg-[var(--color-line)]" />

                <div className="space-y-3">
                  {group.items.map((item) => {
                    const meta = MODULE_META[item.module];
                    const Icon = meta.icon;

                    const inner = (
                      <div
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] transition-colors",
                          item.href && "hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)]"
                        )}
                      >
                        {/* Dot on timeline */}
                        <div
                          className={cn(
                            "absolute left-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-body)] flex items-center justify-center",
                            meta.bg
                          )}
                          style={{
                            top: "50%",
                            transform: "translateY(-50%)",
                            backgroundColor: `${meta.color}22`,
                            borderColor: "var(--color-body)",
                            outline: `2px solid ${meta.color}55`,
                          }}
                        />

                        {/* Module icon */}
                        <div
                          className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", meta.bg)}
                          style={{ color: meta.color }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium" style={{ color: meta.color }}>
                              {meta.label}
                            </span>
                            <span className="text-xs text-[var(--color-ink-muted)]">·</span>
                            <span className="text-xs text-[var(--color-ink-muted)]">{item.title}</span>
                          </div>
                          <p className="text-sm text-[var(--color-ink)] mt-0.5 truncate">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.estimated_band != null && (
                            <span
                              className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${meta.color}18`,
                                color: meta.color,
                              }}
                            >
                              {item.estimated_band.toFixed(1)}
                            </span>
                          )}
                          <span className="text-[0.65rem] text-[var(--color-ink-muted)]">
                            {formatTime(item.created_at)}
                          </span>
                        </div>
                      </div>
                    );

                    return (
                      <div key={item.id} className="relative">
                        {item.href ? (
                          <Link href={item.href}>{inner}</Link>
                        ) : (
                          inner
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
