import { getFlashcardCards, getVocabTopics } from "./actions";
import { FlashcardSessionClient } from "@/components/vocab/flashcard-session-client";
import { Zap } from "lucide-react";
import type { VocabCard } from "@/lib/types";

type Filter = "all" | "due" | "weak" | "new";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "due", label: "Due Today" },
  { value: "weak", label: "Weak" },
  { value: "new", label: "New" },
];

const COUNT_OPTIONS = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

interface PageProps {
  searchParams: Promise<{ filter?: string; topic?: string; limit?: string }>;
}

export default async function FlashcardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hasSession = !!params.filter;

  const topics = await getVocabTopics();

  if (hasSession) {
    const filter = (["all", "due", "weak", "new"].includes(params.filter ?? "")
      ? params.filter
      : "all") as Filter;
    const limit = Math.min(Math.max(1, parseInt(params.limit ?? "20", 10)), 100);
    const topic = params.topic && params.topic !== "all" ? params.topic : undefined;

    const cards: VocabCard[] = await getFlashcardCards(filter, topic, limit);

    return (
      <div className="animate-fade-in-up">
        <FlashcardSessionClient cards={cards} />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Zap className="w-6 h-6 text-[var(--color-accent)]" />
          Flashcard Mode
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Configure your session and start reviewing.
        </p>
      </div>

      <FlashcardConfig topics={topics} />
    </div>
  );
}

function FlashcardConfig({ topics }: { topics: string[] }) {
  return (
    <form action="/vocab/flashcard" method="GET" className="space-y-6">
      {/* Filter pills */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--color-ink)]">Filter</p>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                name="filter"
                value={opt.value}
                defaultChecked={opt.value === "all"}
                className="sr-only peer"
              />
              <span className="block px-4 py-1.5 rounded-full border border-[var(--color-line)] text-sm text-[var(--color-ink-muted)] peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent)]/10 peer-checked:text-[var(--color-accent)] peer-checked:font-medium transition-colors hover:border-[var(--color-accent)]/50 select-none">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div className="space-y-2">
        <label htmlFor="topic" className="text-sm font-medium text-[var(--color-ink)]">
          Topic
        </label>
        <select
          id="topic"
          name="topic"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
        >
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Count */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--color-ink)]">Cards per session</p>
        <div className="flex gap-2">
          {COUNT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex-1 text-center cursor-pointer">
              <input
                type="radio"
                name="limit"
                value={opt.value}
                defaultChecked={opt.value === "20"}
                className="sr-only peer"
              />
              <span className="block py-2 rounded-lg border border-[var(--color-line)] text-sm text-[var(--color-ink-muted)] peer-checked:border-[var(--color-accent)] peer-checked:text-[var(--color-accent)] peer-checked:font-medium transition-colors hover:border-[var(--color-accent)]/50 select-none">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-base hover:opacity-90 transition-opacity cursor-pointer"
      >
        Start Session
      </button>
    </form>
  );
}
