import { z } from "zod";

export const languageNoteInputSchema = z.object({
  kind: z.enum(["idiom", "collocation", "linking_word"]),
  phrase: z.string().trim().min(1, "Phrase is required"),
  meaning: z.string().trim().min(1, "Meaning or function is required"),
  topic: z.string().trim().optional().default(""),
  source: z.string().trim().optional().default("Manual entry"),
});

export const masteryInputSchema = z.object({
  id: z.string().uuid(),
  mastery: z.number().int().min(0).max(100),
});

export type LanguageNoteInput = z.infer<typeof languageNoteInputSchema>;
