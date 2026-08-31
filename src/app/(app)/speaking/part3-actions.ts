"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deriveLearningItems } from "@/lib/speaking/derive-learning-items";
import {
  part3QuestionInputSchema,
  type Part3QuestionInput,
} from "@/lib/speaking/part3-validation";
import type { SpeakingPart3Question } from "@/lib/types";

const MAX_PART3_QUESTIONS = 20;

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

export async function getSpeakingPart3Questions(entryId: string): Promise<SpeakingPart3Question[]> {
  const { supabase, user } = await requireUser();
  await requireOwnedEntry(supabase, user.id, entryId);

  const { data, error } = await supabase
    .from("speaking_part3_questions")
    .select("*")
    .eq("entry_id", entryId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SpeakingPart3Question[];
}

/**
 * Derives vocab / language / grammar bank items from a question's Language Bank
 * and answer, via the shared derive helper (same behaviour as Part 2's derive).
 */
async function derivePart3LearningItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  question: Part3QuestionInput,
) {
  return deriveLearningItems(supabase, userId, {
    source: `Speaking Part 3: ${question.question}`,
    topicName: question.topic || question.question,
    answer: question.answer,
    languageBank: question.language_bank,
    partTag: "part3",
    grammarCategory: "speaking_part3",
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

export async function savePart3Question(input: Part3QuestionInput & { id?: string; entryId: string }) {
  const parsed = part3QuestionInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid discussion question");

  const { supabase, user } = await requireUser();
  await requireOwnedEntry(supabase, user.id, input.entryId);

  const baseRow = {
    entry_id: input.entryId,
    topic_id: parsed.data.topicId ?? null,
    question: parsed.data.question,
    topic: parsed.data.topic || null,
    answer_function: parsed.data.answer_function,
    answer_structure: parsed.data.answer_structure,
    main_idea: parsed.data.main_idea,
    supporting_ideas: parsed.data.supporting_ideas,
    alternative_view: parsed.data.alternative_view || null,
    answer: parsed.data.answer,
    follow_up_ideas: parsed.data.follow_up_ideas,
    discussion_devices: parsed.data.discussion_devices,
    language_bank: parsed.data.language_bank,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data: existing, error: existingError } = await supabase
      .from("speaking_part3_questions")
      .select("id, entry_id")
      .eq("id", input.id)
      .single();
    if (existingError || existing?.entry_id !== input.entryId) throw new Error("Discussion question not found");
    const { error } = await supabase.from("speaking_part3_questions").update(baseRow).eq("id", input.id);
    if (error) throw error;
  } else {
    const { count, error: countError } = await supabase
      .from("speaking_part3_questions")
      .select("id", { count: "exact", head: true })
      .eq("entry_id", input.entryId);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_PART3_QUESTIONS) throw new Error(`A Part 3 record can have at most ${MAX_PART3_QUESTIONS} questions`);
    const { error } = await supabase.from("speaking_part3_questions").insert({
      ...baseRow,
      position: (count ?? 0) + 1,
    });
    if (error) throw error;
  }

  await derivePart3LearningItems(supabase, user.id, parsed.data);
  revalidateSpeakingPaths(input.entryId);
}

export async function createSpeakingPart3Questions(entryId: string, questions: Part3QuestionInput[]) {
  const { supabase, user } = await requireUser();
  await requireOwnedEntry(supabase, user.id, entryId);

  const results = questions.map((question) => part3QuestionInputSchema.safeParse(question));
  const firstInvalid = results.find((result) => !result.success);
  if (firstInvalid && !firstInvalid.success) {
    throw new Error(firstInvalid.error.issues[0]?.message ?? "Invalid discussion question");
  }
  const valid = results
    .filter((result): result is { success: true; data: Part3QuestionInput } => result.success)
    .map((result) => result.data);
  if (valid.length === 0) return;
  if (valid.length > MAX_PART3_QUESTIONS) throw new Error(`A Part 3 record can have at most ${MAX_PART3_QUESTIONS} questions`);

  const { count, error: countError } = await supabase
    .from("speaking_part3_questions")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", entryId);
  if (countError) throw countError;

  let position = count ?? 0;
  for (const question of valid) {
    position += 1;
    const { error } = await supabase.from("speaking_part3_questions").insert({
      entry_id: entryId,
      topic_id: question.topicId ?? null,
      question: question.question,
      topic: question.topic || null,
      answer_function: question.answer_function,
      answer_structure: question.answer_structure,
      main_idea: question.main_idea,
      supporting_ideas: question.supporting_ideas,
      alternative_view: question.alternative_view || null,
      answer: question.answer,
      follow_up_ideas: question.follow_up_ideas,
      discussion_devices: question.discussion_devices,
      language_bank: question.language_bank,
      position,
    });
    if (error) throw error;
    await derivePart3LearningItems(supabase, user.id, question);
  }

  revalidateSpeakingPaths(entryId);
}

export async function deletePart3Question(id: string) {
  const { supabase, user } = await requireUser();
  const { data: question, error } = await supabase
    .from("speaking_part3_questions")
    .select("id, entry_id")
    .eq("id", id)
    .single();
  if (error || !question) throw new Error("Discussion question not found");
  await requireOwnedEntry(supabase, user.id, question.entry_id);

  const { error: deleteError } = await supabase.from("speaking_part3_questions").delete().eq("id", id);
  if (deleteError) throw deleteError;

  // Re-sequence remaining questions so positions stay contiguous (1..n).
  const { data: remaining, error: remainingError } = await supabase
    .from("speaking_part3_questions")
    .select("id")
    .eq("entry_id", question.entry_id)
    .order("position", { ascending: true });
  if (remainingError) throw remainingError;
  const updates = (remaining ?? []).map((item, index) =>
    supabase.from("speaking_part3_questions").update({ position: index + 1 }).eq("id", item.id)
  );
  await Promise.all(updates);

  revalidateSpeakingPaths(question.entry_id);
}
