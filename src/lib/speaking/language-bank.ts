import { z } from "zod";
import type { LanguageBank } from "@/lib/types";
import {
  grammarFocusSchema,
  linkingWordSchema,
  phraseMeaningSchema,
  referencingSchema,
  sentencePatternSchema,
  synonymSchema,
  wordMeaningSchema,
} from "./notebook-validation";

/**
 * Shared 10-section Language Bank (Speaking Parts 2 & 3). The structure is
 * required; every section's contents are optional. Item shapes (and their
 * optional `meaningVi` gloss) come from the shared notebook-validation schemas.
 */
export const languageBankSchema = z.object({
  topic_specific_vocabulary: z.array(wordMeaningSchema),
  useful_vocabulary: z.array(wordMeaningSchema),
  advanced_adjectives_adverbs: z.array(wordMeaningSchema),
  idioms_phrasal_verbs: z.array(phraseMeaningSchema),
  collocations: z.array(phraseMeaningSchema),
  linking_words: z.array(linkingWordSchema),
  synonyms_paraphrasing: z.array(synonymSchema),
  referencing_devices: z.array(referencingSchema),
  sentence_patterns: z.array(sentencePatternSchema),
  grammar_focus: z.array(grammarFocusSchema),
});

export type LanguageBankInput = z.infer<typeof languageBankSchema>;

export function emptyLanguageBank(): LanguageBank {
  return {
    topic_specific_vocabulary: [],
    useful_vocabulary: [],
    advanced_adjectives_adverbs: [],
    idioms_phrasal_verbs: [],
    collocations: [],
    linking_words: [],
    synonyms_paraphrasing: [],
    referencing_devices: [],
    sentence_patterns: [],
    grammar_focus: [],
  };
}
