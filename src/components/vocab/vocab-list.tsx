"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { addVocabCard, deleteVocabCard } from "@/app/(app)/vocab/actions";
import { createClient } from "@/lib/supabase/client";
import type { VocabCard } from "@/lib/types";
import { Plus, Trash2, Search, X } from "lucide-react";
import { InlineEditField } from "@/components/ui/inline-edit-field";

export function VocabList({ initialCards }: { initialCards: VocabCard[] }) {
  const [cards, setCards] = useState(initialCards);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [topic, setTopic] = useState("");

  // DB topic suggestions
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("global_topics")
      .select("name")
      .eq("module", "vocab")
      .order("name")
      .then(({ data }) => {
        if (data) setTopicSuggestions(data.map((t) => t.name));
      });
  }, []);

  const filtered = search
    ? cards.filter(
        (c) =>
          c.word.toLowerCase().includes(search.toLowerCase()) ||
          c.meaning.toLowerCase().includes(search.toLowerCase())
      )
    : cards;

  async function handleAdd() {
    if (!word.trim() || !meaning.trim()) return;
    setLoading(true);
    try {
      await addVocabCard({
        word: word.trim(),
        meaning: meaning.trim(),
        example: example.trim(),
        topic: topic.trim(),
        tags: [],
        source: "",
      });
      // Reset form
      setWord("");
      setMeaning("");
      setExample("");
      setTopic("");
      setShowForm(false);
      // Optimistic update
      setCards((prev) => [
        {
          id: crypto.randomUUID(),
          user_id: "",
          word: word.trim(),
          meaning: meaning.trim(),
          example: example.trim(),
          topic: topic.trim(),
          tags: [],
          mastery: 0,
          next_review: null,
          review_count: 0,
          source: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteVocabCard(id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
        <Button
          variant={showForm ? "secondary" : "primary"}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Word"}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card-base p-5 space-y-3 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Word / Phrase"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. take into account"
              required
            />
            <Input
              label="Meaning"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Vietnamese meaning"
              required
            />
          </div>
          <Input
            label="Example (optional)"
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="Example sentence"
          />
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">Topic (optional)</label>
            <input
              type="text"
              list="vocab-topic-suggestions"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Education, Environment"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <datalist id="vocab-topic-suggestions">
              {topicSuggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAdd} variant="primary" loading={loading}>
              Save Word
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-sm text-[var(--color-ink-muted)]">
        <span>{filtered.length} words</span>
        <span>{cards.filter((c) => c.mastery >= 80).length} mastered</span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card-base p-12 text-center">
          <p className="text-[var(--color-ink-muted)]">
            {search ? "No words match your search" : "No vocab cards yet. Add your first word!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((card) => (
            <div key={card.id} className="card-base p-4 flex items-start gap-4 group">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-ink)]">
                  <InlineEditField
                    table="vocab_cards"
                    id={card.id}
                    field="word"
                    value={card.word}
                    placeholder="Word"
                    displayClassName="font-medium text-[var(--color-ink)]"
                  />
                </p>
                <p className="text-sm text-[var(--color-ink-secondary)]">
                  <InlineEditField
                    table="vocab_cards"
                    id={card.id}
                    field="meaning"
                    value={card.meaning}
                    placeholder="Meaning"
                    displayClassName="text-sm text-[var(--color-ink-secondary)]"
                  />
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] italic mt-1">
                  <InlineEditField
                    table="vocab_cards"
                    id={card.id}
                    field="example"
                    value={card.example}
                    placeholder="Add example..."
                    displayClassName="text-xs text-[var(--color-ink-muted)] italic"
                  />
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {card.topic && <Badge variant="default">{card.topic}</Badge>}
                <div className="w-12 h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)]"
                    style={{ width: `${card.mastery}%` }}
                  />
                </div>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-[var(--color-ink-muted)] hover:text-red-500 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
