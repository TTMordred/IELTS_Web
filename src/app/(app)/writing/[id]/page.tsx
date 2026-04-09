import Link from "next/link";
import { notFound } from "next/navigation";
import { getWritingEntry } from "../actions";
import { Badge } from "@/components/ui/badge";
import { WRITING_CRITERIA } from "@/lib/constants/writing-types";
import { ChevronLeft, PenTool } from "lucide-react";
import { InlineEditField } from "@/components/ui/inline-edit-field";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { RichEditField } from "@/components/ui/rich-edit-field";
import { getRelatedRecords } from "@/app/(app)/record-links-actions";
import { RelatedRecords } from "@/components/record-links/related-records";
import { AiGradeWriting } from "@/components/ai/ai-grade-writing";

function bandToColor(band: number): string {
  if (band >= 8) return "#22c55e";
  if (band >= 7) return "#84cc16";
  if (band >= 6) return "#eab308";
  if (band >= 5) return "#f97316";
  return "#ef4444";
}

export default async function WritingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let entry;
  try {
    entry = await getWritingEntry(id);
  } catch {
    notFound();
  }

  if (!entry) notFound();

  const relatedLinks = await getRelatedRecords("writing_entries", entry.id);

  const criteriaScores = [
    { id: "ta", score: entry.ta_score },
    { id: "cc", score: entry.cc_score },
    { id: "lr", score: entry.lr_score },
    { id: "gra", score: entry.gra_score },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <Link
          href="/writing"
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer mb-2 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> All Entries
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="heading-lg flex items-center gap-2">
              <PenTool className="w-5 h-5 text-[#993556] shrink-0" />
              <InlineEditField
                table="writing_entries"
                id={entry.id}
                field="topic"
                value={entry.topic}
                placeholder="Untitled Essay"
                displayClassName="heading-lg truncate"
              />
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[var(--color-ink-secondary)] text-sm">{entry.date}</span>
              <Badge variant={entry.task_type === "task1" ? "info" : "default"}>
                {entry.task_type === "task1" ? "Task 1" : "Task 2"}
              </Badge>
              {entry.sub_type && (
                <Badge variant="default">{entry.sub_type}</Badge>
              )}
              {entry.topic_category && (
                <span className="text-xs text-[var(--color-ink-muted)]">{entry.topic_category}</span>
              )}
            </div>
          </div>
          <div
            className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shrink-0"
            style={{ backgroundColor: bandToColor(entry.estimated_band || 0) }}
          >
            <span className="text-xl font-bold font-mono">{entry.estimated_band?.toFixed(1) ?? "—"}</span>
            <span className="text-[0.6rem] uppercase opacity-80">Band</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="card-base p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="section-label">Words</p>
            <p className="text-2xl font-bold font-mono text-[var(--color-ink)]">
              {entry.word_count ?? 0}
            </p>
          </div>
          <div>
            <p className="section-label">Time</p>
            <p className="text-2xl font-bold font-mono text-[var(--color-ink)]">
              {entry.time_spent_min ?? "—"}
              {entry.time_spent_min && <span className="text-base text-[var(--color-ink-muted)]">m</span>}
            </p>
          </div>
          <div>
            <p className="section-label">Band</p>
            <p
              className="text-2xl font-bold font-mono"
              style={{ color: bandToColor(entry.estimated_band || 0) }}
            >
              {entry.estimated_band?.toFixed(1) ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Criteria Scores */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Assessment Criteria</h2>
        <div className="space-y-4">
          {criteriaScores.map(({ id: criteriaId, score }) => {
            const criteria = WRITING_CRITERIA.find((c) => c.id === criteriaId);
            if (!criteria) return null;
            const barWidth = score ? (score / 9) * 100 : 0;
            return (
              <div key={criteriaId}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-medium text-[var(--color-ink)]">
                      {criteria.shortName}
                    </span>
                    <span className="text-xs text-[var(--color-ink-muted)] ml-2">
                      {criteria.name}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-[var(--color-ink)]">
                    {score?.toFixed(1) ?? "—"}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-line)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: bandToColor(score ?? 0),
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{criteria.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Text */}
      {entry.question_text && (
        <div className="card-base p-5">
          <h2 className="heading-md mb-2">Question</h2>
          <p className="text-sm text-[var(--color-ink-secondary)] whitespace-pre-wrap leading-relaxed">
            {entry.question_text}
          </p>
        </div>
      )}

      {/* Essay Content */}
      {entry.essay_content && (
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="heading-md">Essay</h2>
            <span className="text-xs text-[var(--color-ink-muted)] font-mono">
              {entry.word_count ?? 0} words
            </span>
          </div>
          <RichTextDisplay html={entry.essay_content} />
        </div>
      )}

      {/* Feedback */}
      <div className="card-base p-5 border-l-4" style={{ borderLeftColor: "#993556" }}>
        <h2 className="heading-md mb-2">Feedback</h2>
        <RichEditField
          table="writing_entries"
          id={entry.id}
          field="feedback"
          value={entry.feedback}
          placeholder="Add feedback…"
          minHeight="100px"
        />
      </div>

      {/* AI Grade */}
      <AiGradeWriting entryId={entry.id} />

      {/* Related Records */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Related Records</h2>
        <RelatedRecords
          sourceTable="writing_entries"
          sourceId={entry.id}
          initialLinks={relatedLinks}
          accentColor="#993556"
        />
      </div>
    </div>
  );
}
