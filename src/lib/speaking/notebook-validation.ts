import { z } from "zod";
import { answerStructureFor, type AnswerFunction } from "../constants/speaking-answer-templates.ts";

const requiredText = z.string().trim().min(1, "This field is required");

export const wordMeaningSchema = z.object({
  word: requiredText,
  meaning: requiredText,
});

export const phraseMeaningSchema = z.object({
  phrase: requiredText,
  meaning: requiredText,
});

export const linkingWordSchema = z.object({
  word: requiredText,
  function: requiredText,
});

export const entryQuestionInputSchema = z.object({
  entryId: z.string().uuid(),
  part: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  topicId: z.string().uuid(),
  questionText: requiredText,
  answerFunction: z.custom<AnswerFunction>(
    (value) => typeof value === "string" && answerStructureFor(value) !== null,
    "Invalid answer function",
  ),
});

export const answerInputSchema = z.object({
  position: z.number().int().min(1).max(5),
  answer_text: requiredText,
  follow_up_ideas: requiredText,
  topic_specific_vocabulary: z.array(wordMeaningSchema).min(1),
  useful_vocabulary: z.array(wordMeaningSchema).min(1),
  advanced_adjectives_adverbs: z.array(wordMeaningSchema).min(1),
  idioms_phrasal_verbs: z.array(phraseMeaningSchema).min(1),
  collocations: z.array(phraseMeaningSchema).min(1),
  linking_words: z.array(linkingWordSchema).min(1),
  synonyms_paraphrasing: requiredText,
  referencing_devices: requiredText,
  sentence_patterns: requiredText,
  grammar_focus: requiredText,
});

export const newRecordNotebookQuestionSchema = z.object({
  part: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  topicId: z.string().uuid(),
  questionText: requiredText,
  answerFunction: z.custom<AnswerFunction>(
    (value) => typeof value === "string" && answerStructureFor(value) !== null,
    "Invalid answer function",
  ),
  answers: z.array(answerInputSchema).max(5),
});

export type EntryQuestionInput = z.infer<typeof entryQuestionInputSchema>;
export type AnswerInput = z.infer<typeof answerInputSchema>;
export type NewRecordNotebookQuestion = z.infer<typeof newRecordNotebookQuestionSchema>;

export function normalizeLearningItem(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function uniqueLearningItems<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = normalizeLearningItem(key(item));
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
