"use client";

import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";

type GoalEntry = {
  module: string;
  currentBand: number;
  targetBand: number;
};

type GoalTrackerProps = {
  goals: GoalEntry[];
  examDate: string | null;
};

const MODULE_COLORS: Record<string, string> = {
  Listening: "#378ADD",
  Reading: "#D85A30",
  Speaking: "#1D9E75",
  Writing: "#993556",
};

function getPaceStatus(
  current: number,
  target: number,
  examDate: string | null,
): { label: string; color: string; icon: React.ReactNode } {
  const gap = target - current;

  if (gap <= 0) {
    return {
      label: "Target reached",
      color: "#1D9E75",
      icon: <TrendingUp className="w-3 h-3" />,
    };
  }

  if (!examDate) {
    return {
      label: `+${gap.toFixed(1)} to target`,
      color: "var(--color-ink-muted)",
      icon: <Minus className="w-3 h-3" />,
    };
  }

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(examDate).getTime() - Date.now()) / 86400000,
    ),
  );

  // Rate needed: gap / daysLeft (bands per day). Typical improvement ~0.005 band/day
  const dailyRateNeeded = daysLeft > 0 ? gap / daysLeft : Infinity;

  if (daysLeft <= 0) {
    return {
      label: "Exam day",
      color: "#EF4444",
      icon: <TrendingDown className="w-3 h-3" />,
    };
  }

  if (dailyRateNeeded <= 0.003) {
    return {
      label: "Ahead of pace",
      color: "#1D9E75",
      icon: <TrendingUp className="w-3 h-3" />,
    };
  }

  if (dailyRateNeeded <= 0.007) {
    return {
      label: "On track",
      color: "var(--color-accent)",
      icon: <TrendingUp className="w-3 h-3" />,
    };
  }

  return {
    label: "Behind pace",
    color: "#EF4444",
    icon: <TrendingDown className="w-3 h-3" />,
  };
}

export function GoalTracker({ goals, examDate }: GoalTrackerProps) {
  // Only show modules that have data or a target
  const activeGoals = goals.filter((g) => g.targetBand > 0);

  if (activeGoals.length === 0) return null;

  return (
    <div className="card-base p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-[var(--color-accent)]" />
        <h2 className="heading-md">Goal Progress</h2>
        {examDate && (
          <span className="ml-auto text-xs text-[var(--color-ink-muted)]">
            Target exam: {examDate}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activeGoals.map((goal) => {
          const color = MODULE_COLORS[goal.module] ?? "var(--color-accent)";
          const pct =
            goal.targetBand > 0
              ? Math.min(100, Math.round((goal.currentBand / goal.targetBand) * 100))
              : 0;
          const pace = getPaceStatus(goal.currentBand, goal.targetBand, examDate);
          const hasData = goal.currentBand > 0;

          return (
            <div key={goal.module} className="space-y-2">
              {/* Row: module name + bands */}
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium"
                  style={{ color }}
                >
                  {goal.module}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                  <span
                    className="font-mono font-semibold text-sm"
                    style={{ color: hasData ? "var(--color-ink)" : "var(--color-ink-muted)" }}
                  >
                    {hasData ? goal.currentBand.toFixed(1) : "—"}
                  </span>
                  <span>/</span>
                  <span className="font-mono">{goal.targetBand.toFixed(1)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: hasData ? `${pct}%` : "0%",
                    backgroundColor: color,
                  }}
                />
              </div>

              {/* Pace status */}
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: pace.color }}
              >
                {pace.icon}
                <span>{pace.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
