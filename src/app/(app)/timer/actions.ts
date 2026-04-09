"use server";

import { createClient } from "@/lib/supabase/server";

export async function logStudyTime(module: string, minutes: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("daily_activity")
    .select("id, xp_earned")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  // 1 XP per minute of study time
  const xp = Math.max(1, Math.round(minutes));

  if (existing) {
    await supabase
      .from("daily_activity")
      .update({ xp_earned: existing.xp_earned + xp })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      date: today,
      xp_earned: xp,
    });
  }
}
