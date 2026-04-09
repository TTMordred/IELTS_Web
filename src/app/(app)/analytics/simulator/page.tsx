"use client";

import { useEffect, useState, useCallback } from "react";
import { getAnalyticsTypeData, type TypeAccuracy } from "@/app/(app)/analytics/actions";
import { scoreToBand, bandToColor } from "@/lib/constants/band-tables";
import { SlidersHorizontal, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

type SimEntry = TypeAccuracy & {
  targetAccuracy: number;
  avgTotalPerType: number;
};

export default function SimulatorPage() {
  const [entries, setEntries] = useState<SimEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsTypeData().then((res) => {
      const listeningTypes = res.typeAccuracies.filter(
        (t) => t.module === "listening" && t.accuracy < 0.75,
      );
      const withAvg = listeningTypes.map((t) => ({
        ...t,
        targetAccuracy: t.accuracy,
        avgTotalPerType: t.attempts > 0 ? t.total / t.attempts : 0,
      }));
      // Sort by accuracy ascending (weakest first)
      withAvg.sort((a, b) => a.accuracy - b.accuracy);
      setEntries(withAvg);
      setLoading(false);
    });
  }, []);

  const handleSliderChange = useCallback((typeId: string, value: number) => {
    setEntries((prev) =>
      prev.map((e) => (e.typeId === typeId ? { ...e, targetAccuracy: value } : e)),
    );
  }, []);

  // Calculate current and simulated scores
  const currentTotalCorrect = entries.reduce(
    (sum, e) => sum + e.accuracy * e.avgTotalPerType,
    0,
  );
  const simulatedTotalCorrect = entries.reduce(
    (sum, e) => sum + e.targetAccuracy * e.avgTotalPerType,
    0,
  );
  const totalQuestions = entries.reduce((sum, e) => sum + e.avgTotalPerType, 0);

  // Scale to 40 questions for band calculation
  const scale = totalQuestions > 0 ? 40 / totalQuestions : 1;
  const currentScaled = Math.round(currentTotalCorrect * scale);
  const simulatedScaled = Math.round(simulatedTotalCorrect * scale);

  const currentBand = scoreToBand(Math.min(currentScaled, 40), "listening");
  const simulatedBand = scoreToBand(Math.min(simulatedScaled, 40), "listening");
  const bandDelta = simulatedBand - currentBand;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="h-8 w-64 bg-[var(--color-surface)] animate-pulse rounded" />
        <div className="h-40 bg-[var(--color-surface)] animate-pulse rounded-lg" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-[var(--color-surface)] animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Analytics
        </Link>
        <h1 className="heading-lg flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-[var(--color-accent)]" />
          Score Simulator
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          What if you improved? Adjust accuracy targets to see predicted band changes.
        </p>
      </div>

      {/* Band prediction card */}
      <div className="card-base p-5">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="section-label mb-1">Current</p>
            <p
              className="text-3xl font-bold font-mono"
              style={{ color: bandToColor(currentBand) }}
            >
              {currentBand.toFixed(1)}
            </p>
          </div>
          <ArrowRight className="w-6 h-6 text-[var(--color-ink-muted)]" />
          <div className="text-center">
            <p className="section-label mb-1">Predicted</p>
            <p
              className="text-3xl font-bold font-mono"
              style={{ color: bandToColor(simulatedBand) }}
            >
              {simulatedBand.toFixed(1)}
            </p>
          </div>
          {bandDelta !== 0 && (
            <span
              className="text-lg font-bold font-mono px-3 py-1 rounded-full"
              style={{
                color: bandDelta > 0 ? "#22C55E" : "#EF4444",
                backgroundColor: bandDelta > 0 ? "#22C55E20" : "#EF444420",
              }}
            >
              {bandDelta > 0 ? "+" : ""}
              {bandDelta.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Sliders */}
      {entries.length === 0 ? (
        <div className="card-base p-8 text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">
            No weak question types found. Log listening tests with type-level data to use the simulator.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="section-label">
            Question Types Below 75% ({entries.length} types)
          </p>
          {entries.map((entry) => {
            const currentPct = Math.round(entry.accuracy * 100);
            const targetPct = Math.round(entry.targetAccuracy * 100);
            const changed = targetPct !== currentPct;

            return (
              <div key={entry.typeId} className="card-base p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-[var(--color-ink-primary)]">
                      {entry.typeName}
                    </span>
                    <span className="text-xs text-[var(--color-ink-muted)] ml-2">
                      ({entry.attempts} attempts)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <span className="text-[var(--color-ink-muted)]">{currentPct}%</span>
                    {changed && (
                      <>
                        <ArrowRight className="w-3 h-3 text-[var(--color-ink-muted)]" />
                        <span
                          style={{
                            color: targetPct > currentPct ? "#22C55E" : "#EF4444",
                          }}
                        >
                          {targetPct}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={targetPct}
                  onChange={(e) =>
                    handleSliderChange(entry.typeId, Number(e.target.value) / 100)
                  }
                  className="w-full accent-[var(--color-accent)]"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
