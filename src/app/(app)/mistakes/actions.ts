"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MistakeEntry = {
  id: string;
  user_id: string;
  module: "listening" | "reading" | "speaking" | "writing";
  question_type: string | null;
  description: string;
  reason: string | null;
  correct_approach: string | null;
  source_record_id: string | null;
  tags: string[];
  reviewed: boolean;
  review_count: number;
  next_review: string | null;
  created_at: string;
};

export async function getMistakes(filters?: {
  module?: string;
  reviewed?: boolean;
  search?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("mistake_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filters?.module && filters.module !== "all") {
    query = query.eq("module", filters.module);
  }
  if (filters?.reviewed !== undefined) {
    query = query.eq("reviewed", filters.reviewed);
  }
  if (filters?.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,correct_approach.ilike.%${filters.search}%,question_type.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as MistakeEntry[];
}

export async function addMistake(input: {
  module: "listening" | "reading" | "speaking" | "writing";
  question_type?: string;
  description: string;
  reason?: string;
  correct_approach?: string;
  tags?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("mistake_entries").insert({
    user_id: user.id,
    module: input.module,
    question_type: input.question_type || null,
    description: input.description,
    reason: input.reason || null,
    correct_approach: input.correct_approach || null,
    tags: (input.tags || []).filter(Boolean),
  });

  if (error) throw error;
  revalidatePath("/mistakes");
}

// Spaced repetition intervals (days): 1, 3, 7, 14, 30
const SR_INTERVALS = [1, 3, 7, 14, 30];

export async function markReviewed(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: entry } = await supabase
    .from("mistake_entries")
    .select("review_count, reviewed")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!entry) throw new Error("Not found");

  const newCount = entry.review_count + 1;
  const intervalDays = SR_INTERVALS[Math.min(newCount - 1, SR_INTERVALS.length - 1)];
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);
  const nextReviewStr = nextReview.toISOString().split("T")[0];

  const { error } = await supabase
    .from("mistake_entries")
    .update({
      reviewed: true,
      review_count: newCount,
      next_review: nextReviewStr,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/mistakes");
}

export async function deleteMistake(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("mistake_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/mistakes");
}
