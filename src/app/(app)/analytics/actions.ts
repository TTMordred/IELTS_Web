"use server";

import { createClient } from "@/lib/supabase/server";
import { ALL_QUESTION_TYPES } from "@/lib/constants/listening-types";
import { READING_QUESTION_TYPES } from "@/lib/constants/reading-types";

export type TypeAccuracy = {
  typeId: string;
  typeName: string;
  module: "listening" | "reading";
  correct: number;
  total: number;
  accuracy: number;
  attempts: number;
  lastPracticed: string | null;
  frequency: "high" | "medium" | "low";
  status: "weak" | "improving" | "strong" | "no_data";
};

export type Recommendation = {
  typeId: string;
  typeName: string;
  module: "listening" | "reading";
  accuracy: number;
  status: "weak" | "improving" | "strong" | "no_data";
  priority: number;
  message: string;
  daysSinceLastPractice: number | null;
};

function getFreqWeight(freq: "high" | "medium" | "low"): number {
  if (freq === "high") return 1.0;
  if (freq === "medium") return 0.6;
  return 0.3;
}

function generateMessage(
  typeName: string,
  module: string,
  accuracy: number,
  daysSince: number | null,
  status: string,
): string {
  const pct = Math.round(accuracy * 100);
  if (status === "no_data") {
    return `No data on ${typeName} (${module}) yet — try a practice test`;
  }
  if (daysSince !== null && daysSince >= 14) {
    return `Haven't practiced ${typeName} in ${daysSince} days — try a Cambridge test`;
  }
  if (status === "weak") {
    return `You scored ${pct}% on ${typeName} — needs focused practice`;
  }
  return `${typeName} at ${pct}% — keep pushing to solidify this skill`;
}

export async function getAnalyticsTypeData(): Promise<{
  typeAccuracies: TypeAccuracy[];
  examDate: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { typeAccuracies: [], examDate: null };

  // Fetch profile for exam date
  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_date")
    .eq("id", user.id)
    .single();

  // Fetch listening type results via section details
  const { data: listeningResults } = await supabase
    .from("listening_type_results")
    .select(
      "question_type, correct, total, section_detail_id, listening_section_details!inner(record_id, listening_records!inner(user_id, date))",
    )
    .eq("listening_section_details.listening_records.user_id", user.id);

  // Fetch reading type results via passage details
  const { data: readingResults } = await supabase
    .from("reading_type_results")
    .select(
      "question_type, correct, total, passage_detail_id, reading_passage_details!inner(record_id, reading_records!inner(user_id, date))",
    )
    .eq("reading_passage_details.reading_records.user_id", user.id);

  const now = new Date();
  const typeMap = new Map<
    string,
    {
      correct: number;
      total: number;
      attempts: number;
      lastDate: string | null;
    }
  >();

  // Aggregate listening results
  if (listeningResults) {
    for (const r of listeningResults) {
      const key = r.question_type;
      const existing = typeMap.get(key) || {
        correct: 0,
        total: 0,
        attempts: 0,
        lastDate: null,
      };
      existing.correct += r.correct;
      existing.total += r.total;
      existing.attempts += 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record = (r as any).listening_section_details?.listening_records;
      const date = record?.date as string | undefined;
      if (date && (!existing.lastDate || date > existing.lastDate)) {
        existing.lastDate = date;
      }
      typeMap.set(key, existing);
    }
  }

  // Aggregate reading results
  if (readingResults) {
    for (const r of readingResults) {
      const key = r.question_type;
      const existing = typeMap.get(key) || {
        correct: 0,
        total: 0,
        attempts: 0,
        lastDate: null,
      };
      existing.correct += r.correct;
      existing.total += r.total;
      existing.attempts += 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record = (r as any).reading_passage_details?.reading_records;
      const date = record?.date as string | undefined;
      if (date && (!existing.lastDate || date > existing.lastDate)) {
        existing.lastDate = date;
      }
      typeMap.set(key, existing);
    }
  }

  // Build type accuracies for all known types
  const typeAccuracies: TypeAccuracy[] = [];

  for (const t of ALL_QUESTION_TYPES) {
    const data = typeMap.get(t.id);
    const correct = data?.correct ?? 0;
    const total = data?.total ?? 0;
    const attempts = data?.attempts ?? 0;
    const accuracy = total > 0 ? correct / total : 0;
    const status: TypeAccuracy["status"] =
      attempts < 3
        ? "no_data"
        : accuracy < 0.5
          ? "weak"
          : accuracy < 0.75
            ? "improving"
            : "strong";

    typeAccuracies.push({
      typeId: t.id,
      typeName: t.name,
      module: "listening",
      correct,
      total,
      accuracy,
      attempts,
      lastPracticed: data?.lastDate ?? null,
      frequency: t.frequency,
      status,
    });
  }

  for (const t of READING_QUESTION_TYPES) {
    const data = typeMap.get(t.id);
    const correct = data?.correct ?? 0;
    const total = data?.total ?? 0;
    const attempts = data?.attempts ?? 0;
    const accuracy = total > 0 ? correct / total : 0;
    const status: TypeAccuracy["status"] =
      attempts < 3
        ? "no_data"
        : accuracy < 0.5
          ? "weak"
          : accuracy < 0.75
            ? "improving"
            : "strong";

    typeAccuracies.push({
      typeId: t.id,
      typeName: t.name,
      module: "reading",
      correct,
      total,
      accuracy,
      attempts,
      lastPracticed: data?.lastDate ?? null,
      frequency: t.frequency,
      status,
    });
  }

  return { typeAccuracies, examDate: profile?.exam_date ?? null };
}

export async function getRecommendations(): Promise<Recommendation[]> {
  const { typeAccuracies, examDate } = await getAnalyticsTypeData();
  const now = new Date();

  // Calculate exam urgency
  let examUrgency = 0.5; // default when no exam date
  if (examDate) {
    const daysUntilExam = Math.max(
      1,
      (new Date(examDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    examUrgency = Math.min(30 / daysUntilExam, 3.0) / 3.0;
  }

  const scored: Recommendation[] = typeAccuracies
    .filter((t) => t.status !== "strong")
    .map((t) => {
      const freqWeight = getFreqWeight(t.frequency);
      const daysSince = t.lastPracticed
        ? Math.floor(
            (now.getTime() - new Date(t.lastPracticed).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;
      const recency =
        daysSince !== null ? Math.min(daysSince / 30, 1.0) : 1.0;

      const priority =
        0.4 * (1 - t.accuracy) +
        0.25 * freqWeight +
        0.2 * recency +
        0.15 * examUrgency;

      return {
        typeId: t.typeId,
        typeName: t.typeName,
        module: t.module,
        accuracy: t.accuracy,
        status: t.status,
        priority,
        daysSinceLastPractice: daysSince,
        message: generateMessage(
          t.typeName,
          t.module,
          t.accuracy,
          daysSince,
          t.status,
        ),
      };
    });

  scored.sort((a, b) => b.priority - a.priority);
  return scored.slice(0, 5);
}

// ─── Date range helpers ───────────────────────────────────────────────────────

function getDateRangeStart(range: "7d" | "30d" | "90d" | "all"): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// ─── Filtered Analytics ───────────────────────────────────────────────────────

export type FilteredAnalyticsData = {
  listening: { date: string; estimated_band: number | null }[];
  reading: { date: string; estimated_band: number | null }[];
  writing: { date: string; estimated_band: number | null }[];
  speaking: { date: string; estimated_band: number | null }[];
};

export async function getFilteredAnalytics(
  dateRange: "7d" | "30d" | "90d" | "all",
  module: "all" | "listening" | "reading" | "writing" | "speaking",
): Promise<FilteredAnalyticsData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { listening: [], reading: [], writing: [], speaking: [] };

  const since = getDateRangeStart(dateRange);

  async function fetchModule(table: string) {
    let q = supabase
      .from(table)
      .select("date, estimated_band")
      .eq("user_id", user!.id)
      .order("date");
    if (since) q = q.gte("date", since);
    const { data } = await q;
    return data || [];
  }

  const modules = ["listening", "reading", "writing", "speaking"] as const;
  const shouldFetch = (m: string) => module === "all" || module === m;

  const [listening, reading, writing, speaking] = await Promise.all([
    shouldFetch("listening") ? fetchModule("listening_records") : Promise.resolve([]),
    shouldFetch("reading") ? fetchModule("reading_records") : Promise.resolve([]),
    shouldFetch("writing") ? fetchModule("writing_entries") : Promise.resolve([]),
    shouldFetch("speaking") ? fetchModule("speaking_entries") : Promise.resolve([]),
  ]);

  return { listening, reading, writing, speaking };
}

// ─── Score Distribution ───────────────────────────────────────────────────────

export type ScoreDistributionData = {
  band: string;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  total: number;
}[];

export async function getScoreDistribution(): Promise<ScoreDistributionData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [listening, reading, writing, speaking] = await Promise.all([
    supabase.from("listening_records").select("estimated_band").eq("user_id", user.id),
    supabase.from("reading_records").select("estimated_band").eq("user_id", user.id),
    supabase.from("writing_entries").select("estimated_band").eq("user_id", user.id),
    supabase.from("speaking_entries").select("estimated_band").eq("user_id", user.id),
  ]);

  // Bands: 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0
  const bands = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

  function countBands(records: { estimated_band: number | null }[] | null, band: number): number {
    if (!records) return 0;
    return records.filter((r) => r.estimated_band === band).length;
  }

  return bands.map((band) => ({
    band: band.toFixed(1),
    listening: countBands(listening.data, band),
    reading: countBands(reading.data, band),
    writing: countBands(writing.data, band),
    speaking: countBands(speaking.data, band),
    total:
      countBands(listening.data, band) +
      countBands(reading.data, band) +
      countBands(writing.data, band) +
      countBands(speaking.data, band),
  }));
}

// ─── Period Comparison ────────────────────────────────────────────────────────

export type PeriodStats = {
  records: number;
  avgBand: number | null;
  bestBand: number | null;
};

export type PeriodComparisonData = {
  thisMonth: PeriodStats;
  lastMonth: PeriodStats;
};

export async function getPeriodComparison(): Promise<PeriodComparisonData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const empty: PeriodStats = { records: 0, avgBand: null, bestBand: null };
  if (!user) return { thisMonth: empty, lastMonth: empty };

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

  const tables = [
    { name: "listening_records", col: "estimated_band" },
    { name: "reading_records", col: "estimated_band" },
    { name: "writing_entries", col: "estimated_band" },
    { name: "speaking_entries", col: "estimated_band" },
  ];

  async function fetchPeriod(start: string, end: string | null) {
    const results = await Promise.all(
      tables.map(async (t) => {
        let q = supabase
          .from(t.name)
          .select("estimated_band")
          .eq("user_id", user!.id)
          .gte("date", start);
        if (end) q = q.lte("date", end);
        const { data } = await q;
        return data || [];
      }),
    );
    const all = results.flat() as { estimated_band: number | null }[];
    const withBand = all.filter((r) => r.estimated_band != null).map((r) => r.estimated_band as number);
    return {
      records: all.length,
      avgBand: withBand.length > 0 ? Math.round((withBand.reduce((a, b) => a + b, 0) / withBand.length) * 2) / 2 : null,
      bestBand: withBand.length > 0 ? Math.max(...withBand) : null,
    };
  }

  const [thisMonth, lastMonth] = await Promise.all([
    fetchPeriod(thisMonthStart, null),
    fetchPeriod(lastMonthStart, lastMonthEnd),
  ]);

  return { thisMonth, lastMonth };
}
