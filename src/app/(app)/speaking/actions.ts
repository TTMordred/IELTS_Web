"use server";

import { createClient } from "@/lib/supabase/server";
import { updateStreak } from "@/lib/streak";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PartDetailInput = {
  part: 1 | 2 | 3;
  topic: string;
  topic_category: string;
  notes: string;
};

export type CreateSpeakingEntryInput = {
  date: string;
  type: "practice" | "mock_test" | "real_test";
  fluency_score: number;
  lexical_score: number;
  grammar_score: number;
  pronunciation_score: number;
  reflection: string;
  parts: PartDetailInput[];
  recording_url?: string | null;
};

function calcBand(scores: number[]): number {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 2) / 2;
}

export async function createSpeakingEntry(input: CreateSpeakingEntryInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const estimated_band = calcBand([
    input.fluency_score,
    input.lexical_score,
    input.grammar_score,
    input.pronunciation_score,
  ]);

  const { data: entry, error: entryError } = await supabase
    .from("speaking_entries")
    .insert({
      user_id: user.id,
      date: input.date,
      type: input.type,
      estimated_band,
      fluency_score: input.fluency_score,
      lexical_score: input.lexical_score,
      grammar_score: input.grammar_score,
      pronunciation_score: input.pronunciation_score,
      reflection: input.reflection || null,
      recording_url: input.recording_url ?? null,
    })
    .select("id")
    .single();

  if (entryError) throw entryError;

  if (input.parts.length > 0) {
    const partRows = input.parts.map((p) => ({
      entry_id: entry.id,
      part: p.part,
      topic: p.topic || null,
      topic_category: p.topic_category || null,
      notes: p.notes || null,
    }));

    const { error: partsError } = await supabase
      .from("speaking_part_details")
      .insert(partRows);

    if (partsError) throw partsError;
  }

  // Update daily activity
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("id, xp_earned, speaking_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("daily_activity")
      .update({
        xp_earned: existing.xp_earned + 25,
        speaking_count: existing.speaking_count + 1,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_activity").insert({
      user_id: user.id,
      date: today,
      xp_earned: 25,
      speaking_count: 1,
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

  revalidatePath("/speaking");
  revalidatePath("/dashboard");
  redirect("/speaking");
}

export async function getSpeakingEntries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("speaking_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSpeakingEntry(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: entry, error } = await supabase
    .from("speaking_entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;

  const { data: parts } = await supabase
    .from("speaking_part_details")
    .select("*")
    .eq("entry_id", id)
    .order("part");

  let recordingSignedUrl: string | null = null;
  if (entry.recording_url) {
    const { data } = await supabase.storage
      .from("speaking-recordings")
      .createSignedUrl(entry.recording_url, 3600);
    recordingSignedUrl = data?.signedUrl ?? null;
  }

  return { entry, parts: parts || [], recordingSignedUrl };
}

export async function deleteSpeakingEntry(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("speaking_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/speaking");
  redirect("/speaking");
}
