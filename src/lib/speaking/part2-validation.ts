import { z } from "zod";
import { CUE_CARD_TYPES } from "../constants/speaking-cue-card";
import type { CueCardType, LanguageBank, StorytellingDevice } from "@/lib/types";
import { emptyLanguageBank, languageBankSchema } from "./language-bank";

const requiredText = z.string().trim().min(1, "This field is required");

export const storytellingDeviceSchema = z.object({
  expression: requiredText,
  meaningVi: requiredText,
  example: z.string().trim().optional(),
});

export const part2CardInputSchema = z.object({
  topicId: z.string().uuid().nullable().optional(),
  cue_card: requiredText,
  cue_card_type: z.enum(CUE_CARD_TYPES as [CueCardType, ...CueCardType[]]),
  topic: z.string().trim().optional(),
  // Storytelling framework — always present (seeded from the type, editable).
  answer_structure: z.array(requiredText).min(1, "Add at least one step"),
  // Concise planning notes / outline keywords.
  key_ideas: z.array(requiredText).min(1, "Add at least one key idea"),
  answer: requiredText,
  follow_up_ideas: z.array(z.string().trim()),
  storytelling_devices: z.array(storytellingDeviceSchema),
  // The 10-section Language Bank: structure required, content optional.
  language_bank: languageBankSchema,
});

export type Part2CardInput = z.infer<typeof part2CardInputSchema>;

/** Client-side draft card (id kept for list keys; topicId for the Part 3 filter). */
export type Part2CardDraft = {
  id: string;
  topicId: string | null;
  cue_card: string;
  cue_card_type: CueCardType;
  topic: string;
  answer_structure: string[];
  key_ideas: string[];
  answer: string;
  follow_up_ideas: string[];
  storytelling_devices: StorytellingDevice[];
  language_bank: LanguageBank;
};

export { emptyLanguageBank };
