import type { SupabaseClient } from "@supabase/supabase-js";
import { updateStreak } from "@/lib/streak";
import {
  normalizeLearningItem,
  uniqueLearningItems,
} from "./notebook-validation";
import type { LanguageBank } from "@/lib/types";

/**
 * Derives vocab / language / grammar bank items from a speaking answer's
 * Language Bank — shared by Parts 2 and 3. Items the user already owns are
 * skipped, so saving a card or question repeatedly is idempotent.
 *
 * Differs only in how the source is labelled (source / topicName / answer) and
 * which `speaking` part tag + grammar category the derived items are filed
 * under, which are passed in.
 */
export async function deriveLearningItems(
  supabase: SupabaseClient,
  userId: string,
  params: {
    source: string;
    topicName: string;
    answer: string;
    languageBank: LanguageBank;
    partTag: "part2" | "part3";
    grammarCategory: string;
  },
) {
  const { source, topicName, answer, languageBank: lb, partTag, grammarCategory } = params;
  const tag = (section: "topic-specific" | "useful" | "advanced") => ["speaking", partTag, section];

  const vocabularyCandidates = uniqueLearningItems([
    ...lb.topic_specific_vocabulary.map((item) => ({ ...item, topic: topicName, tags: tag("topic-specific") })),
    ...lb.useful_vocabulary.map((item) => ({ ...item, topic: null, tags: tag("useful") })),
    ...lb.advanced_adjectives_adverbs.map((item) => ({ ...item, topic: topicName, tags: tag("advanced") })),
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
      example: answer,
      topic: item.topic,
      tags: item.tags,
      source,
    }));
  if (newVocab.length > 0) {
    const { error } = await supabase.from("vocab_cards").insert(newVocab);
    if (error) throw error;
  }

  const phraseCandidates = uniqueLearningItems([
    ...lb.idioms_phrasal_verbs.map((item) => ({ kind: "idiom" as const, phrase: item.phrase, meaning: item.meaning })),
    ...lb.collocations.map((item) => ({ kind: "collocation" as const, phrase: item.phrase, meaning: item.meaning })),
    ...lb.linking_words.map((item) => ({ kind: "linking_word" as const, phrase: item.word, meaning: item.function })),
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

  const grammarRule = lb.grammar_focus.map((item) => item.grammar).join(", ");
  const patternExamples = lb.sentence_patterns.map((item) => item.sentence);

  const { data: existingGrammar, error: grammarReadError } = await supabase
    .from("grammar_notes")
    .select("rule")
    .eq("user_id", userId);
  if (grammarReadError) throw grammarReadError;
  const grammarExists = (existingGrammar ?? []).some(
    (item) => normalizeLearningItem(item.rule) === normalizeLearningItem(grammarRule),
  );
  const newGrammarCount = grammarExists ? 0 : 1;
  if (!grammarExists) {
    const { error } = await supabase.from("grammar_notes").insert({
      user_id: userId,
      category: grammarCategory,
      rule: grammarRule,
      correct_examples: patternExamples,
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
