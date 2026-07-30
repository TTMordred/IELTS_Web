import assert from "node:assert/strict";
import test from "node:test";
import { languageNoteInputSchema, masteryInputSchema } from "./validation.ts";

test("accepts each Phrase Bank kind", () => {
  for (const kind of ["idiom", "collocation", "linking_word"]) {
    assert.equal(languageNoteInputSchema.safeParse({ kind, phrase: "on the other hand", meaning: "contrast", topic: "Websites" }).success, true);
  }
});

test("rejects an unknown Phrase Bank kind", () => {
  assert.equal(languageNoteInputSchema.safeParse({ kind: "vocabulary", phrase: "useful", meaning: "helpful" }).success, false);
});

test("rejects an empty phrase", () => {
  assert.equal(languageNoteInputSchema.safeParse({ kind: "idiom", phrase: " ", meaning: "continue" }).success, false);
});

test("accepts mastery only from zero to one hundred", () => {
  assert.equal(masteryInputSchema.safeParse({ id: crypto.randomUUID(), mastery: 100 }).success, true);
  assert.equal(masteryInputSchema.safeParse({ id: crypto.randomUUID(), mastery: 101 }).success, false);
});
