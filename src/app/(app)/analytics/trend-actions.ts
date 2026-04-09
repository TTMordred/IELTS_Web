"use server";

import { createClient } from "@/lib/supabase/server";
import { ALL_QUESTION_TYPES } from "@/lib/constants/listening-types";
import { READING_QUESTION_TYPES } from "@/lib/constants/reading-types";

export type TrendDataPoint = {
  date: string;
  accuracy: number;
  movingAvg: number | null;
};

export type TypeTrend = {
  typeId: string;
  typeName: string;
  module: "listening" | "reading";
  trend: "improving" | "stagnating" | "declining";
  dataPoints: TrendDataPoint[];
  currentAccuracy: number;
  slope: number;
};

function computeMovingAverage(
  values: number[],
  window: number,
): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    const slice = values.slice(i - window + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / window;
  });
}

function computeSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function classifyTrend(slope: number): "improving" | "stagnating" | "declining" {
  if (slope > 0.02) return "improving";
  if (slope < -0.02) return "declining";
  return "stagnating";
}

export async function getTypeTrends(): Promise<TypeTrend[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch listening type results with dates
  const { data: listeningResults } = await supabase
    .from("listening_type_results")
    .select(
      "question_type, correct, total, section_detail_id, listening_section_details!inner(record_id, listening_records!inner(user_id, date))",
    )
    .eq("listening_section_details.listening_records.user_id", user.id);

  // Fetch reading type results with dates
  const { data: readingResults } = await supabase
    .from("reading_type_results")
    .select(
      "question_type, correct, total, passage_detail_id, reading_passage_details!inner(record_id, reading_records!inner(user_id, date))",
    )
    .eq("reading_passage_details.reading_records.user_id", user.id);

  // Map: typeId -> array of { date, correct, total }
  const typePointsMap = new Map<
    string,
    { date: string; correct: number; total: number }[]
  >();

  if (listeningResults) {
    for (const r of listeningResults) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record = (r as any).listening_section_details?.listening_records;
      const date = record?.date as string | undefined;
      if (!date || r.total === 0) continue;
      const arr = typePointsMap.get(r.question_type) ?? [];
      arr.push({ date, correct: r.correct, total: r.total });
      typePointsMap.set(r.question_type, arr);
    }
  }

  if (readingResults) {
    for (const r of readingResults) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record = (r as any).reading_passage_details?.reading_records;
      const date = record?.date as string | undefined;
      if (!date || r.total === 0) continue;
      const arr = typePointsMap.get(r.question_type) ?? [];
      arr.push({ date, correct: r.correct, total: r.total });
      typePointsMap.set(r.question_type, arr);
    }
  }

  const results: TypeTrend[] = [];

  // Build type name lookup
  const listeningTypeNames = new Map(ALL_QUESTION_TYPES.map((t) => [t.id, t.name]));
  const readingTypeNames = new Map(READING_QUESTION_TYPES.map((t) => [t.id, t.name]));

  for (const [typeId, rawPoints] of typePointsMap.entries()) {
    if (rawPoints.length < 3) continue;

    // Sort by date ascending
    rawPoints.sort((a, b) => a.date.localeCompare(b.date));

    // Aggregate same-date entries
    const dateAggMap = new Map<string, { correct: number; total: number }>();
    for (const p of rawPoints) {
      const existing = dateAggMap.get(p.date) ?? { correct: 0, total: 0 };
      existing.correct += p.correct;
      existing.total += p.total;
      dateAggMap.set(p.date, existing);
    }

    const sortedDates = Array.from(dateAggMap.keys()).sort();
    if (sortedDates.length < 3) continue;

    const accuracies = sortedDates.map((d) => {
      const agg = dateAggMap.get(d)!;
      return agg.total > 0 ? agg.correct / agg.total : 0;
    });

    const movingAvgs = computeMovingAverage(accuracies, 5);
    const slope = computeSlope(accuracies);
    const trend = classifyTrend(slope);
    const currentAccuracy = accuracies[accuracies.length - 1];

    const moduleType: "listening" | "reading" = listeningTypeNames.has(typeId)
      ? "listening"
      : "reading";
    const typeName =
      listeningTypeNames.get(typeId) ??
      readingTypeNames.get(typeId) ??
      typeId;

    const dataPoints: TrendDataPoint[] = sortedDates.map((date, i) => ({
      date,
      accuracy: Math.round(accuracies[i] * 100) / 100,
      movingAvg:
        movingAvgs[i] !== null
          ? Math.round(movingAvgs[i]! * 100) / 100
          : null,
    }));

    results.push({
      typeId,
      typeName,
      module: moduleType,
      trend,
      dataPoints,
      currentAccuracy,
      slope,
    });
  }

  // Sort by number of data points descending, return top 10 most-practiced
  results.sort((a, b) => b.dataPoints.length - a.dataPoints.length);
  return results.slice(0, 10);
}
