"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type TrendDataPoint = {
  date: string;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
};

export function BandTrendChart({ data }: { data: TrendDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
          tickFormatter={(v) => {
            const d = new Date(v);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
        />
        <YAxis
          domain={[3, 9]}
          ticks={[3, 4, 5, 6, 7, 8, 9]}
          tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-line)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelFormatter={(v) => `Date: ${v}`}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px" }}
        />
        <Line type="monotone" dataKey="listening" stroke="#378ADD" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Listening" />
        <Line type="monotone" dataKey="reading" stroke="#D85A30" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Reading" />
        <Line type="monotone" dataKey="writing" stroke="#993556" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Writing" />
        <Line type="monotone" dataKey="speaking" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Speaking" />
      </LineChart>
    </ResponsiveContainer>
  );
}
