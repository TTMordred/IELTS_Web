"use server";

import { createClient } from "@/lib/supabase/server";
import type { VocabCard } from "@/lib/types";

export async function getQuizCards(
  filter: "all" | "due" | "weak" | "new" = "all",
  topic?: string,
  limit: number = 20
): Promise<VocabCard[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("vocab_cards")
    .select("*")
    .eq("user_id", user.id);

  switch (filter) {
    case "due":
      query = query.lte("next_review", today);
      break;
    case "weak":
      query = query.lt("mastery", 40);
      break;
    case "new":
      query = query.is("next_review", null);
      break;
    // "all" — no extra filter
  }

  if (topic) {
    query = query.eq("topic", topic);
  }

  // Fetch more than requested so we have enough for distractors (min 4 for MC)
  const fetchLimit = Math.max(limit + 10, 20);
  query = query.order("created_at", { ascending: false }).limit(fetchLimit);

  const { data, error } = await query;
  if (error) throw error;

  const cards = data || [];

  // Shuffle and slice to requested limit
  const shuffled = cards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

export async function getVocabTopics(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("vocab_cards")
    .select("topic")
    .eq("user_id", user.id)
    .not("topic", "is", null);

  if (error) throw error;

  const topics = [...new Set((data || []).map((r) => r.topic as string))].filter(Boolean).sort();
  return topics;
}
