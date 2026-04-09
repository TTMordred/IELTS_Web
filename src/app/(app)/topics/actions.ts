"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTopics(filters?: {
  part?: number | null;
  module?: "speaking" | "vocab";
  search?: string;
  forecast_quarter?: string;
  forecastOnly?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("global_topics")
    .select("*, topic_upvotes(count)")
    .order("created_at", { ascending: false });

  if (filters?.module) {
    query = query.eq("module", filters.module);
  }
  if (filters?.part !== undefined && filters?.part !== null) {
    query = query.eq("part", filters.part);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters?.forecast_quarter) {
    query = query.eq("forecast_quarter", filters.forecast_quarter);
  }
  if (filters?.forecastOnly) {
    query = query.eq("is_forecast", true);
  }

  const { data: topics, error } = await query;
  if (error) throw error;

  // Check which topics current user has upvoted
  const { data: userUpvotes } = await supabase
    .from("topic_upvotes")
    .select("topic_id")
    .eq("user_id", user.id);

  const upvotedIds = new Set((userUpvotes || []).map((u) => u.topic_id));

  return (topics || []).map((t) => ({
    ...t,
    user_has_upvoted: upvotedIds.has(t.id),
  }));
}

export async function getTopicsByPart(part: 1 | 2 | 3) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("global_topics")
    .select("id, name, category, is_forecast")
    .eq("module", "speaking")
    .eq("part", part)
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function getVocabTopics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("global_topics")
    .select("id, name, category")
    .eq("module", "vocab")
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function createTopic(input: {
  name: string;
  module: "speaking" | "vocab";
  part: number | null;
  category: string;
  sample_questions: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("global_topics").insert({
    name: input.name,
    module: input.module,
    part: input.part,
    category: input.category || null,
    sample_questions: input.sample_questions.filter(Boolean),
    created_by: user.id,
  });

  if (error) throw error;
  revalidatePath("/topics");
}

export async function toggleUpvote(topicId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if already upvoted
  const { data: existing } = await supabase
    .from("topic_upvotes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("topic_id", topicId)
    .single();

  if (existing) {
    await supabase
      .from("topic_upvotes")
      .delete()
      .eq("user_id", user.id)
      .eq("topic_id", topicId);
  } else {
    await supabase
      .from("topic_upvotes")
      .insert({ user_id: user.id, topic_id: topicId });
  }

  revalidatePath("/topics");
}
