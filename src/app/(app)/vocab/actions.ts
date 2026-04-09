"use server";

import { createClient } from "@/lib/supabase/server";
import { updateStreak } from "@/lib/streak";
import { revalidatePath } from "next/cache";

export async function getVocabCards(search?: string, topic?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("vocab_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
  }
  if (topic) {
    query = query.eq("topic", topic);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addVocabCard(formData: {
  word: string;
  meaning: string;
  example: string;
  topic: string;
  tags: string[];
  source: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("vocab_cards").insert({
    user_id: user.id,
    word: formData.word,
    meaning: formData.meaning,
    example: formData.example || null,
    topic: formData.topic || null,
    tags: formData.tags || [],
    source: formData.source || null,
  });

  if (error) throw error;

  // Update daily activity
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("id, xp_earned")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("daily_activity")
      .update({ xp_earned: existing.xp_earned + 5 })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      date: today,
      xp_earned: 5,
    });
  }

  // Update profile XP
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp")
    .eq("id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({ total_xp: (profile?.total_xp || 0) + 5 })
    .eq("id", user.id);

  // Update streak
  await updateStreak(supabase, user.id);

  revalidatePath("/vocab");
  revalidatePath("/dashboard");
}

export async function deleteVocabCard(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("vocab_cards").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/vocab");
}
