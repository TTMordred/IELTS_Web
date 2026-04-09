import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpeakingEntry } from "../actions";
import { Badge } from "@/components/ui/badge";
import { bandToColor } from "@/lib/constants/band-tables";
import {
  SPEAKING_CRITERIA,
  SPEAKING_ENTRY_TYPES,
  SPEAKING_PART2_CATEGORIES,
} from "@/lib/constants/speaking-types";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { InlineEditField } from "@/components/ui/inline-edit-field";
import { getRelatedRecords } from "@/app/(app)/record-links-actions";
import { RelatedRecords } from "@/components/record-links/related-records";
import { AiGradeSpeaking } from "@/components/ai/ai-grade-speaking";

const MODULE_COLOR = "#1D9E75";

function typeLabel(type: string) {
  return SPEAKING_ENTRY_TYPES.find((t) => t.value === type)?.label ?? type;
}

function typeBadgeVariant(type: string) {
  if (type === "real_test") return "success";
  if (type === "mock_test") return "warning";
  return "default";
}

function categoryLabel(id: string) {
  return SPEAKING_PART2_CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export default async function SpeakingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getSpeakingEntry(id);
  } catch {
    notFound();
  }

  const { entry, parts, recordingSignedUrl } = data;
  if (!entry) notFound();

  const relatedLinks = await getRelatedRecords("speaking_entries", entry.id);

  const criteriaScores = [
    { ...SPEAKING_CRITERIA[0], score: entry.fluency_score },
    { ...SPEAKING_CRITERIA[1], score: entry.lexical_score },
    { ...SPEAKING_CRITERIA[2], score: entry.grammar_score },
    { ...SPEAKING_CRITERIA[3], score: entry.pronunciation_score },
  ];

  const part1 = parts.find((p: { part: number }) => p.part === 1);
  const part2 = parts.find((p: { part: number }) => p.part === 2);
  const part3 = parts.find((p: { part: number }) => p.part === 3);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <Link
          href="/speaking"
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer mb-2 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> All Records
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="heading-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" style={{ color: MODULE_COLOR }} />
              {typeLabel(entry.type)}
            </h1>
            <p className="text-[var(--color-ink-secondary)] mt-1">
              {entry.date}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant={typeBadgeVariant(entry.type)}>
              {typeLabel(entry.type)}
            </Badge>
            <div
              className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white"
              style={{ backgroundColor: bandToColor(entry.estimated_band || 0) }}
            >
              <span className="text-xl font-bold font-mono">
                {entry.estimated_band?.toFixed(1) ?? "—"}
              </span>
              <span className="text-[0.6rem] uppercase opacity-80">Band</span>
            </div>
          </div>
        </div>
      </div>

      {/* Criteria scores */}
      <div className="card-base p-5">
        <h2 className="heading-sm mb-4">Criteria Scores</h2>
        <div className="space-y-3">
          {criteriaScores.map((c) => {
            const pct = c.score != null ? ((c.score - 1) / 8) * 100 : 0;
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    {c.name}
                  </span>
                  <span
                    className="text-sm font-mono font-bold"
                    style={{ color: MODULE_COLOR }}
                  >
                    {c.score ?? "—"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-line)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: MODULE_COLOR,
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  {c.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Summary row */}
        <div className="mt-5 pt-4 border-t border-[var(--color-line)] grid grid-cols-4 gap-2 text-center">
          {criteriaScores.map((c) => (
            <div key={c.id}>
              <p className="section-label">{c.shortName}</p>
              <p
                className="text-lg font-bold font-mono"
                style={{ color: MODULE_COLOR }}
              >
                {c.score ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Part details */}
      {parts.length > 0 && (
        <div className="space-y-3">
          <h2 className="heading-md">Part Details</h2>

          {part1 && (
            <div className="card-base p-5">
              <h3 className="heading-sm mb-2">
                <span style={{ color: MODULE_COLOR }}>Part 1</span> — Topics Discussed
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {part1.topic
                  ?.split(", ")
                  .filter(Boolean)
                  .map((t: string) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: MODULE_COLOR }}
                    >
                      {t}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {part2 && (
            <div className="card-base p-5">
              <h3 className="heading-sm mb-2">
                <span style={{ color: MODULE_COLOR }}>Part 2</span> — Cue Card
              </h3>
              {part2.topic_category && (
                <p className="text-xs text-[var(--color-ink-muted)] mb-1">
                  Category: {categoryLabel(part2.topic_category)}
                </p>
              )}
              <p className="text-sm text-[var(--color-ink)]">{part2.topic}</p>
            </div>
          )}

          {part3 && (
            <div className="card-base p-5">
              <h3 className="heading-sm mb-2">
                <span style={{ color: MODULE_COLOR }}>Part 3</span> — Discussion Notes
              </h3>
              <p className="text-sm text-[var(--color-ink-secondary)] whitespace-pre-wrap">
                {part3.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reflection */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-2">Reflection</h2>
        <div className="text-sm text-[var(--color-ink-secondary)] whitespace-pre-wrap">
          <InlineEditField
            table="speaking_entries"
            id={entry.id}
            field="reflection"
            value={entry.reflection}
            type="textarea"
            placeholder="Add a reflection..."
          />
        </div>
      </div>

      {/* Practice Recording */}
      {recordingSignedUrl && (
        <div className="card-base p-4">
          <h3 className="heading-sm mb-3">Practice Recording</h3>
          <audio controls src={recordingSignedUrl} className="w-full" />
        </div>
      )}

      {/* AI Evaluate */}
      <AiGradeSpeaking entryId={entry.id} />

      {/* Related Records */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Related Records</h2>
        <RelatedRecords
          sourceTable="speaking_entries"
          sourceId={entry.id}
          initialLinks={relatedLinks}
          accentColor="#1D9E75"
        />
      </div>
    </div>
  );
}
