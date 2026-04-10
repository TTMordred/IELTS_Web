import Link from "next/link";
import { getWritingEntries, deleteWritingEntry } from "./actions";
import { Badge } from "@/components/ui/badge";
import { DeleteRecordButton } from "@/components/ui/delete-record-button";
import { PenTool, Plus } from "lucide-react";

function bandToColor(band: number): string {
  if (band >= 8) return "#22c55e";
  if (band >= 7) return "#84cc16";
  if (band >= 6) return "#eab308";
  if (band >= 5) return "#f97316";
  return "#ef4444";
}

export default async function WritingPage() {
  const entries = await getWritingEntries();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg flex items-center gap-2">
            <PenTool className="w-6 h-6 text-[#993556]" />
            Writing Entries
          </h1>
          <p className="text-[var(--color-ink-secondary)] mt-1">
            {entries.length} entries logged
          </p>
        </div>
        <Link
          href="/writing/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium text-sm hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="card-base p-12 text-center">
          <PenTool className="w-10 h-10 text-[var(--color-ink-muted)] mx-auto mb-4" />
          <h2 className="heading-md mb-2">No writing entries yet</h2>
          <p className="text-[var(--color-ink-muted)] mb-6">
            Log your first essay to start tracking writing progress
          </p>
          <Link
            href="/writing/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium text-sm hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log First Essay
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="card-interactive flex items-center gap-4 p-4">
              <Link
                href={`/writing/${entry.id}`}
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
                    {entry.topic || "Untitled Essay"}
                  </p>
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    {entry.date} &middot; {entry.word_count ?? 0} words
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={entry.task_type === "task1" ? "info" : "default"}>
                  {entry.task_type === "task1" ? "T1" : "T2"}
                </Badge>
                {entry.sub_type && (
                  <span className="text-xs text-[var(--color-ink-muted)] hidden sm:inline">
                    {entry.sub_type}
                  </span>
                )}
                <DeleteRecordButton id={entry.id} deleteAction={deleteWritingEntry} label="entry" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
