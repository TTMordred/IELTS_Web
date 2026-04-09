"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  SPEAKING_CRITERIA,
  SPEAKING_ENTRY_TYPES,
  SPEAKING_PART1_TOPICS,
  SPEAKING_PART2_CATEGORIES,
} from "@/lib/constants/speaking-types";
import { createSpeakingEntry, type PartDetailInput } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ForecastBanner } from "@/components/dashboard/forecast-banner";
import { SpeakingRecorder } from "@/components/speaking/speaking-recorder";
import { uploadSpeakingRecording } from "@/lib/storage/speaking-recordings";

const MODULE_COLOR = "#1D9E75";

function calcBand(scores: number[]): number {
  if (scores.some((s) => s === 0)) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 2) / 2;
}

function ScoreButtons({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const scores = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
  return (
    <div className="flex flex-wrap gap-1.5">
      {scores.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="w-10 h-8 rounded text-xs font-mono font-medium transition-colors cursor-pointer border"
          style={
            value === s
              ? { backgroundColor: MODULE_COLOR, color: "white", borderColor: MODULE_COLOR }
              : {
                  backgroundColor: "var(--color-card)",
                  color: "var(--color-ink-secondary)",
                  borderColor: "var(--color-line)",
                }
          }
        >
          {s % 1 === 0 ? s : s.toFixed(1)}
        </button>
      ))}
    </div>
  );
}

export default function NewSpeakingEntryPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryType, setEntryType] = useState<"practice" | "mock_test" | "real_test">("practice");
  const [fluency, setFluency] = useState(0);
  const [lexical, setLexical] = useState(0);
  const [grammar, setGrammar] = useState(0);
  const [pronunciation, setPronunciation] = useState(0);

  // Step 2 fields — one per part
  const [part1Topics, setPart1Topics] = useState<string[]>([]);
  const [part2Topic, setPart2Topic] = useState("");
  const [part2Category, setPart2Category] = useState("");
  const [part3Notes, setPart3Notes] = useState("");

  // Step 3 reflection
  const [reflection, setReflection] = useState("");

  // Recording state
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingMime, setRecordingMime] = useState("");
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // DB-backed topics (fallback to hardcoded constants)
  const [dbPart1Topics, setDbPart1Topics] = useState<string[]>([]);
  const [dbPart2Categories, setDbPart2Categories] = useState<{ id: string; name: string; is_forecast: boolean; forecast_quarter: string | null }[]>([]);
  const [topicsLoaded, setTopicsLoaded] = useState(false);

  // Forecast filter
  const [forecastOnly, setForecastOnly] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("global_topics").select("name, is_forecast").eq("module", "speaking").eq("part", 1).order("name"),
      supabase.from("global_topics").select("id, name, category, is_forecast, forecast_quarter").eq("module", "speaking").eq("part", 2).order("name"),
    ]).then(([p1, p2]) => {
      if (p1.data && p1.data.length > 0) {
        setDbPart1Topics(p1.data.map((t) => t.name));
      }
      if (p2.data && p2.data.length > 0) {
        setDbPart2Categories(p2.data.map((t) => ({ id: t.id, name: t.name, is_forecast: t.is_forecast, forecast_quarter: t.forecast_quarter ?? null })));
      }
      setTopicsLoaded(true);
    });
  }, []);

  const activePart1Topics = dbPart1Topics.length > 0 ? dbPart1Topics : [...SPEAKING_PART1_TOPICS];

  const allPart2Cats = dbPart2Categories.length > 0
    ? dbPart2Categories.map((c) => ({ id: c.id, name: c.name, examples: "", is_forecast: c.is_forecast, forecast_quarter: c.forecast_quarter }))
    : SPEAKING_PART2_CATEGORIES.map((c) => ({ ...c, is_forecast: false, forecast_quarter: null }));

  const forecastTopics = allPart2Cats.filter((c) => c.is_forecast);
  const currentQuarter = forecastTopics[0]?.forecast_quarter ?? null;

  const displayedPart2Cats = (forecastOnly ? forecastTopics : allPart2Cats)
    .slice()
    .sort((a, b) => (b.is_forecast ? 1 : 0) - (a.is_forecast ? 1 : 0));

  const activePart2Cats = displayedPart2Cats;

  const scores = [fluency, lexical, grammar, pronunciation];
  const allScored = scores.every((s) => s > 0);
  const estimatedBand = allScored ? calcBand(scores) : null;

  function togglePart1Topic(topic: string) {
    setPart1Topics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const parts: PartDetailInput[] = [];

      if (part1Topics.length > 0) {
        parts.push({
          part: 1,
          topic: part1Topics.join(", "),
          topic_category: "",
          notes: "",
        });
      }
      if (part2Topic) {
        parts.push({
          part: 2,
          topic: part2Topic,
          topic_category: part2Category,
          notes: "",
        });
      }
      if (part3Notes) {
        parts.push({
          part: 3,
          topic: "",
          topic_category: "",
          notes: part3Notes,
        });
      }

      let recordingPath = uploadedPath;
      if (recordingBlob && !uploadedPath) {
        setUploading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { path } = await uploadSpeakingRecording(supabase, user.id, recordingBlob, recordingMime);
          recordingPath = path;
          setUploadedPath(path);
        }
        setUploading(false);
      }

      await createSpeakingEntry({
        date,
        type: entryType,
        fluency_score: fluency,
        lexical_score: lexical,
        grammar_score: grammar,
        pronunciation_score: pronunciation,
        reflection,
        parts,
        recording_url: recordingPath ?? null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setUploading(false);
      setLoading(false);
    }
  }

  const criteriaSetters = [setFluency, setLexical, setGrammar, setPronunciation];
  const criteriaValues = [fluency, lexical, grammar, pronunciation];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer mb-2 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="heading-lg">Log Speaking Session</h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Step {step} of 3 &mdash;{" "}
          {step === 1 ? "Scores & Type" : step === 2 ? "Part Details" : "Reflection"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="flex-1 h-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: s <= step ? MODULE_COLOR : "var(--color-line)",
            }}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-[var(--color-critical)] bg-red-500/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* STEP 1: Scores & Type */}
      {step === 1 && (
        <div className="card-base p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Select
              label="Session Type"
              value={entryType}
              onChange={(e) =>
                setEntryType(e.target.value as "practice" | "mock_test" | "real_test")
              }
            >
              {SPEAKING_ENTRY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Criteria scores */}
          <div className="space-y-4">
            {SPEAKING_CRITERIA.map((c, i) => (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-[var(--color-ink)]">
                    {c.name}
                    <span className="ml-1 text-xs text-[var(--color-ink-muted)]">
                      — {c.description}
                    </span>
                  </label>
                  <span
                    className="text-sm font-mono font-bold"
                    style={{ color: criteriaValues[i] > 0 ? MODULE_COLOR : "var(--color-ink-muted)" }}
                  >
                    {criteriaValues[i] > 0 ? criteriaValues[i] : "—"}
                  </span>
                </div>
                <ScoreButtons
                  value={criteriaValues[i]}
                  onChange={criteriaSetters[i]}
                />
              </div>
            ))}
          </div>

          {/* Estimated band display */}
          <div className="flex items-center justify-between rounded-lg p-3 bg-[var(--color-surface-hover)]">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Estimated Band
            </span>
            <span
              className="text-xl font-bold font-mono"
              style={{ color: estimatedBand ? MODULE_COLOR : "var(--color-ink-muted)" }}
            >
              {estimatedBand ? estimatedBand.toFixed(1) : "—"}
            </span>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              variant="primary"
              disabled={!allScored}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Part Details */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Forecast Banner */}
          {forecastTopics.length > 0 && currentQuarter && (
            <ForecastBanner
              quarter={currentQuarter}
              topics={forecastTopics.map((t) => ({ name: t.name, part: 2 }))}
            />
          )}

          {/* Part 1 */}
          <div className="card-base p-5 space-y-3">
            <h3 className="heading-sm">
              <span style={{ color: MODULE_COLOR }}>Part 1</span> — Topics Discussed
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Select 2–3 topics that came up
            </p>
            <div className="flex flex-wrap gap-2">
              {activePart1Topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => togglePart1Topic(topic)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border"
                  style={
                    part1Topics.includes(topic)
                      ? {
                          backgroundColor: MODULE_COLOR,
                          color: "white",
                          borderColor: MODULE_COLOR,
                        }
                      : {
                          backgroundColor: "var(--color-card)",
                          color: "var(--color-ink-secondary)",
                          borderColor: "var(--color-line)",
                        }
                  }
                >
                  {topic}
                </button>
              ))}
            </div>
            {part1Topics.length > 0 && (
              <p className="text-xs text-[var(--color-ink-muted)]">
                {part1Topics.length} selected: {part1Topics.join(", ")}
              </p>
            )}
          </div>

          {/* Part 2 */}
          <div className="card-base p-5 space-y-3">
            <h3 className="heading-sm">
              <span style={{ color: MODULE_COLOR }}>Part 2</span> — Cue Card
            </h3>
            <Input
              label="Cue Card Topic"
              value={part2Topic}
              onChange={(e) => setPart2Topic(e.target.value)}
              placeholder="e.g. Describe a person who has influenced you"
            />
            {forecastTopics.length > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={forecastOnly}
                  onChange={(e) => setForecastOnly(e.target.checked)}
                  className="rounded"
                />
                <span>Show forecast topics only</span>
                <span className="text-xs text-[var(--color-ink-muted)]">({forecastTopics.length} topics)</span>
              </label>
            )}
            <Select
              label="Category"
              value={part2Category}
              onChange={(e) => setPart2Category(e.target.value)}
            >
              <option value="">Select category...</option>
              {activePart2Cats.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.is_forecast ? "★ " : ""}{cat.name}{cat.examples ? ` — ${cat.examples}` : ""}
                </option>
              ))}
            </Select>
          </div>

          {/* Part 3 */}
          <div className="card-base p-5 space-y-3">
            <h3 className="heading-sm">
              <span style={{ color: MODULE_COLOR }}>Part 3</span> — Discussion
            </h3>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
                Notes on discussion questions
              </label>
              <textarea
                value={part3Notes}
                onChange={(e) => setPart3Notes(e.target.value)}
                rows={3}
                placeholder="What questions were asked? How did the discussion go?"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 resize-y"
                style={{ "--tw-ring-color": MODULE_COLOR } as React.CSSProperties}
              />
            </div>
          </div>

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
        <div className="space-y-4">
          <div className="card-base p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
                Reflection
              </label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={5}
                placeholder="What went well? Where did you struggle? Key takeaways for improvement..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 resize-y"
                style={{ "--tw-ring-color": MODULE_COLOR } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Optional Recording */}
          <div className="card-base p-5">
            <h3 className="heading-sm mb-3">
              Practice Recording{" "}
              <span className="text-xs text-[var(--color-ink-muted)] font-normal">(optional)</span>
            </h3>
            <SpeakingRecorder
              onRecorded={(blob, mime) => {
                setRecordingBlob(blob);
                setRecordingMime(mime);
              }}
              onCleared={() => {
                setRecordingBlob(null);
                setUploadedPath(null);
              }}
              disabled={loading || uploading}
            />
          </div>

          <div className="flex justify-between pt-2">
            <Button onClick={() => setStep(2)} variant="secondary">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleSubmit} variant="primary" loading={loading || uploading}>
              Save Record
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
