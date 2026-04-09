"use server";

import { createClient } from "@/lib/supabase/server";

export type ModuleSummary = {
  count: number;
  avg_band: number | null;
  latest_band: number | null;
};

export type HeatmapEntry = {
  key: string;
  label: string;
  avg: number;
  count: number;
};

export type ExportData = {
  profile: {
    display_name: string;
    target_band: number | null;
    current_streak: number;
    longest_streak: number;
    total_xp: number;
    exam_date: string | null;
  };
  listening: ModuleSummary;
  reading: ModuleSummary;
  writing: ModuleSummary;
  speaking: ModuleSummary;
  vocab_count: number;
  recent_activity: Array<{ date: string; module: string; band: number | null }>;
  writing_heatmap: HeatmapEntry[];
  speaking_heatmap: HeatmapEntry[];
  generated_at: string;
};

function calcAvg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function latestBand(records: Array<{ estimated_band: number | null }>): number | null {
  const valid = records.filter((r) => r.estimated_band != null);
  if (valid.length === 0) return null;
  return valid[valid.length - 1].estimated_band;
}

export async function getExportData(): Promise<ExportData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    profileResult,
    listeningResult,
    readingResult,
    writingResult,
    speakingResult,
    vocabResult,
    writingHeatmapResult,
    speakingCriteriaResult,
    speakingCatResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, target_band, current_streak, longest_streak, total_xp, exam_date")
      .eq("id", user.id)
      .single(),
    supabase
      .from("listening_records")
      .select("date, estimated_band")
      .eq("user_id", user.id)
      .order("date", { ascending: true }),
    supabase
      .from("reading_records")
      .select("date, estimated_band")
      .eq("user_id", user.id)
      .order("date", { ascending: true }),
    supabase
      .from("writing_entries")
      .select("date, estimated_band, sub_type")
      .eq("user_id", user.id)
      .order("date", { ascending: true }),
    supabase
      .from("speaking_entries")
      .select("date, estimated_band, fluency_score, lexical_score, grammar_score, pronunciation_score")
      .eq("user_id", user.id)
      .order("date", { ascending: true }),
    supabase
      .from("vocab_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("writing_entries")
      .select("sub_type, estimated_band")
      .eq("user_id", user.id)
      .not("estimated_band", "is", null),
    supabase
      .from("speaking_entries")
      .select("fluency_score, lexical_score, grammar_score, pronunciation_score")
      .eq("user_id", user.id),
    supabase
      .from("speaking_part_details")
      .select("topic_category, speaking_entries!inner(user_id, estimated_band)")
      .eq("speaking_entries.user_id", user.id)
      .eq("part", 2)
      .not("topic_category", "is", null),
  ]);

  const profile = profileResult.data;
  if (!profile) return null;

  const listeningRows = listeningResult.data || [];
  const readingRows = readingResult.data || [];
  const writingRows = writingResult.data || [];
  const speakingRows = speakingResult.data || [];

  // Module summaries
  const listeningModule: ModuleSummary = {
    count: listeningRows.length,
    avg_band: calcAvg(listeningRows.map((r) => r.estimated_band)),
    latest_band: latestBand(listeningRows),
  };
  const readingModule: ModuleSummary = {
    count: readingRows.length,
    avg_band: calcAvg(readingRows.map((r) => r.estimated_band)),
    latest_band: latestBand(readingRows),
  };
  const writingModule: ModuleSummary = {
    count: writingRows.length,
    avg_band: calcAvg(writingRows.map((r) => r.estimated_band)),
    latest_band: latestBand(writingRows),
  };
  const speakingModule: ModuleSummary = {
    count: speakingRows.length,
    avg_band: calcAvg(speakingRows.map((r) => r.estimated_band)),
    latest_band: latestBand(speakingRows),
  };

  // Recent activity — last 10 entries across all modules
  type ActivityRow = { date: string; module: string; band: number | null };
  const allActivity: ActivityRow[] = [
    ...listeningRows.slice(-5).map((r) => ({ date: r.date, module: "Listening", band: r.estimated_band })),
    ...readingRows.slice(-5).map((r) => ({ date: r.date, module: "Reading", band: r.estimated_band })),
    ...writingRows.slice(-5).map((r) => ({ date: r.date, module: "Writing", band: r.estimated_band })),
    ...speakingRows.slice(-5).map((r) => ({ date: r.date, module: "Speaking", band: r.estimated_band })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  // Writing heatmap summary
  const writeAcc: Record<string, { total: number; count: number; label: string }> = {};
  for (const e of writingHeatmapResult.data || []) {
    const k = e.sub_type as string;
    if (!writeAcc[k]) writeAcc[k] = { total: 0, count: 0, label: k };
    writeAcc[k].total += e.estimated_band as number;
    writeAcc[k].count++;
  }
  const writing_heatmap: HeatmapEntry[] = Object.entries(writeAcc).map(([key, val]) => ({
    key,
    label: key,
    avg: val.count > 0 ? val.total / val.count : 0,
    count: val.count,
  }));

  // Speaking criteria heatmap
  const criteriaMap: Record<string, { total: number; count: number; label: string }> = {
    fluency: { total: 0, count: 0, label: "Fluency & Coherence" },
    lexical: { total: 0, count: 0, label: "Lexical Resource" },
    grammar: { total: 0, count: 0, label: "Grammatical Range & Accuracy" },
    pronunciation: { total: 0, count: 0, label: "Pronunciation" },
  };
  for (const e of speakingCriteriaResult.data || []) {
    if (e.fluency_score != null) { criteriaMap.fluency.total += e.fluency_score; criteriaMap.fluency.count++; }
    if (e.lexical_score != null) { criteriaMap.lexical.total += e.lexical_score; criteriaMap.lexical.count++; }
    if (e.grammar_score != null) { criteriaMap.grammar.total += e.grammar_score; criteriaMap.grammar.count++; }
    if (e.pronunciation_score != null) { criteriaMap.pronunciation.total += e.pronunciation_score; criteriaMap.pronunciation.count++; }
  }

  type SpeakingCatRow = {
    topic_category: string | null;
    speaking_entries: { estimated_band: number | null } | { estimated_band: number | null }[];
  };
  const catAcc: Record<string, { total: number; count: number }> = {};
  for (const p of (speakingCatResult.data as SpeakingCatRow[] | null) || []) {
    const cat = p.topic_category;
    if (!cat) continue;
    const entry = Array.isArray(p.speaking_entries) ? p.speaking_entries[0] : p.speaking_entries;
    const band = entry?.estimated_band;
    if (band == null) continue;
    if (!catAcc[cat]) catAcc[cat] = { total: 0, count: 0 };
    catAcc[cat].total += band;
    catAcc[cat].count++;
  }

  const speaking_heatmap: HeatmapEntry[] = [
    ...Object.entries(criteriaMap).map(([key, val]) => ({
      key,
      label: val.label,
      avg: val.count > 0 ? val.total / val.count : 0,
      count: val.count,
    })),
    ...Object.entries(catAcc).map(([key, val]) => ({
      key: `cat_${key}`,
      label: `Part 2: ${key}`,
      avg: val.count > 0 ? val.total / val.count : 0,
      count: val.count,
    })),
  ];

  return {
    profile: {
      display_name: profile.display_name,
      target_band: profile.target_band,
      current_streak: profile.current_streak || 0,
      longest_streak: profile.longest_streak || 0,
      total_xp: profile.total_xp || 0,
      exam_date: profile.exam_date,
    },
    listening: listeningModule,
    reading: readingModule,
    writing: writingModule,
    speaking: speakingModule,
    vocab_count: vocabResult.count || 0,
    recent_activity: allActivity,
    writing_heatmap,
    speaking_heatmap,
    generated_at: new Date().toISOString(),
  };
}
