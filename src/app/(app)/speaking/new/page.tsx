"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  SPEAKING_CRITERIA,
  SPEAKING_ENTRY_TYPES,
} from "@/lib/constants/speaking-types";
import { createSpeakingEntry, type PartDetailInput } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ForecastBanner } from "@/components/dashboard/forecast-banner";
import { SpeakingRecorder } from "@/components/speaking/speaking-recorder";
import { uploadSpeakingRecording } from "@/lib/storage/speaking-recordings";
import { Part1Notebook, type TopicBankItem } from "@/components/speaking/part1-notebook";
import { Part2Notebook } from "@/components/speaking/part2-notebook";
import { Part3Notebook } from "@/components/speaking/part3-notebook";
import { useDraftAutosave } from "@/hooks/use-draft-autosave";
import { DraftRestoreBanner, DraftSavedIndicator } from "@/components/ui/draft-status";
import type { NewRecordNotebookQuestion } from "@/lib/speaking/notebook-validation";
import type { Part2CardDraft } from "@/lib/speaking/part2-validation";
import type { Part3QuestionDraft } from "@/lib/speaking/part3-validation";

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
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryType, setEntryType] = useState<"practice" | "mock_test" | "real_test">("practice");
  const [fluency, setFluency] = useState(0);
  const [lexical, setLexical] = useState(0);
  const [grammar, setGrammar] = useState(0);
  const [pronunciation, setPronunciation] = useState(0);

  // Step 2 reflection
  const [reflection, setReflection] = useState("");

  // Recording state
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingMime, setRecordingMime] = useState("");
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // DB-backed topics (fallback to hardcoded constants)
  const [dbPart1Topics, setDbPart1Topics] = useState<TopicBankItem[]>([]);
  const [dbPart2Topics, setDbPart2Topics] = useState<TopicBankItem[]>([]);
  const [part1Draft, setPart1Draft] = useState<NewRecordNotebookQuestion[]>([]);
  const [part2CardsDraft, setPart2CardsDraft] = useState<Part2CardDraft[]>([]);
  const [part3Draft, setPart3Draft] = useState<Part3QuestionDraft[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("global_topics").select("id, name, sample_questions").eq("module", "speaking").eq("part", 1).order("name"),
      supabase.from("global_topics").select("id, name, category, sample_questions, is_forecast, forecast_quarter").eq("module", "speaking").eq("part", 2).order("name"),
    ]).then(([p1, p2]) => {
      if (p1.data && p1.data.length > 0) {
        setDbPart1Topics(p1.data);
      }
      if (p2.data && p2.data.length > 0) {
        setDbPart2Topics(p2.data);
      }
    });
  }, []);

  const part1Topics = [...new Set(part1Draft.map((question) => dbPart1Topics.find((topic) => topic.id === question.topicId)?.name).filter((name): name is string => Boolean(name)))];
  const part2Topics = [...new Set(part2CardsDraft.map((card) => card.cue_card).filter((name): name is string => Boolean(name)))];
  const part2Types = [...new Set(part2CardsDraft.map((card) => card.cue_card_type))];
  const selectedPart2TopicIds = new Set(part2CardsDraft.map((card) => card.topicId).filter((id): id is string => Boolean(id)));
  const part3TopicBank = dbPart2Topics.filter((topic) => selectedPart2TopicIds.has(topic.id));
  const part3TopicNames = [...new Set(part3Draft.map((question) => question.topic).filter((name): name is string => Boolean(name)))];
  const part3Functions = [...new Set(part3Draft.map((question) => question.answer_function))];
  const forecastTopics = dbPart2Topics.filter((topic) => topic.is_forecast);
  const currentQuarter = forecastTopics[0]?.forecast_quarter ?? null;

  const scores = [fluency, lexical, grammar, pronunciation];
  const allScored = scores.every((s) => s > 0);
  const estimatedBand = allScored ? calcBand(scores) : null;

  // Google-Forms-style draft autosave across all steps (incl. the answer sheets)
  const draftValue = {
    name,
    date,
    entryType,
    fluency,
    lexical,
    grammar,
    pronunciation,
    reflection,
    part1Draft,
    part2CardsDraft,
    part3Draft,
  };
  const draftAutosave = useDraftAutosave({ key: "speaking-entry:new", value: draftValue });

  function restoreDraft() {
    const d = draftAutosave.draft;
    if (!d) return;
    setName(d.name ?? "");
    if (d.date) setDate(d.date);
    if (d.entryType) setEntryType(d.entryType);
    setFluency(d.fluency ?? 0);
    setLexical(d.lexical ?? 0);
    setGrammar(d.grammar ?? 0);
    setPronunciation(d.pronunciation ?? 0);
    setReflection(d.reflection ?? "");
    setPart1Draft(d.part1Draft ?? []);
    setPart2CardsDraft(d.part2CardsDraft ?? []);
    setPart3Draft(d.part3Draft ?? []);
    draftAutosave.consumeDraft();
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
      if (part2Topics.length > 0) {
        parts.push({
          part: 2,
          topic: part2Topics.join(", "),
          topic_category: part2Types.join(", "),
          notes: "",
        });
      }
      if (part3TopicNames.length > 0) {
        parts.push({
          part: 3,
          topic: part3TopicNames.join(", "),
          topic_category: part3Functions.join(", "),
          notes: "",
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
        name,
        date,
        type: entryType,
        fluency_score: fluency,
        lexical_score: lexical,
        grammar_score: grammar,
        pronunciation_score: pronunciation,
        reflection,
        parts,
        recording_url: recordingPath ?? null,
        notebook: part1Draft,
        part2Cards: part2CardsDraft,
        part3Questions: part3Draft,
      });
      draftAutosave.clearDraft();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to save");
        setUploading(false);
        setLoading(false);
        return;
      }
      throw err;
    }
  }

  const criteriaSetters = [setFluency, setLexical, setGrammar, setPronunciation];
  const criteriaValues = [fluency, lexical, grammar, pronunciation];

  function updatePart2Draft(cards: Part2CardDraft[]) {
    setPart2CardsDraft(cards);
    const topicIds = new Set(cards.map((card) => card.topicId).filter((id): id is string => Boolean(id)));
    setPart3Draft((current) => current.filter((question) => question.topicId != null && topicIds.has(question.topicId)));
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
        <div className="flex items-center gap-3">
          <h1 className="heading-lg">Log Speaking Session</h1>
          <DraftSavedIndicator status={draftAutosave.status} savedAt={draftAutosave.savedAt} />
        </div>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Step {step} of 2 &mdash; {step === 1 ? "Scores & Type" : "Reflection"}
        </p>
      </div>

      {draftAutosave.showRestore && (
        <DraftRestoreBanner savedAt={draftAutosave.savedAt} onRestore={restoreDraft} onDismiss={draftAutosave.clearDraft} />
      )}

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2].map((s) => (
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

      {forecastTopics.length > 0 && currentQuarter && (
        <ForecastBanner
          quarter={currentQuarter}
          topics={forecastTopics.map((topic) => ({ name: topic.name, part: 2 }))}
        />
      )}

      <Part1Notebook
        part={1}
        topics={dbPart1Topics}
        initialDraft={part1Draft}
        onDraftChange={setPart1Draft}
      />
      <Part2Notebook
        topics={dbPart2Topics}
        initialDraft={part2CardsDraft}
        onDraftChange={updatePart2Draft}
      />
      <Part3Notebook
        topics={part3TopicBank}
        initialDraft={part3Draft}
        onDraftChange={setPart3Draft}
      />

      {/* STEP 1: Scores & Type */}
      {step === 1 && (
        <div className="card-base p-6 space-y-5">
          <Input
            label="Record Name (optional)"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Weekend speaking practice"
            maxLength={120}
          />
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

      {/* STEP 2: Reflection */}
      {step === 2 && (
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
            <Button onClick={() => setStep(1)} variant="secondary">
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
