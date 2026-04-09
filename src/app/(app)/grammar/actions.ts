"use server";

import { createClient } from "@/lib/supabase/server";
import { updateStreak } from "@/lib/streak";
import { revalidatePath } from "next/cache";

export async function getGrammarNotes(category?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("grammar_notes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addGrammarNote(input: {
  category: string;
  rule: string;
  correct_examples: string[];
  common_mistakes: string[];
  source: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("grammar_notes").insert({
    user_id: user.id,
    category: input.category,
    rule: input.rule,
    correct_examples: input.correct_examples.filter(Boolean),
    common_mistakes: input.common_mistakes.filter(Boolean),
    source: input.source || null,
  });

  if (error) throw error;

  // XP
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("id, xp_earned, notes_added")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase.from("daily_activity").update({
      xp_earned: existing.xp_earned + 8,
      notes_added: existing.notes_added + 1,
    }).eq("id", existing.id);
  } else {
    await supabase.from("daily_activity").insert({
      user_id: user.id, date: today, xp_earned: 8, notes_added: 1,
    });
  }

  const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();
  await supabase.from("profiles").update({ total_xp: (profile?.total_xp || 0) + 8, last_active: today }).eq("id", user.id);

  await updateStreak(supabase, user.id);

  revalidatePath("/grammar");
}

export async function deleteGrammarNote(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("grammar_notes").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/grammar");
}
