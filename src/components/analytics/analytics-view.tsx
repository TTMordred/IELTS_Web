"use client";

import { BarChart2, CalendarRange } from "lucide-react";
import { useAnalyticsFilters } from "./analytics-filters";
import { ScoreDistribution } from "./score-distribution";
import { PeriodComparison } from "./period-comparison";

export function AnalyticsConditionalSections() {
  const { viewMode } = useAnalyticsFilters();

  if (viewMode === "distribution") {
    return (
      <div className="card-base p-5">
        <h2 className="heading-md flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-[var(--color-accent)]" />
          Score Distribution
        </h2>
        <ScoreDistribution />
      </div>
    );
  }

  if (viewMode === "comparison") {
    return (
      <div className="card-base p-5">
        <h2 className="heading-md flex items-center gap-2 mb-4">
          <CalendarRange className="w-5 h-5 text-[var(--color-accent)]" />
          This Month vs Last Month
        </h2>
        <PeriodComparison />
      </div>
    );
  }

  // viewMode === "trends" — default, renders nothing extra here
  // (Band Trend + Skill Radar are always rendered by page.tsx)
  return null;
}
