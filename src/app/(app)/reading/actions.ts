"use server";

import { createClient } from "@/lib/supabase/server";
import { scoreToBand } from "@/lib/constants/band-tables";
import { updateStreak } from "@/lib/streak";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PassageInput = {
  passage_num: number;
  passage_topic: string;
  passage_score: number;
  time_spent_min: number;
  notes: string;
  types: {
    question_type: string;
    correct: number;
    total: number;
    mistakes_note: string;
  }[];
};

export type CreateReadingRecordInput = {
  date: string;
  source: string;
  test_name: string;
  link: string;
  total_score: number;
  total_time_min: number;
  reflection: string;
  self_rating: number;
  passages: PassageInput[];
};

export async function createReadingRecord(input: CreateReadingRecordInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const estimated_band = scoreToBand(input.total_score, "reading");

  // Insert main record
  const { data: record, error: recordError } = await supabase
    .from("reading_records")
    .insert({
      user_id: user.id,
      date: input.date,
      source: input.source,
      test_name: input.test_name,
      link: input.link || null,
      total_score: input.total_score,
      estimated_band,
      total_time_min: input.total_time_min || null,
      reflection: input.reflection || null,
      self_rating: input.self_rating || null,
    })
    .select("id")
    .single();

  if (recordError) throw recordError;

  // Insert passage details + type results
  for (const passage of input.passages) {
    const { data: passageDetail, error: passageError } = await supabase
      .from("reading_passage_details")
      .insert({
        record_id: record.id,
        passage_num: passage.passage_num,
        passage_topic: passage.passage_topic || null,
        passage_score: passage.passage_score,
        time_spent_min: passage.time_spent_min || null,
        notes: passage.notes || null,
      })
      .select("id")
      .single();

    if (passageError) throw passageError;

    if (passage.types.length > 0) {
      const typeRows = passage.types
        .filter((t) => t.question_type && t.total > 0)
        .map((t) => ({
          passage_detail_id: passageDetail.id,
          question_type: t.question_type,
          correct: t.correct,
          total: t.total,
          mistakes_note: t.mistakes_note || null,
        }));

      if (typeRows.length > 0) {
        const { error: typeError } = await supabase
          .from("reading_type_results")
          .insert(typeRows);
        if (typeError) throw typeError;
      }
    }
  }

  // Update daily activity
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("id, xp_earned, reading_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("daily_activity")
      .update({
        xp_earned: existing.xp_earned + 20,
        reading_count: existing.reading_count + 1,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      date: today,
      xp_earned: 20,
      reading_count: 1,
    });
  }

  // Update profile XP + streak
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp")
    .eq("id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({
      total_xp: (profile?.total_xp || 0) + 20,
      last_active: today,
    })
    .eq("id", user.id);

  // Update streak
  await updateStreak(supabase, user.id);

  revalidatePath("/reading");
  revalidatePath("/dashboard");
  redirect("/reading");
}

export async function getReadingRecords() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("reading_records")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getReadingRecord(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: record, error } = await supabase
    .from("reading_records")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;

  const { data: passages } = await supabase
    .from("reading_passage_details")
    .select("*, reading_type_results(*)")
    .eq("record_id", id)
    .order("passage_num");

  return { record, passages: passages || [] };
}

export async function deleteReadingRecord(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("reading_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/reading");
  redirect("/reading");
}
