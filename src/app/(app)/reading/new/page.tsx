"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { READING_QUESTION_TYPES, READING_TOPIC_CATEGORIES } from "@/lib/constants/reading-types";
import { TEST_SOURCES } from "@/lib/constants/listening-types";
import { scoreToBand } from "@/lib/constants/band-tables";
import { createReadingRecord, type PassageInput } from "../actions";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PASSAGES = [
  { passage_num: 1, label: "Passage 1", difficulty: "Easiest" },
  { passage_num: 2, label: "Passage 2", difficulty: "Medium" },
  { passage_num: 3, label: "Passage 3", difficulty: "Hardest" },
];

export default function NewReadingRecordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [source, setSource] = useState("cambridge");
  const [testName, setTestName] = useState("");
  const [link, setLink] = useState("");
  const [totalScore, setTotalScore] = useState<number>(0);
  const [totalTimeMin, setTotalTimeMin] = useState<number>(60);

  // Step 2 fields
  const [passages, setPassages] = useState<PassageInput[]>(
    [1, 2, 3].map((p) => ({
      passage_num: p,
      passage_topic: "",
      passage_score: 0,
      time_spent_min: 20,
      notes: "",
      types: [],
    }))
  );

  // Step 3 fields
  const [reflection, setReflection] = useState("");
  const [selfRating, setSelfRating] = useState(3);

  const clampedScore = Math.min(Math.max(totalScore, 0), 40);
  const estimatedBand = scoreToBand(clampedScore, "reading");

  function setScoreSafe(val: number) {
    setTotalScore(Math.min(40, Math.max(0, val)));
  }

  function updatePassage(index: number, updates: Partial<PassageInput>) {
    setPassages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      await createReadingRecord({
        date,
        source,
        test_name: testName,
        link,
        total_score: clampedScore,
        total_time_min: totalTimeMin,
        reflection,
        self_rating: selfRating,
        passages,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer mb-2 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="heading-lg">Log Reading Test</h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Step {step} of 3 &mdash;{" "}
          {step === 1 ? "General Info" : step === 2 ? "Passage Details" : "Reflection"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="flex-1 h-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: s <= step ? "#D85A30" : "var(--color-line)",
            }}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-[var(--color-critical)] bg-red-500/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* STEP 1: General Info */}
      {step === 1 && (
        <div className="card-base p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Select
              label="Source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {TEST_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Test Name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g. Cambridge 18, Test 1"
            required
          />

          <Input
            label="Link (optional)"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="URL to the test"
          />

          {/* Score Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
              Total Score: {clampedScore}/40
            </label>
            <input
              type="range"
              min={0}
              max={40}
              value={clampedScore}
              onChange={(e) => setScoreSafe(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#D85A30]"
            />
            <div className="flex justify-between mt-1">
              <input
                type="number"
                min={0}
                max={40}
                value={clampedScore}
                onChange={(e) => setScoreSafe(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-sm font-mono rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)]"
              />
              <span className="text-sm font-mono font-semibold text-[#D85A30]">
                Band {estimatedBand.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Total Time */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
              Total Time (minutes)
            </label>
            <input
              type="number"
              min={0}
              max={180}
              value={totalTimeMin}
              onChange={(e) => setTotalTimeMin(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 px-2 py-1.5 text-sm font-mono rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)]"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              variant="primary"
              disabled={!testName.trim()}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Passage Details */}
      {step === 2 && (
        <div className="space-y-4">
          {PASSAGES.map((ps) => {
            const idx = ps.passage_num - 1;
            return (
              <div key={ps.passage_num} className="card-base p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="heading-sm">
                    <span className="text-[#D85A30]">{ps.label}</span>
                  </h3>
                  <span className="text-xs text-[var(--color-ink-muted)]">{ps.difficulty}</span>
                </div>

                <div className="space-y-3">
                  <Select
                    label="Topic Category"
                    value={passages[idx].passage_topic}
                    onChange={(e) => updatePassage(idx, { passage_topic: e.target.value })}
                  >
                    <option value="">Select topic...</option>
                    {READING_TOPIC_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Score /13-14"
                      type="number"
                      min={0}
                      max={14}
                      value={passages[idx].passage_score.toString()}
                      onChange={(e) =>
                        updatePassage(idx, {
                          passage_score: Math.min(14, Math.max(0, parseInt(e.target.value) || 0)),
                        })
                      }
                    />
                    <Input
                      label="Time Spent (min)"
                      type="number"
                      min={0}
                      max={60}
                      value={passages[idx].time_spent_min.toString()}
                      onChange={(e) =>
                        updatePassage(idx, {
                          time_spent_min: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                </div>

                {/* Question Type Tracking */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    Question Types Encountered
                  </label>
                  <div className="space-y-2">
                    {READING_QUESTION_TYPES.map((qt) => {
                      const existingType = passages[idx].types.find(
                        (t) => t.question_type === qt.id
                      );
                      const isSelected = !!existingType;

                      return (
                        <div key={qt.id} className="rounded-lg border border-[var(--color-line)] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                updatePassage(idx, {
                                  types: passages[idx].types.filter(
                                    (t) => t.question_type !== qt.id
                                  ),
                                });
                              } else {
                                updatePassage(idx, {
                                  types: [
                                    ...passages[idx].types,
                                    { question_type: qt.id, correct: 0, total: 0, mistakes_note: "" },
                                  ],
                                });
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#D85A30]/10 text-[var(--color-ink)]"
                                : "bg-[var(--color-card)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]"
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? "border-[#D85A30] bg-[#D85A30]" : "border-[var(--color-line)]"
                            }`}>
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </span>
                            <span className="flex-1">{qt.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              qt.frequency === "high" ? "bg-emerald-500/10 text-emerald-600" :
                              qt.frequency === "medium" ? "bg-amber-500/10 text-amber-600" :
                              "bg-blue-500/10 text-blue-500"
                            }`}>
                              {qt.frequency === "high" ? "cao" : qt.frequency === "medium" ? "tb" : "thấp"}
                            </span>
                          </button>

                          {isSelected && (
                            <div className="flex items-center gap-3 px-3 py-2 bg-[var(--color-surface-hover)] border-t border-[var(--color-line)]">
                              <div className="flex items-center gap-1.5">
                                <label className="text-xs text-[var(--color-ink-muted)]">Correct</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={14}
                                  value={existingType.correct}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    updatePassage(idx, {
                                      types: passages[idx].types.map((t) =>
                                        t.question_type === qt.id ? { ...t, correct: val } : t
                                      ),
                                    });
                                  }}
                                  className="w-12 px-1.5 py-1 text-xs font-mono rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-center"
                                />
                              </div>
                              <span className="text-[var(--color-ink-muted)]">/</span>
                              <div className="flex items-center gap-1.5">
                                <label className="text-xs text-[var(--color-ink-muted)]">Total</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={14}
                                  value={existingType.total}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    updatePassage(idx, {
                                      types: passages[idx].types.map((t) =>
                                        t.question_type === qt.id ? { ...t, total: val } : t
                                      ),
                                    });
                                  }}
                                  className="w-12 px-1.5 py-1 text-xs font-mono rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-center"
                                />
                              </div>
                              <input
                                type="text"
                                value={existingType.mistakes_note}
                                onChange={(e) => {
                                  updatePassage(idx, {
                                    types: passages[idx].types.map((t) =>
                                      t.question_type === qt.id ? { ...t, mistakes_note: e.target.value } : t
                                    ),
                                  });
                                }}
                                placeholder="Notes on mistakes..."
                                className="flex-1 px-2 py-1 text-xs rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3">
                  <Input
                    label="Passage Notes (optional)"
                    value={passages[idx].notes}
                    onChange={(e) => updatePassage(idx, { notes: e.target.value })}
                    placeholder="Overall notes for this passage..."
                  />
                </div>
              </div>
            );
          })}

          <div className="flex justify-between">
            <Button onClick={() => setStep(1)} variant="secondary">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)} variant="primary">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Reflection */}
      {step === 3 && (
        <div className="card-base p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
              Reflection
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={4}
              placeholder="What went well? What was difficult? Key takeaways..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[#D85A30] resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
              Self Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelfRating(r)}
                  className={`w-10 h-10 rounded-lg text-lg transition-colors cursor-pointer ${
                    r <= selfRating
                      ? "bg-[#D85A30] text-white"
                      : "bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)]"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button onClick={() => setStep(2)} variant="secondary">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleSubmit} variant="primary" loading={loading}>
              Save Record
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
