"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateStreak } from "@/lib/streak";
import type { SpeakingAnswer } from "@/lib/types";
import {
  answerInputSchema,
  entryQuestionInputSchema,
  normalizeLearningItem,
  uniqueLearningItems,
  type AnswerInput,
} from "@/lib/speaking/notebook-validation";

type TopicJoin = { name: string } | { name: string }[] | null;
type QuestionRow = {
  id: string;
  entry_id: string;
  part: 1 | 2 | 3;
  topic_id: string | null;
  question_text: string;
  answer_function: string;
  created_at: string;
  updated_at: string;
  global_topics: TopicJoin;
  speaking_answers: SpeakingAnswer[] | null;
};

function joinedTopicName(topic: TopicJoin): string {
  return (Array.isArray(topic) ? topic[0]?.name : topic?.name) ?? "Speaking Part 1";
}

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

async function getOwnedQuestion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  questionId: string,
) {
  const { data, error } = await supabase
    .from("speaking_entry_questions")
    .select("id, entry_id, topic_id, question_text, answer_function, global_topics(name)")
    .eq("id", questionId)
    .single();
  if (error || !data) throw new Error("Speaking question not found");
  await requireOwnedEntry(supabase, userId, data.entry_id);
  return data as typeof data & { global_topics: TopicJoin };
}

export async function getSpeakingNotebook(entryId: string, part: 1 | 2 | 3) {
  const { supabase, user } = await requireUser();
  await requireOwnedEntry(supabase, user.id, entryId);

  const { data, error } = await supabase
    .from("speaking_entry_questions")
    .select("*, global_topics(name), speaking_answers(*)")
    .eq("entry_id", entryId)
    .eq("part", part)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as QuestionRow[]).map((question) => ({
    ...question,
    topic_name: joinedTopicName(question.global_topics),
    answers: (question.speaking_answers ?? []).toSorted((a, b) => a.position - b.position),
  }));
}

export async function getSpeakingTopicBank(part: 1 | 2 | 3) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("global_topics")
    .select("id, name, sample_questions")
    .eq("module", "speaking")
    .eq("part", part === 3 ? 2 : part)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function addEntryQuestion(input: {
  entryId: string;
  part: 1 | 2 | 3;
  topicId: string;
  questionText: string;
  answerFunction: string;
}) {
  const parsed = entryQuestionInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid question");

  const { supabase, user } = await requireUser();
  await requireOwnedEntry(supabase, user.id, parsed.data.entryId);

  const { data: topic, error: topicError } = await supabase
    .from("global_topics")
    .select("id, name, part, sample_questions")
    .eq("id", parsed.data.topicId)
    .eq("module", "speaking")
    .eq("part", parsed.data.part === 3 ? 2 : parsed.data.part)
    .single();
  if (topicError || !topic) throw new Error("Topic not found");

  const questions = Array.isArray(topic.sample_questions) ? topic.sample_questions : [];
  const normalizeQuestion = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();

  const submittedQuestion = normalizeQuestion(
    parsed.data.questionText
  );

  const questionMatches =
    questions.length === 0
      ? submittedQuestion === normalizeQuestion(topic.name)
      : questions.some(
        (question) =>
          typeof question === "string" &&
          normalizeQuestion(question) === submittedQuestion
      );

  if (!questionMatches) {
    console.error("Question-topic mismatch:", {
      topicName: topic.name,
      questions,
      submittedQuestion: parsed.data.questionText,
    });

    throw new Error("Question does not belong to this topic");
  }
  if (!questionMatches) throw new Error("Question does not belong to this topic");

  const { data, error } = await supabase.from("speaking_entry_questions").insert({
    entry_id: parsed.data.entryId,
    part: parsed.data.part,
    topic_id: parsed.data.topicId,
    question_text: parsed.data.questionText,
    answer_function: parsed.data.answerFunction,
  }).select("id").single();
  if (error?.code === "23505") throw new Error("This question is already in the record");
  if (error) throw error;

  revalidatePath(`/speaking/${parsed.data.entryId}`);
  return data.id;
}

export async function deleteEntryQuestion(id: string) {
  const { supabase, user } = await requireUser();
  const question = await getOwnedQuestion(supabase, user.id, id);
  const { error } = await supabase.from("speaking_entry_questions").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/speaking/${question.entry_id}`);
}

async function createDerivedLearningItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  question: Awaited<ReturnType<typeof getOwnedQuestion>>,
  input: AnswerInput,
) {
  const topicName = joinedTopicName(question.global_topics);
  const source = `Speaking: ${topicName} — ${question.question_text}`;

  const vocabularyCandidates = uniqueLearningItems([
    ...input.topic_specific_vocabulary.map((item) => ({ ...item, topic: topicName, tags: ["speaking", "topic-specific"] })),
    ...input.useful_vocabulary.map((item) => ({ ...item, topic: null, tags: ["speaking", "useful"] })),
    ...input.advanced_adjectives_adverbs.map((item) => ({ ...item, topic: topicName, tags: ["speaking", "advanced"] })),
  ], (item) => item.word);

  const { data: existingVocab, error: vocabReadError } = await supabase
    .from("vocab_cards")
    .select("word")
    .eq("user_id", userId);
  if (vocabReadError) throw vocabReadError;
  const existingWords = new Set((existingVocab ?? []).map((item) => normalizeLearningItem(item.word)));
  const newVocab = vocabularyCandidates
    .filter((item) => !existingWords.has(normalizeLearningItem(item.word)))
    .map((item) => ({
      user_id: userId,
      word: item.word,
      meaning: item.meaning,
      example: input.answer_text,
      topic: item.topic,
      tags: item.tags,
      source,
    }));
  if (newVocab.length > 0) {
    const { error } = await supabase.from("vocab_cards").insert(newVocab);
    if (error) throw error;
  }

  const phraseCandidates = uniqueLearningItems([
    ...input.idioms_phrasal_verbs.map((item) => ({ kind: "idiom" as const, phrase: item.phrase, meaning: item.meaning })),
    ...input.collocations.map((item) => ({ kind: "collocation" as const, phrase: item.phrase, meaning: item.meaning })),
    ...input.linking_words.map((item) => ({ kind: "linking_word" as const, phrase: item.word, meaning: item.function })),
  ], (item) => `${item.kind}:${item.phrase}`);
  const { data: existingPhrases, error: phraseReadError } = await supabase
    .from("language_notes")
    .select("kind, phrase")
    .eq("user_id", userId);
  if (phraseReadError) throw phraseReadError;
  const existingPhraseKeys = new Set((existingPhrases ?? []).map((item) => `${item.kind}:${normalizeLearningItem(item.phrase)}`));
  const newPhrases = phraseCandidates
    .filter((item) => !existingPhraseKeys.has(`${item.kind}:${normalizeLearningItem(item.phrase)}`))
    .map((item) => ({ ...item, user_id: userId, topic: topicName, source }));
  if (newPhrases.length > 0) {
    const { error } = await supabase.from("language_notes").insert(newPhrases);
    if (error) throw error;
  }

  const { data: existingGrammar, error: grammarReadError } = await supabase
    .from("grammar_notes")
    .select("rule")
    .eq("user_id", userId);
  if (grammarReadError) throw grammarReadError;
  const grammarExists = (existingGrammar ?? []).some(
    (item) => normalizeLearningItem(item.rule) === normalizeLearningItem(input.grammar_focus),
  );
  const newGrammarCount = grammarExists ? 0 : 1;
  if (!grammarExists) {
    const { error } = await supabase.from("grammar_notes").insert({
      user_id: userId,
      category: "speaking_patterns",
      rule: input.grammar_focus,
      correct_examples: input.sentence_patterns.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
      common_mistakes: [],
      source,
      mastery_level: 0,
    });
    if (error) throw error;
  }

  const xp = (newVocab.length + newPhrases.length) * 5 + newGrammarCount * 8;
  if (xp === 0) return;

  const today = new Date().toISOString().split("T")[0];
  const { data: activity } = await supabase
    .from("daily_activity")
    .select("id, xp_earned, notes_added")
    .eq("user_id", userId)
    .eq("date", today)
    .single();
  const activityResult = activity
    ? await supabase.from("daily_activity").update({
      xp_earned: activity.xp_earned + xp,
      notes_added: activity.notes_added + newGrammarCount + newPhrases.length,
    }).eq("id", activity.id)
    : await supabase.from("daily_activity").insert({
      user_id: userId,
      date: today,
      xp_earned: xp,
      notes_added: newGrammarCount + newPhrases.length,
    });
  if (activityResult.error) throw activityResult.error;

  await updateStreak(supabase, userId);
  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("total_xp")
    .eq("id", userId)
    .single();
  if (profileReadError) throw profileReadError;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ total_xp: (profile?.total_xp ?? 0) + xp, last_active: today })
    .eq("id", userId);
  if (profileError) throw profileError;
}

export async function saveSpeakingAnswer(input: AnswerInput & { id?: string; entryQuestionId: string }) {
  const parsed = answerInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid answer");

  const { supabase, user } = await requireUser();
  const question = await getOwnedQuestion(supabase, user.id, input.entryQuestionId);
  const row = { ...parsed.data, entry_question_id: input.entryQuestionId, updated_at: new Date().toISOString() };

  if (input.id) {
    const { data: existing, error: existingError } = await supabase
      .from("speaking_answers")
      .select("id, entry_question_id")
      .eq("id", input.id)
      .single();
    if (existingError || existing?.entry_question_id !== input.entryQuestionId) throw new Error("Answer not found");
    const { error } = await supabase.from("speaking_answers").update(row).eq("id", input.id);
    if (error) throw error;
  } else {
    const { count, error: countError } = await supabase
      .from("speaking_answers")
      .select("id", { count: "exact", head: true })
      .eq("entry_question_id", input.entryQuestionId);
    if (countError) throw countError;
    if ((count ?? 0) >= 5) throw new Error("A question can have at most 5 answers");
    const { error } = await supabase.from("speaking_answers").insert(row);
    if (error) throw error;
  }

  await createDerivedLearningItems(supabase, user.id, question, parsed.data);
  revalidatePath(`/speaking/${question.entry_id}`);
  revalidatePath("/vocab");
  revalidatePath("/grammar");
  revalidatePath("/phrase-bank");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
}

export async function deleteSpeakingAnswer(id: string) {
  const { supabase, user } = await requireUser();
  const { data: answer, error } = await supabase
    .from("speaking_answers")
    .select("id, entry_question_id")
    .eq("id", id)
    .single();
  if (error || !answer) throw new Error("Answer not found");
  const question = await getOwnedQuestion(supabase, user.id, answer.entry_question_id);
  const { error: deleteError } = await supabase.from("speaking_answers").delete().eq("id", id);
  if (deleteError) throw deleteError;
  revalidatePath(`/speaking/${question.entry_id}`);
}
