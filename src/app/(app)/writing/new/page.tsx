"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  WRITING_TASK1_TYPES,
  WRITING_TASK2_TYPES,
  WRITING_TOPIC_CATEGORIES,
} from "@/lib/constants/writing-types";
import { createWritingEntry } from "../actions";
import { ChevronLeft, ChevronRight } from "lucide-react";

function countWords(html: string): number {
  const plain = html.replace(/<[^>]*>/g, " ");
  return plain.trim().split(/\s+/).filter(Boolean).length;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export default function NewWritingEntryPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [taskType, setTaskType] = useState<"task1" | "task2">("task2");
  const [subType, setSubType] = useState("");
  const [topic, setTopic] = useState("");
  const [topicCategory, setTopicCategory] = useState("");
  const [questionText, setQuestionText] = useState("");

  const [essayContent, setEssayContent] = useState("");
  const [timeSpentMin, setTimeSpentMin] = useState<number>(40);
  const [taScore, setTaScore] = useState<number>(6);
  const [ccScore, setCcScore] = useState<number>(6);
  const [lrScore, setLrScore] = useState<number>(6);
  const [graScore, setGraScore] = useState<number>(6);
  const [feedback, setFeedback] = useState("");

  const wordCount = countWords(essayContent);
  const estimatedBand = roundToHalf((taScore + ccScore + lrScore + graScore) / 4);

  const subTypes = taskType === "task1" ? WRITING_TASK1_TYPES : WRITING_TASK2_TYPES;

  function handleTaskTypeSwitch(type: "task1" | "task2") {
    setTaskType(type);
    setSubType("");
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      await createWritingEntry({
        date,
        task_type: taskType,
        sub_type: subType,
        topic,
        topic_category: topicCategory,
        question_text: questionText,
        essay_content: essayContent,
        time_spent_min: timeSpentMin,
        ta_score: taScore,
        cc_score: ccScore,
        lr_score: lrScore,
        gra_score: graScore,
        feedback,
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
        <h1 className="heading-lg">Log Writing Entry</h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Step {step} of 2 &mdash;{" "}
          {step === 1 ? "Task Details" : "Essay & Assessment"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className="flex-1 h-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: s <= step ? "#993556" : "var(--color-line)",
            }}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-[var(--color-critical)] bg-red-500/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* STEP 1: Task Details */}
      {step === 1 && (
        <div className="card-base p-6 space-y-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          {/* Task Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
              Task Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTaskTypeSwitch("task1")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  taskType === "task1"
                    ? "bg-[#993556] text-white"
                    : "bg-[var(--color-surface-hover)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                }`}
              >
                Task 1
              </button>
              <button
                type="button"
                onClick={() => handleTaskTypeSwitch("task2")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  taskType === "task2"
                    ? "bg-[#993556] text-white"
                    : "bg-[var(--color-surface-hover)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                }`}
              >
                Task 2
              </button>
            </div>
          </div>

          {/* Sub-type Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
              {taskType === "task1" ? "Chart / Diagram Type" : "Essay Type"}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {subTypes.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSubType(st.name)}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors cursor-pointer border ${
                    subType === st.name
                      ? "bg-[#993556]/10 border-[#993556] text-[var(--color-ink)]"
                      : "bg-[var(--color-card)] border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:border-[#993556]/50"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                    subType === st.name ? "border-[#993556] bg-[#993556]" : "border-[var(--color-line)]"
                  }`}>
                    {subType === st.name && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                  </span>
                  <span>
                    <span className="font-medium text-[var(--color-ink)]">{st.name}</span>
                    <span className="block text-xs text-[var(--color-ink-muted)] mt-0.5">{st.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Topic / Title"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={taskType === "task1" ? "e.g. Energy consumption by sector 2000-2020" : "e.g. Remote work benefits society"}
          />

          <Select
            label="Topic Category"
            value={topicCategory}
            onChange={(e) => setTopicCategory(e.target.value)}
          >
            <option value="">Select category...</option>
            {WRITING_TOPIC_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
              Question Text
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={4}
              placeholder="Paste the full question or task prompt here..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[#993556] resize-y"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              variant="primary"
              disabled={!subType}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Essay & Assessment */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Essay Content */}
          <div className="card-base p-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Essay Content
              </label>
              <span className={`text-sm font-mono font-semibold ${
                wordCount < (taskType === "task1" ? 150 : 250)
                  ? "text-[var(--color-critical)]"
                  : "text-emerald-500"
              }`}>
                {wordCount} words
                {taskType === "task1" ? " / 150 min" : " / 250 min"}
              </span>
            </div>
            <RichTextEditor
              value={essayContent}
              onChange={setEssayContent}
              placeholder="Write or paste your essay here..."
              minHeight="280px"
            />
          </div>

          {/* Time & Criteria */}
          <div className="card-base p-6 space-y-5">
            <Input
              label="Time Spent (minutes)"
              type="number"
              min={1}
              max={120}
              value={timeSpentMin.toString()}
              onChange={(e) => setTimeSpentMin(Math.max(1, parseInt(e.target.value) || 1))}
            />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="heading-sm">Criteria Scores (1–9)</h3>
                <span className="text-sm font-mono font-semibold text-[#993556]">
                  Band {estimatedBand.toFixed(1)}
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Task Achievement (TA)", short: "TA", value: taScore, setter: setTaScore },
                  { label: "Coherence & Cohesion (CC)", short: "CC", value: ccScore, setter: setCcScore },
                  { label: "Lexical Resource (LR)", short: "LR", value: lrScore, setter: setLrScore },
                  { label: "Grammatical Range & Accuracy (GRA)", short: "GRA", value: graScore, setter: setGraScore },
                ].map(({ label, short, value, setter }) => (
                  <div key={short}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm text-[var(--color-ink)]">{label}</label>
                      <span className="text-sm font-mono font-semibold text-[var(--color-ink)]">{value}.0</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 9 }, (_, i) => i + 1).map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setter(score)}
                          className={`flex-1 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                            score <= value
                              ? "bg-[#993556] text-white"
                              : "bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] hover:bg-[#993556]/20"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
                Feedback (optional)
              </label>
              <RichTextEditor
                value={feedback}
                onChange={setFeedback}
                placeholder="Examiner feedback, areas to improve, key mistakes..."
                minHeight="80px"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button onClick={() => setStep(1)} variant="secondary">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleSubmit} variant="primary" loading={loading}>
              Save Entry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
