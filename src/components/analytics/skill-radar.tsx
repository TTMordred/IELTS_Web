"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

type SkillData = {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
};

export function SkillRadar({ data }: { data: SkillData }) {
  const chartData = [
    { skill: "Listening", band: data.listening, fullMark: 9 },
    { skill: "Reading", band: data.reading, fullMark: 9 },
    { skill: "Writing", band: data.writing, fullMark: 9 },
    { skill: "Speaking", band: data.speaking, fullMark: 9 },
  ];

  const hasData = Object.values(data).some((v) => v > 0);

  if (!hasData) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)] text-center py-12">
        Log records in all 4 skills to see your skill balance radar
      </p>
    );
  }

  return (
    <div className="flex justify-center">
      <ResponsiveContainer width="100%" height={300} maxHeight={300}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--color-line)" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 12, fill: "var(--color-ink-secondary)" }}
          />
          <PolarRadiusAxis
            domain={[0, 9]}
            tick={{ fontSize: 10, fill: "var(--color-ink-muted)" }}
            tickCount={4}
          />
          <Radar
            name="Band"
            dataKey="band"
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
