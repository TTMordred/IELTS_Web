import { getVocabCards } from "./actions";
import { VocabList } from "@/components/vocab/vocab-list";
import { BookMarked, BookOpen, Brain, PenLine } from "lucide-react";
import Link from "next/link";

export default async function VocabPage() {
  const cards = await getVocabCards();

  const today = new Date().toISOString().slice(0, 10);
  const dueCount = cards.filter(c => !c.next_review || c.next_review <= today).length;
  const weakCount = cards.filter(c => c.mastery < 50 && c.review_count > 0).length;
  const masteredCount = cards.filter(c => c.mastery >= 80).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-[var(--color-accent)]" />
          Vocab Bank
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          {cards.length} words collected
        </p>
      </div>

      {/* Practice Hub */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-1">Practice</h2>
        <p className="text-sm text-[var(--color-ink-secondary)] mb-4">Choose how you want to study today</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Flashcard */}
          <Link href="/vocab/flashcard" className="group p-4 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--color-accent)]/20 transition-colors">
              <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h3 className="font-semibold text-sm text-[var(--color-ink)] mb-1">Flashcards</h3>
            <p className="text-xs text-[var(--color-ink-muted)]">Flip cards with spaced repetition</p>
          </Link>

          {/* Multiple Choice */}
          <Link href="/vocab/quiz?mode=multiple-choice" className="group p-4 rounded-xl border border-[var(--color-line)] hover:border-[#378ADD] hover:bg-[#378ADD]/5 transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#378ADD]/10 flex items-center justify-center mb-3 group-hover:bg-[#378ADD]/20 transition-colors">
              <Brain className="w-5 h-5 text-[#378ADD]" />
            </div>
            <h3 className="font-semibold text-sm text-[var(--color-ink)] mb-1">Multiple Choice</h3>
            <p className="text-xs text-[var(--color-ink-muted)]">Pick the correct meaning</p>
          </Link>

          {/* Fill in blank */}
          <Link href="/vocab/quiz?mode=fill-in-blank" className="group p-4 rounded-xl border border-[var(--color-line)] hover:border-[#D85A30] hover:bg-[#D85A30]/5 transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#D85A30]/10 flex items-center justify-center mb-3 group-hover:bg-[#D85A30]/20 transition-colors">
              <PenLine className="w-5 h-5 text-[#D85A30]" />
            </div>
            <h3 className="font-semibold text-sm text-[var(--color-ink)] mb-1">Fill in Blank</h3>
            <p className="text-xs text-[var(--color-ink-muted)]">Type the missing word</p>
          </Link>
        </div>

        {/* Quick stats row */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-[var(--color-line)] text-sm">
          <span className="text-[var(--color-ink-muted)]"><span className="font-semibold text-[var(--color-ink)]">{dueCount}</span> due today</span>
          <span className="text-[var(--color-ink-muted)]"><span className="font-semibold text-[var(--color-ink)]">{weakCount}</span> need work</span>
          <span className="text-[var(--color-ink-muted)]"><span className="font-semibold text-[var(--color-ink)]">{masteredCount}</span> mastered</span>
        </div>
      </div>

      <VocabList initialCards={cards} />
    </div>
  );
}
