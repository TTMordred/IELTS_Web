import assert from "node:assert/strict";
import test from "node:test";
import {
  ANSWER_FUNCTION_TEMPLATES,
  answerStructureFor,
} from "../constants/speaking-answer-templates.ts";
import {
  answerInputSchema,
  newRecordNotebookQuestionSchema,
  normalizeLearningItem,
  uniqueLearningItems,
} from "./notebook-validation.ts";

const validAnswer = {
  position: 1,
  answer_text: "I use language-learning websites almost every day.",
  follow_up_ideas: "Explain how they improve consistency.",
  topic_specific_vocabulary: [{ word: "interactive lesson", meaning: "a lesson with active participation" }],
  useful_vocabulary: [{ word: "consistency", meaning: "regularity over time" }],
  advanced_adjectives_adverbs: [{ word: "remarkably", meaning: "to an unusual degree" }],
  idioms_phrasal_verbs: [{ phrase: "keep up with", meaning: "stay informed about" }],
  collocations: [{ phrase: "instant feedback", meaning: "feedback received immediately" }],
  linking_words: [{ word: "however", function: "contrast" }],
  synonyms_paraphrasing: "use frequently = rely on regularly",
  referencing_devices: "they = language-learning websites",
  sentence_patterns: "I tend to + verb because + clause",
  grammar_focus: "Present simple for habits",
};

test("maps every answer function to exactly one structure", () => {
  assert.equal(ANSWER_FUNCTION_TEMPLATES.length, 12);
  for (const item of ANSWER_FUNCTION_TEMPLATES) {
    assert.equal(answerStructureFor(item.function), item.structure);
  }
});

test("accepts a complete answer", () => {
  assert.equal(answerInputSchema.safeParse(validAnswer).success, true);
});

test("rejects an answer with an empty required field", () => {
  assert.equal(answerInputSchema.safeParse({ ...validAnswer, grammar_focus: "" }).success, false);
});

test("rejects an empty structured list", () => {
  assert.equal(answerInputSchema.safeParse({ ...validAnswer, collocations: [] }).success, false);
});

test("rejects an answer position outside one to five", () => {
  assert.equal(answerInputSchema.safeParse({ ...validAnswer, position: 6 }).success, false);
});

test("accepts only IELTS Speaking parts one to three", () => {
  const question = {
    part: 1,
    topicId: crypto.randomUUID(),
    questionText: "Do you work or study?",
    answerFunction: "Habit",
    answers: [validAnswer],
  };

  for (const part of [1, 2, 3]) {
    assert.equal(newRecordNotebookQuestionSchema.safeParse({ ...question, part }).success, true);
  }
  assert.equal(newRecordNotebookQuestionSchema.safeParse({ ...question, part: 4 }).success, false);
});

test("normalizes case and repeated whitespace for duplicate checks", () => {
  assert.equal(normalizeLearningItem("  Keep   Up WITH "), "keep up with");
});

test("keeps the first learning item when normalized keys repeat", () => {
  const items = [{ word: "However" }, { word: " however " }, { word: "Moreover" }];
  assert.deepEqual(uniqueLearningItems(items, (item) => item.word), [items[0], items[2]]);
});
