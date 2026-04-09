"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createForecastTopic, deleteTopic } from "@/app/admin/actions";
import type { GlobalTopic } from "@/lib/types";
import { Plus, Trash2, Sparkles, X } from "lucide-react";

export function ForecastManager({ initialTopics }: { initialTopics: GlobalTopic[] }) {
  const [topics, setTopics] = useState(initialTopics);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [part, setPart] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState("");
  const [quarter, setQuarter] = useState("Q2/2026");
  const [questions, setQuestions] = useState(["", "", "", ""]);

  const grouped = {
    part1: topics.filter((t) => t.part === 1),
    part2: topics.filter((t) => t.part === 2),
    part3: topics.filter((t) => t.part === 3),
  };

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createForecastTopic({
        name: name.trim(),
        part,
        category: category.trim(),
        sample_questions: questions.filter(Boolean),
        forecast_quarter: quarter,
      });
      setTopics((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          module: "speaking" as const,
          part,
          category: category.trim() || null,
          sample_questions: questions.filter(Boolean),
          created_by: null,
          is_forecast: true,
          forecast_quarter: quarter,
          created_at: new Date().toISOString(),
        },
      ]);
      setName("");
      setCategory("");
      setQuestions(["", "", "", ""]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    try { await deleteTopic(id); } catch (err) { console.error(err); }
  }

  return (
    <div className="space-y-6">
      {/* Add Forecast */}
      <div className="flex gap-3">
        <Select label="" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
          <option value="Q1/2026">Q1/2026</option>
          <option value="Q2/2026">Q2/2026</option>
          <option value="Q3/2026">Q3/2026</option>
          <option value="Q4/2026">Q4/2026</option>
          <option value="Q1/2027">Q1/2027</option>
        </Select>
        <Button variant={showForm ? "secondary" : "primary"} onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Forecast Topic"}
        </Button>
      </div>

      {showForm && (
        <div className="card-base p-5 space-y-3 animate-fade-in-up">
          <div className="grid grid-cols-3 gap-3">
            <Input label="Topic Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Daily Routine" required />
            <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Lifestyle" />
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">Part</label>
              <div className="flex gap-1.5">
                {([1, 2, 3] as const).map((p) => (
                  <button key={p} onClick={() => setPart(p)}
                    className={`flex-1 py-2 text-xs rounded-lg border cursor-pointer ${part === p ? "bg-[#1D9E75] text-white border-[#1D9E75]" : "border-[var(--color-line)] text-[var(--color-ink-secondary)]"}`}>
                    Part {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">Sample Questions</label>
            {questions.map((q, i) => (
              <input key={i} type="text" value={q} onChange={(e) => { const n = [...questions]; n[i] = e.target.value; setQuestions(n); }}
                placeholder={`Question ${i + 1}`}
                className="w-full mb-1.5 px-3 py-1.5 text-sm rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]" />
            ))}
            <button onClick={() => setQuestions([...questions, ""])} className="text-xs text-[var(--color-accent)] cursor-pointer">+ Add question</button>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAdd} variant="primary" loading={loading}>Save Forecast Topic</Button>
          </div>
        </div>
      )}

      {/* Part 1 */}
      <Section title="Part 1 — Interview" topics={grouped.part1} onDelete={handleDelete} />
      <Section title="Part 2+3 — Cue Card & Discussion" topics={[...grouped.part2, ...grouped.part3]} onDelete={handleDelete} />
    </div>
  );
}

function Section({ title, topics, onDelete }: { title: string; topics: GlobalTopic[]; onDelete: (id: string) => void }) {
  return (
    <div>
      <h2 className="heading-md mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" /> {title}
        <span className="text-sm font-normal text-[var(--color-ink-muted)]">({topics.length})</span>
      </h2>
      {topics.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)] py-4">No forecast topics yet</p>
      ) : (
        <div className="space-y-2">
          {topics.map((t) => (
            <div key={t.id} className="card-base p-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-ink)]">{t.name}</span>
                    <Badge variant="warning">{t.forecast_quarter}</Badge>
                    <Badge variant="success">P{t.part}</Badge>
                  </div>
                  {t.sample_questions.length > 0 && (
                    <ol className="mt-2 space-y-1">
                      {t.sample_questions.map((q, i) => (
                        <li key={i} className="text-xs text-[var(--color-ink-secondary)] flex gap-1.5">
                          <span className="text-[var(--color-ink-muted)] shrink-0">{i + 1}.</span> {q}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                <button onClick={() => onDelete(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-[var(--color-ink-muted)] hover:text-red-500 transition-all cursor-pointer shrink-0">
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
