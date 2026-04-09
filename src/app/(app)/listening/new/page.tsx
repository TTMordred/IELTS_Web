"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LISTENING_SECTIONS, TEST_SOURCES } from "@/lib/constants/listening-types";
import { scoreToBand } from "@/lib/constants/band-tables";
import { createListeningRecord, type SectionInput } from "../actions";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TestMode = "full" | "partial";

export default function NewListeningRecordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [source, setSource] = useState("cambridge");
  const [testName, setTestName] = useState("");
  const [link, setLink] = useState("");
  const [testMode, setTestMode] = useState<TestMode>("full");
  const [selectedSections, setSelectedSections] = useState<number[]>([1, 2, 3, 4]);
  const [totalScore, setTotalScore] = useState<number>(0);

  // Step 2 fields
  const [sections, setSections] = useState<SectionInput[]>(
    [1, 2, 3, 4].map((s) => ({
      section: s,
      section_score: 0,
      notes: "",
      types: [],
    }))
  );

  // Step 3 fields
  const [reflection, setReflection] = useState("");
  const [selfRating, setSelfRating] = useState(3);

  const maxScore = testMode === "full" ? 40 : selectedSections.length * 10;
  const clampedScore = Math.min(totalScore, maxScore);
  const estimatedBand = testMode === "full" ? scoreToBand(clampedScore, "listening") : 0;

  function setScoreSafe(val: number) {
    setTotalScore(Math.min(maxScore, Math.max(0, val)));
  }

  function toggleSection(section: number) {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section].sort()
    );
  }

  function updateSection(index: number, updates: Partial<SectionInput>) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const submittedSections = sections.filter((s) =>
        selectedSections.includes(s.section)
      );
      await createListeningRecord({
        date,
        source,
        test_name: testName,
        link,
        total_score: Math.min(clampedScore, 40),
        reflection,
        self_rating: selfRating,
        sections: submittedSections,
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
        <h1 className="heading-lg">Log Listening Test</h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Step {step} of 3 &mdash;{" "}
          {step === 1 ? "General Info" : step === 2 ? "Section Details" : "Reflection"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="flex-1 h-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: s <= step ? "var(--color-accent)" : "var(--color-line)",
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

          {/* Test Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
              Test Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTestMode("full");
                  setSelectedSections([1, 2, 3, 4]);
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  testMode === "full"
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-surface-hover)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                }`}
              >
                Full Test (40 questions)
              </button>
              <button
                type="button"
                onClick={() => setTestMode("partial")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  testMode === "partial"
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-surface-hover)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                }`}
              >
                Partial (select sections)
              </button>
            </div>
          </div>

          {/* Section Selector (Partial mode) */}
          {testMode === "partial" && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                Which sections did you practice?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSection(s)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                      selectedSections.includes(s)
                        ? "bg-[#378ADD] text-white border-[#378ADD]"
                        : "bg-[var(--color-card)] text-[var(--color-ink-muted)] border-[var(--color-line)] hover:border-[#378ADD]"
                    }`}
                  >
                    S{s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                {selectedSections.length} sections selected &middot; max {maxScore} questions
              </p>
            </div>
          )}

          {/* Score Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
              Total Score: {clampedScore}/{maxScore}
            </label>
            <input
              type="range"
              min={0}
              max={maxScore}
              value={clampedScore}
              onChange={(e) => setScoreSafe(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
            />
            <div className="flex justify-between mt-1">
              <input
                type="number"
                min={0}
                max={maxScore}
                value={clampedScore}
                onChange={(e) => setScoreSafe(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-sm font-mono rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)]"
              />
              {testMode === "full" ? (
                <span className="text-sm font-mono font-semibold text-[var(--color-accent)]">
                  Band {estimatedBand.toFixed(1)}
                </span>
              ) : (
                <span className="text-xs text-[var(--color-ink-muted)]">
                  Band estimate only for full tests
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              variant="primary"
              disabled={selectedSections.length === 0}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Section Details */}
      {step === 2 && (
        <div className="space-y-4">
          {LISTENING_SECTIONS
            .filter((ls) => selectedSections.includes(ls.section))
            .map((ls) => {
              const idx = ls.section - 1;
              return (
                <div key={ls.section} className="card-base p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="heading-sm">
                      <span className="text-[#378ADD]">S{ls.section}</span> — {ls.title}
                    </h3>
                    <span className="text-xs text-[var(--color-ink-muted)]">{ls.difficulty}</span>
                  </div>

                  <Input
                    label="Score /10"
                    type="number"
                    min={0}
                    max={10}
                    value={sections[idx].section_score.toString()}
                    onChange={(e) =>
                      updateSection(idx, {
                        section_score: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)),
                      })
                    }
                  />

                  {/* Question Type Tracking */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                      Question Types Encountered
                    </label>
                    <div className="space-y-2">
                      {ls.types.map((qt) => {
                        const existingType = sections[idx].types.find(
                          (t) => t.question_type === qt.id
                        );
                        const isSelected = !!existingType;

                        return (
                          <div key={qt.id} className="rounded-lg border border-[var(--color-line)] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  updateSection(idx, {
                                    types: sections[idx].types.filter(
                                      (t) => t.question_type !== qt.id
                                    ),
                                  });
                                } else {
                                  updateSection(idx, {
                                    types: [
                                      ...sections[idx].types,
                                      { question_type: qt.id, correct: 0, total: 0, mistakes_note: "" },
                                    ],
                                  });
                                }
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[#378ADD]/10 text-[var(--color-ink)]"
                                  : "bg-[var(--color-card)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]"
                              }`}
                            >
                              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? "border-[#378ADD] bg-[#378ADD]" : "border-[var(--color-line)]"
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
                                    max={10}
                                    value={existingType.correct}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      updateSection(idx, {
                                        types: sections[idx].types.map((t) =>
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
                                    max={10}
                                    value={existingType.total}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      updateSection(idx, {
                                        types: sections[idx].types.map((t) =>
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
                                    updateSection(idx, {
                                      types: sections[idx].types.map((t) =>
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
                      label="Section Notes (optional)"
                      value={sections[idx].notes}
                      onChange={(e) => updateSection(idx, { notes: e.target.value })}
                      placeholder="Overall notes for this section..."
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
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-y"
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
                      ? "bg-[var(--color-accent)] text-white"
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
