"use client";

import { createContext, useContext, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DateRange = "7d" | "30d" | "90d" | "all";
export type ModuleFilter = "all" | "listening" | "reading" | "writing" | "speaking";
export type ViewMode = "trends" | "distribution" | "comparison";

export type AnalyticsFilterState = {
  dateRange: DateRange;
  module: ModuleFilter;
  viewMode: ViewMode;
};

// ─── Context ──────────────────────────────────────────────────────────────────

type FilterContextValue = AnalyticsFilterState & {
  setDateRange: (v: DateRange) => void;
  setModule: (v: ModuleFilter) => void;
  setViewMode: (v: ViewMode) => void;
};

const FilterContext = createContext<FilterContextValue>({
  dateRange: "30d",
  module: "all",
  viewMode: "trends",
  setDateRange: () => {},
  setModule: () => {},
  setViewMode: () => {},
});

export function useAnalyticsFilters() {
  return useContext(FilterContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AnalyticsFilterProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [module, setModule] = useState<ModuleFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("trends");

  return (
    <FilterContext.Provider value={{ dateRange, module, viewMode, setDateRange, setModule, setViewMode }}>
      {children}
    </FilterContext.Provider>
  );
}

// ─── Filter UI ────────────────────────────────────────────────────────────────

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

const MODULE_OPTIONS: { value: ModuleFilter; label: string; color: string }[] = [
  { value: "all", label: "All", color: "var(--color-accent)" },
  { value: "listening", label: "Listening", color: "#378ADD" },
  { value: "reading", label: "Reading", color: "#D85A30" },
  { value: "writing", label: "Writing", color: "#993556" },
  { value: "speaking", label: "Speaking", color: "#1D9E75" },
];

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "trends", label: "Trends" },
  { value: "distribution", label: "Distribution" },
  { value: "comparison", label: "Comparison" },
];

export function AnalyticsFilters() {
  const { dateRange, module, viewMode, setDateRange, setModule, setViewMode } =
    useAnalyticsFilters();

  return (
    <div className="card-base p-4 space-y-4">
      {/* View mode tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-surface)] w-fit">
        {VIEW_MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setViewMode(opt.value)}
            className={[
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              viewMode === opt.value
                ? "bg-[var(--color-card)] text-[var(--color-ink)] shadow-sm"
                : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Date range */}
        <div className="flex flex-col gap-1.5">
          <span className="section-label">Date range</span>
          <div className="flex gap-1">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={[
                  "px-3 py-1 rounded-md text-xs font-medium border transition-all",
                  dateRange === opt.value
                    ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                    : "border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Module filter */}
        <div className="flex flex-col gap-1.5">
          <span className="section-label">Module</span>
          <div className="flex gap-1">
            {MODULE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setModule(opt.value)}
                className={[
                  "px-3 py-1 rounded-md text-xs font-medium border transition-all",
                  module === opt.value
                    ? "border-transparent text-white"
                    : "border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]",
                ].join(" ")}
                style={
                  module === opt.value
                    ? { backgroundColor: opt.color, borderColor: opt.color }
                    : {}
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
