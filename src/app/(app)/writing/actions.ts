"use server";

import { createClient } from "@/lib/supabase/server";
import { updateStreak } from "@/lib/streak";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TeacherFeedback } from "@/lib/types";

export type CreateWritingEntryInput = {
  date: string;
  task_type: "task1" | "task2";
  sub_type: string;
  topic: string;
  topic_category: string;
  question_text: string;
  essay_content: string;
  time_spent_min: number;
  ta_score: number;
  cc_score: number;
  lr_score: number;
  gra_score: number;
  feedback: string;
  teacher_feedback?: TeacherFeedback;
};

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export async function createWritingEntry(input: CreateWritingEntryInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const word_count = input.essay_content
    ? input.essay_content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const raw_avg = (input.ta_score + input.cc_score + input.lr_score + input.gra_score) / 4;
  const estimated_band = roundToHalf(raw_avg);

  const { error: entryError } = await supabase
    .from("writing_entries")
    .insert({
      user_id: user.id,
      date: input.date,
      task_type: input.task_type,
      sub_type: input.sub_type,
      topic: input.topic || null,
      topic_category: input.topic_category || null,
      question_text: input.question_text || null,
      essay_content: input.essay_content || null,
      word_count,
      time_spent_min: input.time_spent_min || null,
      estimated_band,
      ta_score: input.ta_score,
      cc_score: input.cc_score,
      lr_score: input.lr_score,
      gra_score: input.gra_score,
      feedback: input.feedback || null,
      teacher_feedback: input.teacher_feedback ?? null,
    })
    .select("id")
    .single();

  if (entryError) throw entryError;

  // Update daily activity
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("id, xp_earned, writing_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("daily_activity")
      .update({
        xp_earned: existing.xp_earned + 25,
        writing_count: existing.writing_count + 1,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      date: today,
      xp_earned: 25,
      writing_count: 1,
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
    .update({
      total_xp: (profile?.total_xp || 0) + 25,
      last_active: today,
    })
    .eq("id", user.id);

  // Update streak
  await updateStreak(supabase, user.id);

  revalidatePath("/writing");
  revalidatePath("/dashboard");
  redirect("/writing");
}

export async function getWritingEntries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("writing_entries")
    .select("id, date, task_type, sub_type, topic, estimated_band, word_count")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getWritingEntry(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("writing_entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWritingEntry(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("writing_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/writing");
  redirect("/writing");
}

export async function saveAiGrading(
  id: string,
  scores: { ta: number; cc: number; lr: number; gra: number; estimated_band: number },
  teacherFeedback: import("@/lib/types").RichTeacherFeedback
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("writing_entries")
    .update({
      ta_score: scores.ta,
      cc_score: scores.cc,
      lr_score: scores.lr,
      gra_score: scores.gra,
      estimated_band: scores.estimated_band,
      teacher_feedback: teacherFeedback as unknown as Record<string, unknown>,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath(`/writing/${id}`);
}
