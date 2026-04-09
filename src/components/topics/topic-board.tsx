"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createTopic, toggleUpvote } from "@/app/(app)/topics/actions";
import type { GlobalTopic } from "@/lib/types";
import { Plus, Search, ThumbsUp, ChevronDown, ChevronRight, X, Sparkles } from "lucide-react";

const PART_FILTERS = [
  { value: null, label: "All" },
  { value: 1, label: "Part 1" },
  { value: 2, label: "Part 2" },
  { value: 3, label: "Part 3" },
  { value: -1, label: "Vocab" },
] as const;

export function TopicBoard({ initialTopics }: { initialTopics: GlobalTopic[] }) {
  const [topics, setTopics] = useState(initialTopics);
  const [search, setSearch] = useState("");
  const [partFilter, setPartFilter] = useState<number | null>(null);
  const [forecastOnly, setForecastOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form
  const [newName, setNewName] = useState("");
  const [newModule, setNewModule] = useState<"speaking" | "vocab">("speaking");
  const [newPart, setNewPart] = useState<number | null>(1);
  const [newCategory, setNewCategory] = useState("");
  const [newQuestions, setNewQuestions] = useState(["", "", ""]);

  const filtered = topics.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (forecastOnly && !t.is_forecast) return false;
    if (partFilter === -1 && t.module !== "vocab") return false;
    if (partFilter !== null && partFilter > 0 && t.part !== partFilter) return false;
    return true;
  });

  function getUpvoteCount(t: GlobalTopic): number {
    return t.topic_upvotes?.[0]?.count ?? 0;
  }

  async function handleUpvote(topicId: string) {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, user_has_upvoted: !t.user_has_upvoted } : t
      )
    );
    try {
      await toggleUpvote(topicId);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await createTopic({
        name: newName.trim(),
        module: newModule,
        part: newModule === "speaking" ? newPart : null,
        category: newCategory.trim(),
        sample_questions: newQuestions.filter(Boolean),
      });
      setTopics((prev) => [
        {
          id: crypto.randomUUID(),
          name: newName.trim(),
          module: newModule,
          part: newModule === "speaking" ? (newPart as 1 | 2 | 3) : null,
          category: newCategory.trim() || null,
          sample_questions: newQuestions.filter(Boolean),
          created_by: "self",
          is_forecast: false,
          forecast_quarter: null,
          created_at: new Date().toISOString(),
          topic_upvotes: [{ count: 0 }],
          user_has_upvoted: false,
        },
        ...prev,
      ]);
      setNewName("");
      setNewCategory("");
      setNewQuestions(["", "", ""]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
        <div className="flex gap-1.5">
          {PART_FILTERS.map((f) => (
            <button
              key={String(f.value)}
              onClick={() => setPartFilter(partFilter === f.value ? null : f.value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer ${
                partFilter === f.value
                  ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                  : "border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:border-[var(--color-accent)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setForecastOnly(!forecastOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer ${
            forecastOnly
              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
              : "border-[var(--color-line)] text-[var(--color-ink-secondary)]"
          }`}
        >
          <Sparkles className="w-3 h-3" /> Forecast
        </button>
        <Button
          variant={showForm ? "secondary" : "primary"}
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Contribute"}
        </Button>
      </div>

      {/* Add Topic Form */}
      {showForm && (
        <div className="card-base p-5 space-y-3 animate-fade-in-up">
          <p className="heading-sm">Contribute a Topic</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Topic Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Daily Routine" required />
            <Input label="Category (optional)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Lifestyle" />
          </div>
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">Module</label>
              <div className="flex gap-1.5">
                {(["speaking", "vocab"] as const).map((m) => (
                  <button key={m} onClick={() => { setNewModule(m); if (m === "vocab") setNewPart(null); else setNewPart(1); }}
                    className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer ${newModule === m ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]" : "border-[var(--color-line)] text-[var(--color-ink-secondary)]"}`}>
                    {m === "speaking" ? "Speaking" : "Vocab"}
                  </button>
                ))}
              </div>
            </div>
            {newModule === "speaking" && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">Part</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((p) => (
                    <button key={p} onClick={() => setNewPart(p)}
                      className={`w-8 h-8 text-xs rounded-lg border cursor-pointer ${newPart === p ? "bg-[#1D9E75] text-white border-[#1D9E75]" : "border-[var(--color-line)] text-[var(--color-ink-secondary)]"}`}>
                      P{p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">Sample Questions</label>
            {newQuestions.map((q, i) => (
              <input key={i} type="text" value={q}
                onChange={(e) => { const next = [...newQuestions]; next[i] = e.target.value; setNewQuestions(next); }}
                placeholder={`Question ${i + 1}`}
                className="w-full mb-1.5 px-3 py-1.5 text-sm rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
              />
            ))}
            <button onClick={() => setNewQuestions([...newQuestions, ""])} className="text-xs text-[var(--color-accent)] hover:underline cursor-pointer">+ Add question</button>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAdd} variant="primary" loading={loading}>Submit Topic</Button>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-[var(--color-ink-muted)]">{filtered.length} topics</p>

      {/* Topic Cards */}
      {filtered.length === 0 ? (
        <div className="card-base p-12 text-center">
          <p className="text-[var(--color-ink-muted)]">No topics match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((topic) => (
            <div key={topic.id} className={`card-base overflow-hidden ${topic.is_forecast ? "border-l-2 border-l-amber-500" : ""}`}>
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => handleUpvote(topic.id)}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    topic.user_has_upvoted
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-accent)]"
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-mono">{getUpvoteCount(topic)}</span>
                </button>

                <button
                  onClick={() => setExpandedId(expandedId === topic.id ? null : topic.id)}
                  className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-ink)] truncate">{topic.name}</span>
                      {topic.is_forecast && (
                        <Badge variant="warning">
                          <Sparkles className="w-3 h-3 mr-1" />{topic.forecast_quarter}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={topic.module === "speaking" ? "success" : "info"}>
                        {topic.module === "speaking" ? `Speaking P${topic.part}` : "Vocab"}
                      </Badge>
                      {topic.category && <span className="text-xs text-[var(--color-ink-muted)]">{topic.category}</span>}
                    </div>
                  </div>
                  {topic.sample_questions.length > 0 && (
                    expandedId === topic.id
                      ? <ChevronDown className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
                  )}
                </button>
              </div>

              {expandedId === topic.id && topic.sample_questions.length > 0 && (
                <div className="px-4 pb-4 pt-0 border-t border-[var(--color-line)]">
                  <p className="text-xs text-[var(--color-ink-muted)] font-medium mt-3 mb-2">Sample Questions</p>
                  <ol className="space-y-1.5">
                    {topic.sample_questions.map((q, i) => (
                      <li key={i} className="text-sm text-[var(--color-ink-secondary)] flex gap-2">
                        <span className="text-[var(--color-ink-muted)] shrink-0">{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
