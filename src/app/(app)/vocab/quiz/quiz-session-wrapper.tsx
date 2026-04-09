"use client";

import { QuizSession, QuizMode } from "@/components/vocab/quiz-session";
import type { VocabCard } from "@/lib/types";

type Props = {
  cards: VocabCard[];
  mode: QuizMode;
};

export function QuizSessionWrapper({ cards, mode }: Props) {
  // onComplete is handled inside QuizSession (CompletionScreen shows replay/back buttons)
  return (
    <QuizSession
      cards={cards}
      mode={mode}
      onComplete={() => {}}
    />
  );
}
