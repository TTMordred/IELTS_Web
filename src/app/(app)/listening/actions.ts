"use server";

import { createClient } from "@/lib/supabase/server";
import { scoreToBand } from "@/lib/constants/band-tables";
import { updateStreak } from "@/lib/streak";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SectionInput = {
  section: number;
  section_score: number;
  notes: string;
  types: {
    question_type: string;
    correct: number;
    total: number;
    mistakes_note: string;
  }[];
};

export type CreateRecordInput = {
  date: string;
  source: string;
  test_name: string;
  link: string;
  total_score: number;
  reflection: string;
  self_rating: number;
  sections: SectionInput[];
};

export async function createListeningRecord(input: CreateRecordInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const estimated_band = scoreToBand(input.total_score, "listening");

  // Insert main record
  const { data: record, error: recordError } = await supabase
    .from("listening_records")
    .insert({
      user_id: user.id,
      date: input.date,
      source: input.source,
      test_name: input.test_name,
      link: input.link || null,
      total_score: input.total_score,
      estimated_band,
      reflection: input.reflection || null,
      self_rating: input.self_rating || null,
    })
    .select("id")
    .single();

  if (recordError) throw recordError;

  // Insert section details + type results
  for (const section of input.sections) {
    const { data: sectionDetail, error: sectionError } = await supabase
      .from("listening_section_details")
      .insert({
        record_id: record.id,
        section: section.section,
        section_score: section.section_score,
        notes: section.notes || null,
      })
      .select("id")
      .single();

    if (sectionError) throw sectionError;

    if (section.types.length > 0) {
      const typeRows = section.types
        .filter((t) => t.question_type && t.total > 0)
        .map((t) => ({
          section_detail_id: sectionDetail.id,
          question_type: t.question_type,
          correct: t.correct,
          total: t.total,
          mistakes_note: t.mistakes_note || null,
        }));

      if (typeRows.length > 0) {
        const { error: typeError } = await supabase
          .from("listening_type_results")
          .insert(typeRows);
        if (typeError) throw typeError;
      }
    }
  }

  // Update daily activity
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("id, xp_earned, listening_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("daily_activity")
      .update({
        xp_earned: existing.xp_earned + 20,
        listening_count: existing.listening_count + 1,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      date: today,
      xp_earned: 20,
      listening_count: 1,
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

  revalidatePath("/listening");
  revalidatePath("/dashboard");
  redirect("/listening");
}

export async function getListeningRecords() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("listening_records")
    .select("id, date, test_name, total_score, estimated_band, source, self_rating")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getListeningRecord(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: record, error } = await supabase
    .from("listening_records")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;

  const { data: sections } = await supabase
    .from("listening_section_details")
    .select("*, listening_type_results(*)")
    .eq("record_id", id)
    .order("section");

  return { record, sections: sections || [] };
}

export async function deleteListeningRecord(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("listening_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/listening");
  redirect("/listening");
}
