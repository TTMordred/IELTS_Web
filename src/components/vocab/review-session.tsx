"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewVocabCard } from "@/app/(app)/vocab/review/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VocabCard } from "@/lib/types";
import { BookMarked, Check, X, SkipForward, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function ReviewSession({ cards }: { cards: VocabCard[] }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<{ correct: number; wrong: number }>({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);

  const card = cards[currentIndex];
  const total = cards.length;

  async function handleAnswer(remembered: boolean) {
    if (!card) return;
    setResults((prev) => ({
      correct: prev.correct + (remembered ? 1 : 0),
      wrong: prev.wrong + (remembered ? 0 : 1),
    }));

    try {
      await reviewVocabCard(card.id, remembered);
    } catch (err) {
      console.error(err);
    }

    advance();
  }

  function advance() {
    setFlipped(false);
    if (currentIndex + 1 >= total) {
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  if (total === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in-up">
        <BookMarked className="w-12 h-12 text-[var(--color-ink-muted)] mx-auto mb-4" />
        <h1 className="heading-lg mb-2">All caught up!</h1>
        <p className="text-[var(--color-ink-muted)] mb-6">No vocab cards due for review today.</p>
        <Link
          href="/vocab"
          className="text-sm text-[var(--color-accent)] hover:underline cursor-pointer"
        >
          Back to Vocab Bank
        </Link>
      </div>
    );
  }

  if (done) {
    const accuracy = total > 0 ? Math.round((results.correct / total) * 100) : 0;
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-[var(--color-accent)]" />
        </div>
        <h1 className="heading-lg mb-2">Session Complete!</h1>
        <div className="flex justify-center gap-6 my-6">
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-[var(--color-accent)]">{results.correct}</p>
            <p className="text-xs text-[var(--color-ink-muted)]">Remembered</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-[var(--color-critical)]">{results.wrong}</p>
            <p className="text-xs text-[var(--color-ink-muted)]">Forgot</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-[var(--color-ink)]">{accuracy}%</p>
            <p className="text-xs text-[var(--color-ink-muted)]">Accuracy</p>
          </div>
        </div>
        <p className="text-sm text-[var(--color-ink-muted)] mb-6">
          +{total * 3} XP earned
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => router.push("/vocab")}>
            <ArrowLeft className="w-4 h-4" /> Vocab Bank
          </Button>
          <Button variant="primary" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/vocab" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="text-sm text-[var(--color-ink-muted)] font-mono">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${((currentIndex) / total) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="w-full min-h-[240px] card-base p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md transition-shadow"
      >
        {!flipped ? (
          <>
            <p className="text-2xl font-semibold text-[var(--color-ink)] mb-2">{card.word}</p>
            {card.topic && <Badge variant="default">{card.topic}</Badge>}
            <p className="text-xs text-[var(--color-ink-muted)] mt-4">Tap to reveal</p>
          </>
        ) : (
          <>
            <p className="text-xs text-[var(--color-ink-muted)] mb-2">{card.word}</p>
            <p className="text-xl font-medium text-[var(--color-ink)] mb-3">{card.meaning}</p>
            {card.example && (
              <p className="text-sm text-[var(--color-ink-secondary)] italic max-w-sm">
                &ldquo;{card.example}&rdquo;
              </p>
            )}
            {card.source && (
              <p className="text-xs text-[var(--color-ink-muted)] mt-3">Source: {card.source}</p>
            )}
          </>
        )}
      </button>

      {/* Action buttons */}
      {flipped && (
        <div className="flex gap-3 animate-fade-in-up">
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-red-500/10 text-red-500 font-medium text-sm hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" /> Forgot
          </button>
          <button
            onClick={() => advance()}
            className="py-3 px-4 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] text-sm hover:bg-[var(--color-line)] transition-colors cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500/10 text-emerald-500 font-medium text-sm hover:bg-emerald-500/20 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" /> Remembered
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex justify-center gap-6 text-xs text-[var(--color-ink-muted)]">
        <span className="text-emerald-500">{results.correct} correct</span>
        <span className="text-red-500">{results.wrong} wrong</span>
        <span>{total - currentIndex - 1} remaining</span>
      </div>
    </div>
  );
}
