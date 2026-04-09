"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { reviewVocabCard } from "@/app/(app)/vocab/review/actions";
import type { VocabCard } from "@/lib/types";
import { Check, X, ArrowLeft, RotateCcw, Trophy, BookMarked } from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuizMode = "multiple-choice" | "fill-in-blank";

type QuizStats = { correct: number; wrong: number; total: number };

type Props = {
  cards: VocabCard[];
  mode: QuizMode;
  onComplete: (stats: QuizStats) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scrambleMeaning(meaning: string): string {
  const words = meaning.split(" ");
  if (words.length <= 1) return meaning.slice(0, -1) + "s";
  return shuffle(words).join(" ");
}

function getDistractors(correctCard: VocabCard, allCards: VocabCard[], count = 3): string[] {
  const pool = shuffle(allCards.filter((c) => c.id !== correctCard.id).map((c) => c.meaning));
  const distractors = [...pool];

  // Pad with scrambled versions if not enough
  while (distractors.length < count) {
    const base = allCards[distractors.length % allCards.length]?.meaning ?? correctCard.meaning;
    distractors.push(scrambleMeaning(base));
  }

  return distractors.slice(0, count);
}

function buildOptions(card: VocabCard, allCards: VocabCard[]): string[] {
  const distractors = getDistractors(card, allCards, 3);
  return shuffle([card.meaning, ...distractors]);
}

function buildSentencePrompt(card: VocabCard): string {
  if (card.example) {
    // Replace the word (case-insensitive) with ___
    const regex = new RegExp(`\\b${card.word}\\b`, "gi");
    const replaced = card.example.replace(regex, "___");
    // If replacement happened, use it; otherwise just blank the whole sentence
    if (replaced.includes("___")) return replaced;
  }
  // Fallback: ask by meaning
  return `What word means: "${card.meaning}"?`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
      <div
        className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  );
}

function CompletionScreen({
  stats,
  onReplay,
}: {
  stats: QuizStats;
  onReplay: () => void;
}) {
  const router = useRouter();
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const xp = stats.correct * 3;

  return (
    <div className="max-w-md mx-auto text-center py-20 animate-fade-in-up">
      <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
        <Trophy className="w-8 h-8 text-[var(--color-accent)]" />
      </div>
      <h1 className="heading-lg mb-2">Quiz Complete!</h1>
      <p className="text-[var(--color-ink-muted)] mb-6">
        You answered {stats.total} question{stats.total !== 1 ? "s" : ""}
      </p>

      <div className="card-base p-6 mb-6">
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold font-mono text-emerald-500">{stats.correct}</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold font-mono text-[var(--color-critical)]">{stats.wrong}</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">Wrong</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold font-mono text-[var(--color-ink)]">{accuracy}%</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">Accuracy</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
          <p className="text-sm font-medium text-[var(--color-accent)]">+{xp} XP earned</p>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => router.push("/vocab")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-ink)] text-sm font-medium hover:bg-[var(--color-line)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Vocab Bank
        </button>
        <button
          onClick={onReplay}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
      </div>
    </div>
  );
}

// ─── Multiple Choice ──────────────────────────────────────────────────────────

type MCState = "idle" | "correct" | "wrong";

function MultipleChoiceQuestion({
  card,
  allCards,
  onAnswer,
}: {
  card: VocabCard;
  allCards: VocabCard[];
  onAnswer: (correct: boolean) => void;
}) {
  const [options] = useState(() => buildOptions(card, allCards));
  const [selected, setSelected] = useState<string | null>(null);
  const [state, setState] = useState<MCState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (state !== "idle") return;
      const map: Record<string, number> = {
        "1": 0, "a": 0,
        "2": 1, "b": 1,
        "3": 2, "c": 2,
        "4": 3, "d": 3,
      };
      const idx = map[e.key.toLowerCase()];
      if (idx !== undefined && idx < options.length) {
        handleSelect(options[idx]);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, state]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function handleSelect(option: string) {
    if (state !== "idle") return;
    const isCorrect = option === card.meaning;
    setSelected(option);
    setState(isCorrect ? "correct" : "wrong");

    timerRef.current = setTimeout(() => {
      onAnswer(isCorrect);
    }, 1200);
  }

  const labels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Word */}
      <div className="card-base p-8 text-center">
        <p className="text-3xl font-bold text-[var(--color-ink)] mb-2">{card.word}</p>
        {card.topic && (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-[var(--color-accent-light)] text-[var(--color-accent-text)]">
            {card.topic}
          </span>
        )}
        <p className="text-xs text-[var(--color-ink-muted)] mt-3">Choose the correct meaning</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, i) => {
          let borderColor = "border-[var(--color-line)]";
          let bg = "bg-[var(--color-card)]";
          let textColor = "text-[var(--color-ink)]";
          let icon: React.ReactNode = null;

          if (selected !== null) {
            if (option === card.meaning) {
              // Always highlight correct answer
              borderColor = "border-emerald-500";
              bg = "bg-emerald-500/10";
              textColor = "text-emerald-600";
              icon = <Check className="w-4 h-4 text-emerald-500 shrink-0" />;
            } else if (option === selected && selected !== card.meaning) {
              borderColor = "border-red-500";
              bg = "bg-red-500/10";
              textColor = "text-red-600";
              icon = <X className="w-4 h-4 text-red-500 shrink-0" />;
            }
          } else if (selected === option) {
            borderColor = "border-[var(--color-accent)]";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={state !== "idle"}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-medium text-left transition-all duration-200 cursor-pointer disabled:cursor-default ${borderColor} ${bg} ${textColor} ${state === "idle" ? "hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)]" : ""}`}
            >
              <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                {labels[i]}
              </span>
              <span className="flex-1">{option}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-[var(--color-ink-muted)]">
        Press <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-ink)] font-mono">1</kbd>–<kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-ink)] font-mono">4</kbd> or <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-ink)] font-mono">A</kbd>–<kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-ink)] font-mono">D</kbd> to select
      </p>
    </div>
  );
}

// ─── Fill in the Blank ────────────────────────────────────────────────────────

type FIBState = "idle" | "correct" | "wrong";

function FillInBlankQuestion({
  card,
  onAnswer,
}: {
  card: VocabCard;
  onAnswer: (correct: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<FIBState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prompt = buildSentencePrompt(card);

  useEffect(() => {
    inputRef.current?.focus();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function handleSubmit() {
    if (state !== "idle" || !value.trim()) return;
    const isCorrect = value.trim().toLowerCase() === card.word.toLowerCase();
    setState(isCorrect ? "correct" : "wrong");

    timerRef.current = setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Sentence prompt */}
      <div className="card-base p-8 text-center">
        <p className="text-lg font-medium text-[var(--color-ink)] leading-relaxed">{prompt}</p>
        {card.topic && (
          <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-xs bg-[var(--color-accent-light)] text-[var(--color-accent-text)]">
            {card.topic}
          </span>
        )}
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={state !== "idle"}
            placeholder="Type your answer…"
            className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium outline-none transition-all duration-200
              bg-[var(--color-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]
              ${state === "idle"
                ? "border-[var(--color-line)] focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)]"
                : state === "correct"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                  : "border-red-500 bg-red-500/10 text-red-600"
              }`}
          />
          {state === "correct" && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          )}
          {state === "wrong" && (
            <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
          )}
        </div>

        {/* Feedback */}
        {state === "wrong" && (
          <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in-up">
            <p className="text-sm text-red-600">
              Correct answer: <span className="font-semibold">{card.word}</span>
            </p>
          </div>
        )}

        {state === "idle" && (
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Submit
          </button>
        )}
      </div>

      <p className="text-center text-xs text-[var(--color-ink-muted)]">
        Press <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-ink)] font-mono">Enter</kbd> to submit
      </p>
    </div>
  );
}

// ─── Main QuizSession ─────────────────────────────────────────────────────────

export function QuizSession({ cards, mode, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<QuizStats>({ correct: 0, wrong: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [questionKey, setQuestionKey] = useState(0); // force re-mount on advance

  const total = cards.length;
  const card = cards[currentIndex];

  const handleAnswer = useCallback(
    async (isCorrect: boolean) => {
      const newStats = {
        correct: stats.correct + (isCorrect ? 1 : 0),
        wrong: stats.wrong + (isCorrect ? 0 : 1),
        total: stats.total + 1,
      };
      setStats(newStats);

      try {
        if (card) await reviewVocabCard(card.id, isCorrect);
      } catch {
        // non-blocking
      }

      if (currentIndex + 1 >= total) {
        setDone(true);
        onComplete(newStats);
      } else {
        setCurrentIndex((i) => i + 1);
        setQuestionKey((k) => k + 1);
      }
    },
    [card, currentIndex, total, stats, onComplete]
  );

  const handleReplay = useCallback(() => {
    setCurrentIndex(0);
    setStats({ correct: 0, wrong: 0, total: 0 });
    setDone(false);
    setQuestionKey((k) => k + 1);
  }, []);

  if (total === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in-up">
        <BookMarked className="w-12 h-12 text-[var(--color-ink-muted)] mx-auto mb-4" />
        <h1 className="heading-lg mb-2">No cards found</h1>
        <p className="text-[var(--color-ink-muted)] mb-6">
          Try a different filter or add more vocab cards.
        </p>
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
    return <CompletionScreen stats={stats} onReplay={handleReplay} />;
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/vocab"
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="text-sm text-[var(--color-ink-muted)] font-mono">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Progress */}
      <ProgressBar current={currentIndex} total={total} />

      {/* Stats bar */}
      <div className="flex justify-center gap-6 text-xs">
        <span className="text-emerald-500 font-medium">{stats.correct} correct</span>
        <span className="text-[var(--color-ink-muted)]">·</span>
        <span className="text-red-500 font-medium">{stats.wrong} wrong</span>
        <span className="text-[var(--color-ink-muted)]">·</span>
        <span className="text-[var(--color-ink-muted)]">{total - currentIndex - 1} remaining</span>
      </div>

      {/* Question — key forces remount/animation on each advance */}
      <div key={questionKey}>
        {mode === "multiple-choice" ? (
          <MultipleChoiceQuestion
            card={card}
            allCards={cards}
            onAnswer={handleAnswer}
          />
        ) : (
          <FillInBlankQuestion
            card={card}
            onAnswer={handleAnswer}
          />
        )}
      </div>
    </div>
  );
}
