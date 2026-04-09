import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Update streak for a user based on their daily activity.
 * Call this after any activity (log record, add vocab, etc.)
 */
export async function updateStreak(
  supabase: SupabaseClient,
  userId: string
) {
  // Use Supabase server time to avoid client timezone issues
  let today: string;
  const { data: dateRow, error: dateErr } = await supabase.rpc("get_current_date_text");
  if (dateErr || !dateRow) {
    today = new Date().toISOString().split("T")[0]; // fallback to UTC
  } else {
    today = String(dateRow);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, last_active")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const lastActive = profile.last_active;
  let newStreak = profile.current_streak;

  if (lastActive === today) {
    // Already active today, no change
    return;
  }

  // Derive yesterday from the DB-sourced today (same timezone)
  const todayDate = new Date(today + "T00:00:00Z");
  todayDate.setUTCDate(todayDate.getUTCDate() - 1);
  const yesterdayStr = todayDate.toISOString().split("T")[0];

  if (lastActive === yesterdayStr) {
    // Consecutive day — increment streak
    newStreak = profile.current_streak + 1;
  } else if (!lastActive) {
    // First activity ever
    newStreak = 1;
  } else {
    // Streak broken — reset to 1
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, profile.longest_streak);

  await supabase
    .from("profiles")
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_active: today,
    })
    .eq("id", userId);
}
