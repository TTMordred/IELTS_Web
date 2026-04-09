"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { getScoreDistribution, type ScoreDistributionData } from "@/app/(app)/analytics/actions";
import { useAnalyticsFilters } from "./analytics-filters";

const MODULE_COLORS: Record<string, string> = {
  listening: "#378ADD",
  reading: "#D85A30",
  writing: "#993556",
  speaking: "#1D9E75",
  total: "var(--color-accent)",
};

function getBandColor(band: number): string {
  if (band >= 7.0) return "#22C55E";
  if (band >= 5.5) return "#EAB308";
  return "#EF4444";
}

export function ScoreDistribution() {
  const { module } = useAnalyticsFilters();
  const [data, setData] = useState<ScoreDistributionData>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getScoreDistribution()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="h-64 bg-[var(--color-surface)] animate-pulse rounded-lg" />;
  }

  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)] text-center py-12">
        Log test records to see your score distribution
      </p>
    );
  }

  // Determine which key to display based on module filter
  const dataKey = module === "all" ? "total" : module;
  const barColor = MODULE_COLORS[dataKey] ?? "var(--color-accent)";

  // Compute current band for reference line (mode of displayed data)
  const maxEntry = data.reduce((best, d) => {
    const val = (d as unknown as Record<string, number>)[dataKey] ?? 0;
    const bestVal = (best as unknown as Record<string, number>)[dataKey] ?? 0;
    return val > bestVal ? d : best;
  }, data[0]);
  const modeBand = maxEntry ? parseFloat(maxEntry.band) : null;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { color: "#22C55E", label: "Band 7.0+" },
          { color: "#EAB308", label: "Band 5.5–6.5" },
          { color: "#EF4444", label: "Band 4.0–5.0" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[var(--color-ink-secondary)]">{item.label}</span>
          </div>
        ))}
        {module !== "all" && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: barColor }}
            />
            <span className="text-[var(--color-ink-secondary)] capitalize">{module}</span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="band"
            tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
            label={{ value: "Band", position: "insideBottom", offset: -2, fontSize: 11, fill: "var(--color-ink-muted)" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
            label={{ value: "Count", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "var(--color-ink-muted)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-line)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [value, module === "all" ? "Total records" : module.charAt(0).toUpperCase() + module.slice(1)]}
            labelFormatter={(label) => `Band ${label}`}
          />
          {modeBand !== null && (
            <ReferenceLine
              x={modeBand.toFixed(1)}
              stroke="var(--color-accent)"
              strokeDasharray="4 2"
              label={{ value: "Most common", position: "top", fontSize: 10, fill: "var(--color-accent)" }}
            />
          )}
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell key={entry.band} fill={getBandColor(parseFloat(entry.band))} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
