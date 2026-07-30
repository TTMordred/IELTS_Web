"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import {
  addLanguageNote,
  deleteLanguageNote,
  updateLanguageNoteMastery,
} from "@/app/(app)/phrase-bank/actions";
import type { LanguageNote, LanguageNoteKind } from "@/lib/types";

const TABS: { id: LanguageNoteKind; label: string }[] = [
  { id: "idiom", label: "Idioms & Phrasal Verbs" },
  { id: "collocation", label: "Collocations" },
  { id: "linking_word", label: "Linking Words" },
];

export function PhraseBankBoard({ initialNotes }: { initialNotes: LanguageNote[] }) {
  const router = useRouter();
  const [activeKind, setActiveKind] = useState<LanguageNoteKind>("idiom");
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [meaning, setMeaning] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const topics = useMemo(
    () => [...new Set(initialNotes.map((note) => note.topic).filter((value): value is string => Boolean(value)))].toSorted(),
    [initialNotes],
  );
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("en");
    return initialNotes.filter((note) =>
      note.kind === activeKind
      && (!topic || note.topic === topic)
      && (!needle || `${note.phrase} ${note.meaning}`.toLocaleLowerCase("en").includes(needle))
    );
  }, [activeKind, initialNotes, search, topic]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await addLanguageNote({
          kind: activeKind,
          phrase,
          meaning,
          topic: newTopic,
          source: "Manual entry",
        });
        setMessage(result.created ? "Added to Phrase Bank" : "This item already exists");
        if (result.created) {
          setPhrase("");
          setMeaning("");
          setNewTopic("");
          setShowForm(false);
          router.refresh();
        }
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Failed to add item");
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm("Delete this Phrase Bank item?")) return;
    startTransition(async () => {
      try {
        await deleteLanguageNote(id);
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Failed to delete item");
      }
    });
  }

  function changeMastery(id: string, mastery: number) {
    startTransition(async () => {
      try {
        await updateLanguageNoteMastery(id, mastery);
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Failed to update mastery");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-line)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveKind(tab.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeKind === tab.id
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search phrases and meanings..."
            aria-label="Search Phrase Bank"
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </label>
        <select value={topic} onChange={(event) => setTopic(event.target.value)} aria-label="Filter by topic" className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm">
          <option value="">All topics</option>
          {topics.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Item"}
        </button>
      </div>

      {message ? <p role="status" className="rounded-lg bg-[var(--color-accent-light)] px-3 py-2 text-sm text-[var(--color-ink-secondary)]">{message}</p> : null}

      {showForm ? (
        <form onSubmit={submit} className="card-base grid gap-3 p-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Phrase or Word</span>
            <input value={phrase} onChange={(event) => setPhrase(event.target.value)} required className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Meaning or Function</span>
            <input value={meaning} onChange={(event) => setMeaning(event.target.value)} required className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Topic (optional)</span>
            <input value={newTopic} onChange={(event) => setNewTopic(event.target.value)} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm" />
          </label>
          <div className="flex justify-end sm:col-span-2">
            <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {pending ? "Adding..." : "Add to Phrase Bank"}
            </button>
          </div>
        </form>
      ) : null}

      <p className="text-xs text-[var(--color-ink-muted)]">{filtered.length} items</p>

      {filtered.length === 0 ? (
        <div className="card-base p-10 text-center">
          <BookOpenText className="mx-auto h-10 w-10 text-[var(--color-ink-muted)]" />
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">No items match this view.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((note) => (
            <article key={note.id} className="card-interactive p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[var(--color-ink)]">{note.phrase}</h3>
                  <p className="mt-1 text-sm text-[var(--color-ink-secondary)]">{note.meaning}</p>
                </div>
                <button type="button" onClick={() => remove(note.id)} aria-label={`Delete ${note.phrase}`} className="text-[var(--color-ink-muted)] hover:text-[var(--color-critical)]"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-ink-muted)]">
                {note.topic ? <span className="rounded-full bg-[var(--color-accent-light)] px-2 py-1 text-[var(--color-accent)]">{note.topic}</span> : null}
                {note.source ? <span className="truncate">{note.source}</span> : null}
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                Mastery
                <select value={note.mastery_level} onChange={(event) => changeMastery(note.id, Number(event.target.value))} disabled={pending} className="rounded border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-1">
                  {[0, 25, 50, 75, 100].map((value) => <option key={value} value={value}>{value}%</option>)}
                </select>
              </label>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
