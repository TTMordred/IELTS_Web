"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { reviewVocabCard } from "@/app/(app)/vocab/review/actions";
import { Badge } from "@/components/ui/badge";
import type { VocabCard } from "@/lib/types";
import { Check, X, SkipForward, ArrowLeft, RotateCcw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export type SessionStats = {
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
};

interface FlashcardSessionProps {
  cards: VocabCard[];
  onComplete: (stats: SessionStats) => void;
}

export function FlashcardSession({ cards, onComplete }: FlashcardSessionProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState<SessionStats>({
    correct: 0,
    wrong: 0,
    skipped: 0,
    total: cards.length,
  });
  const [done, setDone] = useState(false);
  const [animating, setAnimating] = useState(false);

  const card = cards[currentIndex];
  const total = cards.length;

  const advance = useCallback(() => {
    setFlipped(false);
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      if (currentIndex + 1 >= total) {
        setDone(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 150);
  }, [currentIndex, total]);

  const handleAnswer = useCallback(
    async (remembered: boolean) => {
      if (!card || !flipped) return;
      setStats((prev) => ({
        ...prev,
        correct: prev.correct + (remembered ? 1 : 0),
        wrong: prev.wrong + (remembered ? 0 : 1),
      }));
      try {
        await reviewVocabCard(card.id, remembered);
      } catch (err) {
        console.error(err);
      }
      advance();
    },
    [card, flipped, advance]
  );

  const handleSkip = useCallback(() => {
    if (!card) return;
    setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
    advance();
  }, [card, advance]);

  const handleFlip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (e.key === " ") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowLeft" && flipped) {
        handleAnswer(false);
      } else if (e.key === "ArrowRight" && flipped) {
        handleAnswer(true);
      } else if (e.key === "ArrowUp" && flipped) {
        handleSkip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, flipped, handleFlip, handleAnswer, handleSkip]);

  // Call onComplete when done
  useEffect(() => {
    if (done) {
      onComplete(stats);
    }
  }, [done, stats, onComplete]);

  if (total === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-8 h-8 text-[var(--color-ink-muted)]" />
        </div>
        <h1 className="heading-lg mb-2">No cards found</h1>
        <p className="text-[var(--color-ink-secondary)] mb-6">
          Try a different filter or add more vocab cards.
        </p>
        <Link
          href="/vocab/flashcard"
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          Change settings
        </Link>
      </div>
    );
  }

  if (done) {
    const accuracy = total > 0 ? Math.round((stats.correct / (stats.correct + stats.wrong || 1)) * 100) : 0;
    const xpEarned = stats.correct * 3;
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-[var(--color-accent)]" />
        </div>
        <h1 className="heading-lg mb-2">Session Complete!</h1>
        <p className="text-[var(--color-ink-secondary)] mb-6">
          You reviewed {total} cards.
        </p>
        <div className="flex justify-center gap-6 my-6">
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-[var(--color-accent)]">{stats.correct}</p>
            <p className="text-xs text-[var(--color-ink-muted)]">Got it</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-red-500">{stats.wrong}</p>
            <p className="text-xs text-[var(--color-ink-muted)]">Forgot</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-[var(--color-ink-muted)]">{stats.skipped}</p>
            <p className="text-xs text-[var(--color-ink-muted)]">Skipped</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-[var(--color-ink)]">{accuracy}%</p>
            <p className="text-xs text-[var(--color-ink-muted)]">Accuracy</p>
          </div>
        </div>
        <p className="text-sm text-[var(--color-ink-muted)] mb-8">
          +{xpEarned} XP earned
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/vocab/flashcard"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Play again
          </Link>
          <Link
            href="/vocab"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <LayoutDashboard className="w-4 h-4" /> Back to vault
          </Link>
        </div>
      </div>
    );
  }

  const masteryPct = card?.mastery ?? 0;

  return (
    <div
      className="max-w-lg mx-auto space-y-5 animate-fade-in-up"
      style={{ opacity: animating ? 0 : 1, transition: "opacity 0.15s" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/vocab/flashcard"
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Settings
        </Link>
        <span className="text-sm text-[var(--color-ink-muted)] font-mono">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${(currentIndex / total) * 100}%` }}
        />
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleFlip()}
        className="cursor-pointer"
        style={{ perspective: "1000px" }}
        aria-label={flipped ? "Card showing answer, click to flip back" : "Card showing word, click to reveal answer"}
      >
        <div
          style={{
            transition: "transform 0.4s",
            transformStyle: "preserve-3d",
            position: "relative",
            height: "280px",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front face */}
          <div
            className="card-base p-8 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              position: "absolute",
              inset: 0,
            }}
          >
            {card?.topic && (
              <div className="absolute top-4 right-4">
                <Badge variant="default">{card.topic}</Badge>
              </div>
            )}
            <p className="text-3xl font-bold text-[var(--color-ink)] mb-3 leading-tight">
              {card?.word}
            </p>
            {card?.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mb-3">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-[var(--color-ink-muted)] mt-2">
              Tap to flip · <kbd className="font-mono">Space</kbd>
            </p>
            {/* Mastery bar */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--color-ink-muted)]">Mastery</span>
                <span className="text-xs font-mono text-[var(--color-ink-muted)]">{masteryPct}%</span>
              </div>
              <div className="w-full h-1 rounded-full bg-[var(--color-line)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${masteryPct}%`,
                    backgroundColor:
                      masteryPct >= 80
                        ? "var(--color-accent)"
                        : masteryPct >= 50
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Back face */}
          <div
            className="card-base p-8 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              position: "absolute",
              inset: 0,
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-sm text-[var(--color-ink-muted)] mb-3 font-medium">{card?.word}</p>
            <p className="text-xl font-semibold text-[var(--color-ink)] mb-4 leading-snug max-w-xs">
              {card?.meaning}
            </p>
            {card?.example && (
              <p className="text-sm text-[var(--color-ink-secondary)] italic max-w-sm leading-relaxed">
                &ldquo;{card.example}&rdquo;
              </p>
            )}
            {card?.source && (
              <p className="absolute bottom-4 text-xs text-[var(--color-ink-muted)]">
                Source: {card.source}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons — appear after flip */}
      <div
        className="flex gap-3 transition-all duration-200"
        style={{ opacity: flipped ? 1 : 0, pointerEvents: flipped ? "auto" : "none" }}
      >
        <button
          onClick={() => handleAnswer(false)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-red-500/10 text-red-500 font-medium text-sm hover:bg-red-500/20 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" /> Forgot
        </button>
        <button
          onClick={handleSkip}
          className="py-3 px-4 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] text-sm hover:bg-[var(--color-line)] transition-colors cursor-pointer"
          title="Skip (↑)"
        >
          <SkipForward className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500/10 text-emerald-500 font-medium text-sm hover:bg-emerald-500/20 transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" /> Got it
        </button>
      </div>

      {/* Keyboard hint */}
      {flipped && (
        <p className="text-center text-xs text-[var(--color-ink-muted)]">
          <kbd className="font-mono">←</kbd> Forgot &nbsp;·&nbsp;{" "}
          <kbd className="font-mono">↑</kbd> Skip &nbsp;·&nbsp;{" "}
          <kbd className="font-mono">→</kbd> Got it
        </p>
      )}

      {/* Live stats */}
      <div className="flex justify-center gap-6 text-xs text-[var(--color-ink-muted)]">
        <span className="text-emerald-500">{stats.correct} correct</span>
        <span className="text-red-500">{stats.wrong} wrong</span>
        <span className="text-[var(--color-ink-muted)]">{stats.skipped} skipped</span>
        <span>{total - currentIndex - 1} remaining</span>
      </div>
    </div>
  );
}
