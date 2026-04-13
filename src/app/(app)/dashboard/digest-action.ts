"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/cached-auth";

export async function getWeeklyDigest() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return null;

  const now = new Date();
  const dayOfWeek = now.getDay();
  // Only show digest on Monday (or any day for testing)
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // Monday
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  const thisWeekStr = thisWeekStart.toISOString().split("T")[0];
  const lastWeekStr = lastWeekStart.toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  // Fetch both weeks in parallel
  const [{ data: thisWeekActivity }, { data: lastWeekActivity }] = await Promise.all([
    supabase
      .from("daily_activity")
      .select("xp_earned, listening_count, reading_count, speaking_count, writing_count, vocab_reviewed")
      .eq("user_id", user.id)
      .gte("date", thisWeekStr)
      .lte("date", todayStr),
    supabase
      .from("daily_activity")
      .select("xp_earned, listening_count, reading_count, speaking_count, writing_count, vocab_reviewed")
      .eq("user_id", user.id)
      .gte("date", lastWeekStr)
      .lt("date", thisWeekStr),
  ]);

  const sum = (arr: Record<string, number>[] | null, field: string) =>
    (arr || []).reduce((s, r) => s + (r[field] || 0), 0);

  const thisWeek = {
    xp: sum(thisWeekActivity, "xp_earned"),
    sessions: sum(thisWeekActivity, "listening_count") + sum(thisWeekActivity, "reading_count") + sum(thisWeekActivity, "speaking_count") + sum(thisWeekActivity, "writing_count"),
    vocabReviewed: sum(thisWeekActivity, "vocab_reviewed"),
    activeDays: (thisWeekActivity || []).length,
  };

  const lastWeek = {
    xp: sum(lastWeekActivity, "xp_earned"),
    sessions: sum(lastWeekActivity, "listening_count") + sum(lastWeekActivity, "reading_count") + sum(lastWeekActivity, "speaking_count") + sum(lastWeekActivity, "writing_count"),
    vocabReviewed: sum(lastWeekActivity, "vocab_reviewed"),
    activeDays: (lastWeekActivity || []).length,
  };

  return {
    thisWeek,
    lastWeek,
    weekLabel: `${thisWeekStr} — ${todayStr}`,
  };
}
