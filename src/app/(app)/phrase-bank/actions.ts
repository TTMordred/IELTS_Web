"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateStreak } from "@/lib/streak";
import {
  languageNoteInputSchema,
  masteryInputSchema,
  type LanguageNoteInput,
} from "@/lib/phrase-bank/validation";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

async function awardPhraseXp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const today = new Date().toISOString().split("T")[0];
  const { data: activity } = await supabase
    .from("daily_activity")
    .select("id, xp_earned, notes_added")
    .eq("user_id", userId)
    .eq("date", today)
    .single();
  const activityResult = activity
    ? await supabase.from("daily_activity").update({
        xp_earned: activity.xp_earned + 5,
        notes_added: activity.notes_added + 1,
      }).eq("id", activity.id)
    : await supabase.from("daily_activity").insert({
        user_id: userId,
        date: today,
        xp_earned: 5,
        notes_added: 1,
      });
  if (activityResult.error) throw activityResult.error;

  await updateStreak(supabase, userId);
  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("total_xp")
    .eq("id", userId)
    .single();
  if (profileReadError) throw profileReadError;
  const { error } = await supabase
    .from("profiles")
    .update({ total_xp: (profile?.total_xp ?? 0) + 5, last_active: today })
    .eq("id", userId);
  if (error) throw error;
}

export async function getLanguageNotes() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("language_notes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addLanguageNote(input: LanguageNoteInput) {
  const parsed = languageNoteInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid Phrase Bank item");
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("language_notes").insert({
    user_id: user.id,
    kind: parsed.data.kind,
    phrase: parsed.data.phrase,
    meaning: parsed.data.meaning,
    topic: parsed.data.topic || null,
    source: parsed.data.source || "Manual entry",
  });
  if (error?.code === "23505") return { created: false };
  if (error) throw error;

  await awardPhraseXp(supabase, user.id);
  revalidatePath("/phrase-bank");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  return { created: true };
}

export async function deleteLanguageNote(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("language_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/phrase-bank");
}

export async function updateLanguageNoteMastery(id: string, mastery: number) {
  const parsed = masteryInputSchema.safeParse({ id, mastery });
  if (!parsed.success) throw new Error("Mastery must be between 0 and 100");
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("language_notes")
    .update({ mastery_level: parsed.data.mastery, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/phrase-bank");
}
