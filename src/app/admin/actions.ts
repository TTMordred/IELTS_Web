"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function checkIsAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return true;
}

export async function getAdminStats() {
  await checkIsAdmin();
  const supabase = await createClient();

  const [profiles, listening, reading, writing, speaking, vocab, topics] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("listening_records").select("id", { count: "exact", head: true }),
    supabase.from("reading_records").select("id", { count: "exact", head: true }),
    supabase.from("writing_entries").select("id", { count: "exact", head: true }),
    supabase.from("speaking_entries").select("id", { count: "exact", head: true }),
    supabase.from("vocab_cards").select("id", { count: "exact", head: true }),
    supabase.from("global_topics").select("id", { count: "exact", head: true }),
  ]);

  // Active users (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { count: activeUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("last_active", sevenDaysAgo.toISOString().split("T")[0]);

  // Platform-wide band averages
  const [lBands, rBands, wBands, sBands] = await Promise.all([
    supabase.from("listening_records").select("estimated_band").not("estimated_band", "is", null),
    supabase.from("reading_records").select("estimated_band").not("estimated_band", "is", null),
    supabase.from("writing_entries").select("estimated_band").not("estimated_band", "is", null),
    supabase.from("speaking_entries").select("estimated_band").not("estimated_band", "is", null),
  ]);

  const avg = (arr: { estimated_band: number | null }[]) => {
    const vals = arr.filter((r) => r.estimated_band != null).map((r) => r.estimated_band!);
    return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2 : 0;
  };

  // Weakest question types (platform-wide)
  const { data: typeResults } = await supabase
    .from("listening_type_results")
    .select("question_type, correct, total");

  const typeAcc: Record<string, { correct: number; total: number }> = {};
  (typeResults || []).forEach((r) => {
    if (!typeAcc[r.question_type]) typeAcc[r.question_type] = { correct: 0, total: 0 };
    typeAcc[r.question_type].correct += r.correct;
    typeAcc[r.question_type].total += r.total;
  });

  const typeRanking = Object.entries(typeAcc)
    .map(([type, { correct, total }]) => ({
      type,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      attempts: total,
    }))
    .filter((t) => t.attempts >= 5)
    .sort((a, b) => a.accuracy - b.accuracy);

  // Total XP across platform
  const { data: xpData } = await supabase.from("profiles").select("total_xp");
  const totalPlatformXP = (xpData || []).reduce((sum, p) => sum + (p.total_xp || 0), 0);

  // Avg streak
  const { data: streakData } = await supabase.from("profiles").select("current_streak");
  const avgStreak = streakData && streakData.length > 0
    ? Math.round(streakData.reduce((sum, p) => sum + (p.current_streak || 0), 0) / streakData.length * 10) / 10
    : 0;

  return {
    totalUsers: profiles.count || 0,
    activeUsers: activeUsers || 0,
    listeningRecords: listening.count || 0,
    readingRecords: reading.count || 0,
    writingEntries: writing.count || 0,
    speakingEntries: speaking.count || 0,
    vocabCards: vocab.count || 0,
    totalTopics: topics.count || 0,
    avgBands: {
      listening: avg(lBands.data || []),
      reading: avg(rBands.data || []),
      writing: avg(wBands.data || []),
      speaking: avg(sBands.data || []),
    },
    weakestTypes: typeRanking.slice(0, 5),
    strongestTypes: typeRanking.slice(-5).reverse(),
    totalPlatformXP,
    avgStreak,
  };
}

export async function getRecentActivity(limit = 10) {
  await checkIsAdmin();
  const supabase = await createClient();

  const [listening, reading, writing, speaking] = await Promise.all([
    supabase.from("listening_records").select("id, user_id, date, test_name, estimated_band, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("reading_records").select("id, user_id, date, test_name, estimated_band, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("writing_entries").select("id, user_id, date, task_type, sub_type, estimated_band, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("speaking_entries").select("id, user_id, date, type, estimated_band, created_at").order("created_at", { ascending: false }).limit(limit),
  ]);

  const all = [
    ...(listening.data || []).map((r) => ({ ...r, module: "listening" as const })),
    ...(reading.data || []).map((r) => ({ ...r, module: "reading" as const })),
    ...(writing.data || []).map((r) => ({ ...r, module: "writing" as const })),
    ...(speaking.data || []).map((r) => ({ ...r, module: "speaking" as const })),
  ];

  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return all.slice(0, limit);
}

export async function createForecastTopic(input: {
  name: string;
  part: 1 | 2 | 3;
  category: string;
  sample_questions: string[];
  forecast_quarter: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("global_topics").insert({
    name: input.name,
    module: "speaking",
    part: input.part,
    category: input.category || null,
    sample_questions: input.sample_questions.filter(Boolean),
    created_by: user.id,
    is_forecast: true,
    forecast_quarter: input.forecast_quarter,
  });

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/topics");
}

export async function updateTopic(id: string, input: {
  name?: string;
  category?: string;
  sample_questions?: string[];
  is_forecast?: boolean;
  forecast_quarter?: string | null;
}) {
  await checkIsAdmin();
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.sample_questions !== undefined) updateData.sample_questions = input.sample_questions;
  if (input.is_forecast !== undefined) {
    updateData.is_forecast = input.is_forecast;
    updateData.forecast_quarter = input.is_forecast ? input.forecast_quarter : null;
  }

  const { error } = await supabase
    .from("global_topics")
    .update(updateData)
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/topics");
}

export async function deleteTopic(id: string) {
  await checkIsAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("global_topics").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/topics");
}

export async function getUserDetail(userId: string) {
  await checkIsAdmin();
  const supabase = await createClient();

  const [profile, listening, reading, writing, speaking, vocab, grammar, activity] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("listening_records").select("id, date, test_name, total_score, estimated_band, source, created_at").eq("user_id", userId).order("date", { ascending: false }).limit(20),
    supabase.from("reading_records").select("id, date, test_name, total_score, estimated_band, source, created_at").eq("user_id", userId).order("date", { ascending: false }).limit(20),
    supabase.from("writing_entries").select("id, date, task_type, sub_type, estimated_band, word_count, created_at").eq("user_id", userId).order("date", { ascending: false }).limit(20),
    supabase.from("speaking_entries").select("id, date, type, estimated_band, fluency_score, lexical_score, grammar_score, pronunciation_score, created_at").eq("user_id", userId).order("date", { ascending: false }).limit(20),
    supabase.from("vocab_cards").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("grammar_notes").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("daily_activity").select("date, xp_earned").eq("user_id", userId).order("date", { ascending: false }).limit(30),
  ]);

  if (!profile.data) throw new Error("User not found");

  // Compute per-module band averages for this user
  const avgBand = (records: { estimated_band: number | null }[]) => {
    const vals = records.filter((r) => r.estimated_band != null).map((r) => r.estimated_band!);
    return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2 : null;
  };

  return {
    profile: profile.data,
    listening: listening.data || [],
    reading: reading.data || [],
    writing: writing.data || [],
    speaking: speaking.data || [],
    vocabCount: vocab.count || 0,
    grammarCount: grammar.count || 0,
    recentActivity: activity.data || [],
    bands: {
      listening: avgBand(listening.data || []),
      reading: avgBand(reading.data || []),
      writing: avgBand(writing.data || []),
      speaking: avgBand(speaking.data || []),
    },
    totalRecords: (listening.data?.length || 0) + (reading.data?.length || 0) + (writing.data?.length || 0) + (speaking.data?.length || 0),
  };
}
