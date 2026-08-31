"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Content tables that reference a global topic from a speaking record. */
const SPEAKING_TOPIC_TABLES = [
  { table: "speaking_entry_questions", part: 1 },
  { table: "speaking_part2_cards", part: 2 },
  { table: "speaking_part3_questions", part: 3 },
] as const;

export type PreparedTopic = {
  id: string;
  name: string;
  part: 1 | 2 | 3 | null;
  category: string | null;
  record_count: number;
  last_used: string | null;
};

export type TopicRecord = {
  id: string;
  name: string | null;
  date: string;
  type: string;
  estimated_band: number | null;
  fluency_score: number | null;
  lexical_score: number | null;
  grammar_score: number | null;
  pronunciation_score: number | null;
  parts: number[];
};

/**
 * Topics the current user has prepared in speaking — i.e. global topics
 * referenced by at least one of their speaking records (Part 1/2/3 content).
 * Returns each topic with the number of distinct records that used it and the
 * date it was last used.
 */
export async function getPreparedTopics() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const topicEntryCounts = new Map<string, Set<string>>();
  const topicLastUsed = new Map<string, string>();

  for (const { table } of SPEAKING_TOPIC_TABLES) {
    const { data } = await supabase
      .from(table)
      .select("topic_id, entry_id, speaking_entries!inner(date)")
      .eq("speaking_entries.user_id", user.id)
      .not("topic_id", "is", null);

    for (const row of data ?? []) {
      if (!row.topic_id) continue;
      const entries = topicEntryCounts.get(row.topic_id) ?? new Set<string>();
      entries.add(row.entry_id);
      topicEntryCounts.set(row.topic_id, entries);

      // The FK join is to-one, but PostgREST typing is conservative — handle both.
      const joined = row.speaking_entries as { date: string | null }[] | { date: string | null } | null;
      const used = Array.isArray(joined) ? joined[0]?.date : joined?.date;
      if (used && (!topicLastUsed.has(row.topic_id) || used > topicLastUsed.get(row.topic_id)!)) {
        topicLastUsed.set(row.topic_id, used);
      }
    }
  }

  const topicIds = [...topicEntryCounts.keys()];
  if (topicIds.length === 0) return [];

  const { data: topics, error } = await supabase
    .from("global_topics")
    .select("id, name, module, part, category")
    .in("id", topicIds);

  if (error) throw error;

  return (topics ?? [])
    .filter((topic) => topic.module === "speaking")
    .map((topic): PreparedTopic => ({
      id: topic.id,
      name: topic.name,
      part: topic.part,
      category: topic.category,
      record_count: topicEntryCounts.get(topic.id)?.size ?? 0,
      last_used: topicLastUsed.get(topic.id) ?? null,
    }))
    .sort((a, b) => (b.last_used ?? "").localeCompare(a.last_used ?? ""));
}

/**
 * The speaking records in which the current user prepared a given global topic.
 * Each record carries the list of parts whose content referenced the topic.
 * Returns null when the topic does not exist.
 */
export async function getTopicRecords(topicId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: topic, error: topicError } = await supabase
    .from("global_topics")
    .select("id, name, module, part, category")
    .eq("id", topicId)
    .single();
  if (topicError) throw topicError;
  if (!topic) return null;

  const entryIds = new Set<string>();
  const partsByEntry = new Map<string, Set<number>>();

  for (const { table, part } of SPEAKING_TOPIC_TABLES) {
    const { data } = await supabase
      .from(table)
      .select("entry_id, speaking_entries!inner(user_id)")
      .eq("topic_id", topicId)
      .eq("speaking_entries.user_id", user.id);

    for (const row of data ?? []) {
      entryIds.add(row.entry_id);
      const parts = partsByEntry.get(row.entry_id) ?? new Set<number>();
      parts.add(part);
      partsByEntry.set(row.entry_id, parts);
    }
  }

  if (entryIds.size === 0) return { topic, records: [] as TopicRecord[] };

  const { data: entries, error } = await supabase
    .from("speaking_entries")
    .select("id, name, date, type, estimated_band, fluency_score, lexical_score, grammar_score, pronunciation_score")
    .in("id", [...entryIds])
    .order("date", { ascending: false });

  if (error) throw error;

  return {
    topic,
    records: (entries ?? []).map((entry): TopicRecord => ({
      ...entry,
      parts: [...(partsByEntry.get(entry.id) ?? [])].sort(),
    })),
  };
}

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
