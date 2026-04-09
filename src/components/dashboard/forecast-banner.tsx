"use client";

import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";

type ForecastTopic = {
  name: string;
  part: number;
};

export function ForecastBanner({
  quarter,
  topics,
}: {
  quarter: string;
  topics: ForecastTopic[];
}) {
  const part1Count = topics.filter((t) => t.part === 1).length;
  const part2Count = topics.filter((t) => t.part === 2 || t.part === 3).length;

  return (
    <div className="card-base p-4 border-l-4 border-l-amber-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">
              Speaking Forecast {quarter}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              {part1Count} Part 1 topics &middot; {part2Count} Part 2+3 topics
            </p>
          </div>
        </div>
        <Link
          href="/topics?forecast=true"
          className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
