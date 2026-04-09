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
} from "recharts";
import { getAnalyticsTypeData, type TypeAccuracy } from "@/app/(app)/analytics/actions";
import { LISTENING_SECTIONS } from "@/lib/constants/listening-types";
import { READING_QUESTION_TYPES } from "@/lib/constants/reading-types";

function accuracyColor(accuracy: number, attempts: number): string {
  if (attempts < 3) return "#9CA3AF"; // gray — no data
  if (accuracy >= 0.75) return "#22C55E"; // green
  if (accuracy >= 0.5) return "#EAB308"; // yellow
  return "#EF4444"; // red
}

type ChartEntry = {
  name: string;
  accuracy: number;
  fill: string;
  attempts: number;
  correct: number;
  total: number;
};

export function QuestionTypeDNA() {
  const [data, setData] = useState<TypeAccuracy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsTypeData()
      .then((res) => setData(res.typeAccuracies))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 bg-[var(--color-surface)] animate-pulse rounded-lg" />;
  }

  // Build chart data grouped by module/section
  const listeningEntries: ChartEntry[] = [];
  const readingEntries: ChartEntry[] = [];

  const dataMap = new Map(data.map((d) => [d.typeId, d]));

  for (const section of LISTENING_SECTIONS) {
    for (const t of section.types) {
      const d = dataMap.get(t.id);
      const acc = d?.accuracy ?? 0;
      const attempts = d?.attempts ?? 0;
      listeningEntries.push({
        name: `S${section.section}: ${t.name}`,
        accuracy: Math.round(acc * 100),
        fill: accuracyColor(acc, attempts),
        attempts,
        correct: d?.correct ?? 0,
        total: d?.total ?? 0,
      });
    }
  }

  for (const t of READING_QUESTION_TYPES) {
    const d = dataMap.get(t.id);
    const acc = d?.accuracy ?? 0;
    const attempts = d?.attempts ?? 0;
    readingEntries.push({
      name: t.name,
      accuracy: Math.round(acc * 100),
      fill: accuracyColor(acc, attempts),
      attempts,
      correct: d?.correct ?? 0,
      total: d?.total ?? 0,
    });
  }

  const renderChart = (entries: ChartEntry[], height: number) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={entries}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "var(--color-ink-muted)" }}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          tick={{ fontSize: 11, fill: "var(--color-ink-secondary)" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-line)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value, _name, props) => {
            const p = (props as unknown as { payload: ChartEntry }).payload;
            return [`${value}% (${p.correct}/${p.total}, ${p.attempts} attempts)`, "Accuracy"];
          }}
        />
        <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} barSize={16}>
          {entries.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {[
          { color: "#22C55E", label: "Strong (75%+)" },
          { color: "#EAB308", label: "Improving (50-74%)" },
          { color: "#EF4444", label: "Weak (<50%)" },
          { color: "#9CA3AF", label: "No data (<3 attempts)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[var(--color-ink-secondary)]">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Listening */}
      <div>
        <h3 className="section-label mb-2">Listening ({listeningEntries.length} types)</h3>
        {renderChart(listeningEntries, listeningEntries.length * 28 + 20)}
      </div>

      {/* Reading */}
      <div>
        <h3 className="section-label mb-2">Reading ({readingEntries.length} types)</h3>
        {renderChart(readingEntries, readingEntries.length * 28 + 20)}
      </div>
    </div>
  );
}
