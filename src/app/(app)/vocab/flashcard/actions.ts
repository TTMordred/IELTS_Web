"use server";

import { createClient } from "@/lib/supabase/server";
import type { VocabCard } from "@/lib/types";

export async function getFlashcardCards(
  filter: "all" | "due" | "weak" | "new" = "all",
  topic?: string,
  limit: number = 20
): Promise<VocabCard[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const clampedLimit = Math.min(Math.max(1, limit), 100);
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("vocab_cards")
    .select("*")
    .eq("user_id", user.id);

  if (filter === "due") {
    query = query.or(`next_review.lte.${today},next_review.is.null`);
  } else if (filter === "weak") {
    query = query.lt("mastery", 50);
  } else if (filter === "new") {
    query = query.eq("review_count", 0);
  }

  if (topic) {
    query = query.eq("topic", topic);
  }

  query = query.order("created_at", { ascending: false }).limit(clampedLimit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
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
  if (!data) return [];

  const topics = [...new Set(data.map((row) => row.topic as string))].sort();
  return topics;
}
