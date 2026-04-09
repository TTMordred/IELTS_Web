import Link from "next/link";
import { notFound } from "next/navigation";
import { getListeningRecord } from "../actions";
import { Badge } from "@/components/ui/badge";
import { bandToColor } from "@/lib/constants/band-tables";
import { QUESTION_TYPE_BY_ID } from "@/lib/constants/listening-types";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { InlineEditField } from "@/components/ui/inline-edit-field";
import { getRelatedRecords } from "@/app/(app)/record-links-actions";
import { RelatedRecords } from "@/components/record-links/related-records";

export default async function ListeningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getListeningRecord(id);
  } catch {
    notFound();
  }

  const { record, sections } = data;
  if (!record) notFound();

  const relatedLinks = await getRelatedRecords("listening_records", record.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <Link
          href="/listening"
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer mb-2 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> All Records
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="heading-lg">
              <InlineEditField
                table="listening_records"
                id={record.id}
                field="test_name"
                value={record.test_name}
                placeholder="Untitled Test"
                displayClassName="heading-lg"
              />
            </h1>
            <p className="text-[var(--color-ink-secondary)] mt-1">
              {record.date} &middot;{" "}
              <InlineEditField
                table="listening_records"
                id={record.id}
                field="source"
                value={record.source}
                placeholder="Source"
              />
              {record.link && (
                <a
                  href={record.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 text-[var(--color-accent)] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
              )}
            </p>
          </div>
          <div
            className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shrink-0"
            style={{ backgroundColor: bandToColor(record.estimated_band || 0) }}
          >
            <span className="text-xl font-bold font-mono">{record.estimated_band?.toFixed(1)}</span>
            <span className="text-[0.6rem] uppercase opacity-80">Band</span>
          </div>
        </div>
      </div>

      {/* Score Overview */}
      <div className="card-base p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="section-label">Score</p>
            <p className="text-2xl font-bold font-mono text-[var(--color-ink)]">
              {record.total_score}<span className="text-base text-[var(--color-ink-muted)]">/40</span>
            </p>
          </div>
          <div>
            <p className="section-label">Band</p>
            <p className="text-2xl font-bold font-mono" style={{ color: bandToColor(record.estimated_band || 0) }}>
              {record.estimated_band?.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="section-label">Rating</p>
            <p className="text-2xl">
              {record.self_rating ? "★".repeat(record.self_rating) + "☆".repeat(5 - record.self_rating) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Section Breakdown */}
      {sections.length > 0 && (
        <div className="space-y-3">
          <h2 className="heading-md">Section Breakdown</h2>
          {sections.map((section: Record<string, unknown>) => (
            <div key={section.id as string} className="card-base p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="heading-sm">
                  <span className="text-[#378ADD]">Section {section.section as number}</span>
                </h3>
                <span className="font-mono font-semibold text-[var(--color-ink)]">
                  {section.section_score as number}/10
                </span>
              </div>

              {/* Type Results */}
              {(section.listening_type_results as Record<string, unknown>[])?.length > 0 && (
                <div className="space-y-2 mt-3">
                  {(section.listening_type_results as Record<string, unknown>[]).map((tr) => {
                    const typeInfo = QUESTION_TYPE_BY_ID[tr.question_type as string];
                    const accuracy = (tr.total as number) > 0 ? ((tr.correct as number) / (tr.total as number)) * 100 : 0;
                    return (
                      <div key={tr.id as string} className="flex items-center gap-3 text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="text-[var(--color-ink)]">
                            {typeInfo?.name || (tr.question_type as string)}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                          {tr.correct as number}/{tr.total as number}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${accuracy}%`,
                              backgroundColor: accuracy >= 75 ? "#22C55E" : accuracy >= 50 ? "#EAB308" : "#EF4444",
                            }}
                          />
                        </div>
                        <Badge variant={accuracy >= 75 ? "success" : accuracy >= 50 ? "warning" : "error"}>
                          {accuracy.toFixed(0)}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {(section.notes as string) && (
                <p className="text-sm text-[var(--color-ink-secondary)] mt-3 italic">
                  {section.notes as string}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reflection */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-2">Reflection</h2>
        <div className="text-sm text-[var(--color-ink-secondary)] whitespace-pre-wrap">
          <InlineEditField
            table="listening_records"
            id={record.id}
            field="reflection"
            value={record.reflection}
            type="textarea"
            placeholder="Add a reflection..."
          />
        </div>
      </div>

      {/* Related Records */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Related Records</h2>
        <RelatedRecords
          sourceTable="listening_records"
          sourceId={record.id}
          initialLinks={relatedLinks}
          accentColor="#378ADD"
        />
      </div>
    </div>
  );
}
