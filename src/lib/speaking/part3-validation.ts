import { z } from "zod";
import { PART3_ANSWER_FUNCTIONS } from "../constants/speaking-part3";
import type {
  DiscussionDevice,
  LanguageBank,
  Part3AnswerFunction,
  SupportingIdea,
} from "@/lib/types";
import { languageBankSchema } from "./language-bank";

const requiredText = z.string().trim().min(1, "This field is required");

export const supportingIdeaSchema = z.object({
  idea: requiredText,
  importance: z.enum(["essential", "optional"]),
});

/** A reusable discussion expression — mirrors Part 2's storytelling device. */
export const discussionDeviceSchema = z.object({
  expression: requiredText,
  meaningVi: requiredText,
  example: z.string().trim().optional(),
});

export const part3QuestionInputSchema = z.object({
  topicId: z.string().uuid().nullable().optional(),
  question: requiredText,
  topic: z.string().trim().optional(),
  answer_function: z.enum(PART3_ANSWER_FUNCTIONS as [Part3AnswerFunction, ...Part3AnswerFunction[]]),
  // Reasoning framework — always present (seeded from the function, editable).
  answer_structure: z.array(requiredText).min(1, "Add at least one step"),
  main_idea: requiredText,
  supporting_ideas: z.array(supportingIdeaSchema),
  alternative_view: z.string().trim().optional(),
  answer: requiredText,
  follow_up_ideas: z.array(z.string().trim()),
  // Reusable discussion expressions (mirrors Part 2's storytelling devices).
  discussion_devices: z.array(discussionDeviceSchema),
  // The 10-section Language Bank: structure required, content optional.
  language_bank: languageBankSchema,
});

export type Part3QuestionInput = z.infer<typeof part3QuestionInputSchema>;

/** Client-side draft question (id kept for list keys; topicId for the Part 3 filter). */
export type Part3QuestionDraft = {
  id: string;
  topicId: string | null;
  question: string;
  topic: string;
  answer_function: Part3AnswerFunction;
  answer_structure: string[];
  main_idea: string;
  supporting_ideas: SupportingIdea[];
  alternative_view: string;
  answer: string;
  follow_up_ideas: string[];
  discussion_devices: DiscussionDevice[];
  language_bank: LanguageBank;
};
