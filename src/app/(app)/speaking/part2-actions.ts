"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deriveLearningItems } from "@/lib/speaking/derive-learning-items";
import {
  part2CardInputSchema,
  type Part2CardInput,
} from "@/lib/speaking/part2-validation";
import type { SpeakingPart2Card } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

async function requireOwnedEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  entryId: string,
) {
  const { data, error } = await supabase
    .from("speaking_entries")
    .select("id")
    .eq("id", entryId)
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Speaking record not found");
}

export async function getSpeakingPart2Cards(entryId: string): Promise<SpeakingPart2Card[]> {
  const { supabase, user } = await requireUser();
  await requireOwnedEntry(supabase, user.id, entryId);

  const { data, error } = await supabase
    .from("speaking_part2_cards")
    .select("*")
    .eq("entry_id", entryId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SpeakingPart2Card[];
}

/**
 * Derives vocab / language / grammar bank items from a cue card's Language Bank
 * and answer — the Part 2 equivalent of the Part 1 answer derivation. Items the
 * user already owns are skipped, so saving a card repeatedly is idempotent.
 * Delegates to the shared deriveLearningItems helper (also used by Part 3).
 */
async function derivePart2LearningItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  card: Part2CardInput,
) {
  return deriveLearningItems(supabase, userId, {
    source: `Speaking Part 2: ${card.cue_card}`,
    topicName: card.topic || card.cue_card,
    answer: card.answer,
    languageBank: card.language_bank,
    partTag: "part2",
    grammarCategory: "speaking_part2",
  });
}

const revalidateSpeakingPaths = (entryId: string) => {
  revalidatePath(`/speaking/${entryId}`);
  revalidatePath("/vocab");
  revalidatePath("/grammar");
  revalidatePath("/phrase-bank");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
};

export async function savePart2Card(input: Part2CardInput & { id?: string; entryId: string }) {
  const parsed = part2CardInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid cue card");

  const { supabase, user } = await requireUser();
  await requireOwnedEntry(supabase, user.id, input.entryId);

  const baseRow = {
    entry_id: input.entryId,
    topic_id: parsed.data.topicId ?? null,
    cue_card: parsed.data.cue_card,
    cue_card_type: parsed.data.cue_card_type,
    topic: parsed.data.topic || null,
    answer_structure: parsed.data.answer_structure,
    key_ideas: parsed.data.key_ideas,
    answer: parsed.data.answer,
    follow_up_ideas: parsed.data.follow_up_ideas,
    storytelling_devices: parsed.data.storytelling_devices,
    language_bank: parsed.data.language_bank,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data: existing, error: existingError } = await supabase
      .from("speaking_part2_cards")
      .select("id, entry_id")
      .eq("id", input.id)
      .single();
    if (existingError || existing?.entry_id !== input.entryId) throw new Error("Cue card not found");
    const { error } = await supabase.from("speaking_part2_cards").update(baseRow).eq("id", input.id);
    if (error) throw error;
  } else {
    const { count, error: countError } = await supabase
      .from("speaking_part2_cards")
      .select("id", { count: "exact", head: true })
      .eq("entry_id", input.entryId);
    if (countError) throw countError;
    if ((count ?? 0) >= 8) throw new Error("A Part 2 record can have at most 8 cue cards");
    const { error } = await supabase.from("speaking_part2_cards").insert({
      ...baseRow,
      position: (count ?? 0) + 1,
    });
    if (error) throw error;
  }

  await derivePart2LearningItems(supabase, user.id, parsed.data);
  revalidateSpeakingPaths(input.entryId);
}

export async function createSpeakingPart2Cards(entryId: string, cards: Part2CardInput[]) {
  const { supabase, user } = await requireUser();
  await requireOwnedEntry(supabase, user.id, entryId);

  const results = cards.map((card) => part2CardInputSchema.safeParse(card));
  const firstInvalid = results.find((result) => !result.success);
  if (firstInvalid && !firstInvalid.success) {
    throw new Error(firstInvalid.error.issues[0]?.message ?? "Invalid cue card");
  }
  const valid = results
    .filter((result): result is { success: true; data: Part2CardInput } => result.success)
    .map((result) => result.data);
  if (valid.length === 0) return;
  if (valid.length > 8) throw new Error("A Part 2 record can have at most 8 cue cards");

  const { count, error: countError } = await supabase
    .from("speaking_part2_cards")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", entryId);
  if (countError) throw countError;

  let position = count ?? 0;
  for (const card of valid) {
    position += 1;
    const { error } = await supabase.from("speaking_part2_cards").insert({
      entry_id: entryId,
      topic_id: card.topicId ?? null,
      cue_card: card.cue_card,
      cue_card_type: card.cue_card_type,
      topic: card.topic || null,
      answer_structure: card.answer_structure,
      key_ideas: card.key_ideas,
      answer: card.answer,
      follow_up_ideas: card.follow_up_ideas,
      storytelling_devices: card.storytelling_devices,
      language_bank: card.language_bank,
      position,
    });
    if (error) throw error;
    await derivePart2LearningItems(supabase, user.id, card);
  }

  revalidateSpeakingPaths(entryId);
}

export async function deletePart2Card(id: string) {
  const { supabase, user } = await requireUser();
  const { data: card, error } = await supabase
    .from("speaking_part2_cards")
    .select("id, entry_id")
    .eq("id", id)
    .single();
  if (error || !card) throw new Error("Cue card not found");
  await requireOwnedEntry(supabase, user.id, card.entry_id);

  const { error: deleteError } = await supabase.from("speaking_part2_cards").delete().eq("id", id);
  if (deleteError) throw deleteError;

  // Re-sequence remaining cards so positions stay contiguous (1..n).
  const { data: remaining, error: remainingError } = await supabase
    .from("speaking_part2_cards")
    .select("id")
    .eq("entry_id", card.entry_id)
    .order("position", { ascending: true });
  if (remainingError) throw remainingError;
  const updates = (remaining ?? []).map((item, index) =>
    supabase.from("speaking_part2_cards").update({ position: index + 1 }).eq("id", item.id)
  );
  await Promise.all(updates);

  revalidateSpeakingPaths(card.entry_id);
}
