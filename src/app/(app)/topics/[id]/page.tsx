import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicRecords } from "../actions";
import { Badge } from "@/components/ui/badge";
import { bandToColor } from "@/lib/constants/band-tables";
import { SPEAKING_CRITERIA, SPEAKING_ENTRY_TYPES } from "@/lib/constants/speaking-types";
import { speakingRecordLabel } from "@/lib/speaking/record-name";
import { ChevronLeft, FolderOpen } from "lucide-react";

const PART_LABELS: Record<number, string> = {
  1: "Part 1",
  2: "Part 2",
  3: "Part 3",
};

function typeBadgeVariant(type: string) {
  if (type === "real_test") return "success";
  if (type === "mock_test") return "warning";
  return "default";
}

function typeLabel(type: string) {
  return SPEAKING_ENTRY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getTopicRecords(id);
  } catch {
    notFound();
  }
  if (!data) notFound();

  const { topic, records } = data;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Link
        href="/topics"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Topic Bank
      </Link>

      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-[var(--color-accent)]" />
          {topic.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {topic.part ? (
            <span className="rounded-full bg-[var(--color-accent-light)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
              {PART_LABELS[topic.part]}
            </span>
          ) : null}
          {topic.category ? (
            <span className="text-[var(--color-ink-muted)]">{topic.category}</span>
          ) : null}
          <span className="text-[var(--color-ink-muted)]">
            {records.length} {records.length === 1 ? "record" : "records"} prepared in Speaking
          </span>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card-base p-12 text-center">
          <h2 className="heading-md mb-2">No records for this topic yet</h2>
          <p className="text-[var(--color-ink-muted)] mb-6">
            Log a Speaking session that answers this topic to see it here.
          </p>
          <Link
            href="/speaking/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-colors cursor-pointer"
            style={{ backgroundColor: "#1D9E75" }}
          >
            New Record
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((entry) => (
            <div key={entry.id} className="card-interactive flex items-center gap-4 p-4">
              <Link
                href={`/speaking/${entry.id}`}
                className="flex items-center gap-4 flex-1 min-w-0"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: bandToColor(entry.estimated_band || 0) }}
                >
                  {entry.estimated_band?.toFixed(1) || "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-ink)] truncate">
                    {speakingRecordLabel(entry.name, entry.type, entry.date)}
                  </p>
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    {entry.date}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                {entry.parts.length > 0 ? (
                  <div className="hidden sm:flex flex-wrap items-center gap-1">
                    {entry.parts.map((part) => (
                      <span
                        key={part}
                        className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-ink-muted)]"
                      >
                        {PART_LABELS[part]}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="hidden md:flex items-center gap-3">
                  {SPEAKING_CRITERIA.map((c) => {
                    const score =
                      c.id === "fluency"
                        ? entry.fluency_score
                        : c.id === "lexical"
                          ? entry.lexical_score
                          : c.id === "grammar"
                            ? entry.grammar_score
                            : entry.pronunciation_score;
                    return (
                      <div key={c.id} className="text-center">
                        <p className="text-[0.65rem] text-[var(--color-ink-muted)] uppercase tracking-wide">
                          {c.shortName}
                        </p>
                        <p className="text-sm font-mono font-semibold text-[var(--color-ink)]">
                          {score ?? "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <Badge variant={typeBadgeVariant(entry.type)}>
                  {typeLabel(entry.type)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
