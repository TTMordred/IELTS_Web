"use client";

import { useRouter } from "next/navigation";
import { FlashcardSession, SessionStats } from "./flashcard-session";
import type { VocabCard } from "@/lib/types";

export function FlashcardSessionClient({ cards }: { cards: VocabCard[] }) {
  const router = useRouter();

  function handleComplete(_stats: SessionStats) {
    // Stats are shown inside FlashcardSession's own done screen.
    // This callback is available for future extension (e.g. analytics).
  }

  return <FlashcardSession cards={cards} onComplete={handleComplete} />;
}
