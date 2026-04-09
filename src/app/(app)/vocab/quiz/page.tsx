import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Brain, PencilLine, BookOpen, Calendar, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import { getQuizCards, getVocabTopics } from "./actions";
import { QuizSessionWrapper } from "./quiz-session-wrapper";

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchParams = {
  mode?: string;
  filter?: string;
  topic?: string;
  limit?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

// ─── Config UI ────────────────────────────────────────────────────────────────

async function QuizConfig() {
  const topics = await getVocabTopics();

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center">
        <h1 className="heading-lg mb-2">Vocab Quiz</h1>
        <p className="text-[var(--color-ink-muted)] text-sm">
          Test your knowledge with interactive quizzes
        </p>
      </div>

      <form action="/vocab/quiz" method="GET" className="space-y-6">
        {/* Mode */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Quiz Mode
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="multiple-choice"
                defaultChecked
                className="sr-only peer"
              />
              <div className="card-base p-4 flex flex-col items-center gap-2 text-center border-2 border-transparent peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent-light)] transition-all duration-200 hover:border-[var(--color-accent)]/50 cursor-pointer">
                <Brain className="w-6 h-6 text-[var(--color-accent)]" />
                <span className="text-sm font-semibold text-[var(--color-ink)]">Multiple Choice</span>
                <span className="text-xs text-[var(--color-ink-muted)]">Pick the right meaning</span>
              </div>
            </label>
            <label className="relative cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="fill-in-blank"
                className="sr-only peer"
              />
              <div className="card-base p-4 flex flex-col items-center gap-2 text-center border-2 border-transparent peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent-light)] transition-all duration-200 hover:border-[var(--color-accent)]/50 cursor-pointer">
                <PencilLine className="w-6 h-6 text-[var(--color-accent)]" />
                <span className="text-sm font-semibold text-[var(--color-ink)]">Fill in the Blank</span>
                <span className="text-xs text-[var(--color-ink-muted)]">Type the missing word</span>
              </div>
            </label>
          </div>
        </div>

        {/* Filter */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Card Filter
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "all", label: "All Cards", icon: <BookOpen className="w-4 h-4" /> },
              { value: "due", label: "Due Today", icon: <Calendar className="w-4 h-4" /> },
              { value: "weak", label: "Weak Cards", icon: <Flame className="w-4 h-4" /> },
              { value: "new", label: "New Cards", icon: <Sparkles className="w-4 h-4" /> },
            ].map(({ value, label, icon }) => (
              <label key={value} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="filter"
                  value={value}
                  defaultChecked={value === "all"}
                  className="sr-only peer"
                />
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-card)] peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent-light)] transition-all duration-200 hover:border-[var(--color-accent)]/50 cursor-pointer">
                  <span className="text-[var(--color-accent)]">{icon}</span>
                  <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Topic */}
        {topics.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Topic (optional)
            </p>
            <select
              name="topic"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm outline-none focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)] transition-all duration-200"
            >
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Count */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Number of Questions
          </p>
          <div className="flex gap-2">
            {[
              { value: "10", label: "10" },
              { value: "20", label: "20" },
              { value: "50", label: "50" },
              { value: "999", label: "All" },
            ].map(({ value, label }) => (
              <label key={value} className="relative flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="limit"
                  value={value}
                  defaultChecked={value === "20"}
                  className="sr-only peer"
                />
                <div className="text-center px-3 py-2.5 rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-card)] peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent-light)] text-sm font-semibold text-[var(--color-ink)] transition-all duration-200 hover:border-[var(--color-accent)]/50 cursor-pointer">
                  {label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Start */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer shadow-[var(--shadow-accent)]"
        >
          Start Quiz
        </button>

        <p className="text-center text-xs text-[var(--color-ink-muted)]">
          Or{" "}
          <Link href="/vocab/review" className="text-[var(--color-accent)] hover:underline">
            go to flashcard review
          </Link>
        </p>
      </form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VocabQuizPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { mode, filter, topic, limit } = params;

  // Validate mode — if present must be valid
  const validMode = mode === "multiple-choice" || mode === "fill-in-blank";

  // If no mode param, show config UI
  if (!mode || !validMode) {
    return (
      <div className="px-4 py-8">
        <Suspense fallback={<div className="max-w-lg mx-auto py-20 text-center text-[var(--color-ink-muted)]">Loading…</div>}>
          <QuizConfig />
        </Suspense>
      </div>
    );
  }

  // Validate + parse params
  const quizMode = mode as "multiple-choice" | "fill-in-blank";
  const quizFilter = (filter === "due" || filter === "weak" || filter === "new") ? filter : "all";
  const quizTopic = topic || undefined;
  const quizLimit = Math.min(Math.max(parseInt(limit ?? "20", 10) || 20, 4), 999);

  const cards = await getQuizCards(quizFilter, quizTopic, quizLimit);

  // If 0 cards after fetch, redirect to config with no params
  if (cards.length === 0) {
    redirect("/vocab/quiz");
  }

  return (
    <div className="px-4 py-8">
      <QuizSessionWrapper cards={cards} mode={quizMode} />
    </div>
  );
}
