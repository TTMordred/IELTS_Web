import Link from "next/link";
import { getWritingEntries, deleteWritingEntry } from "./actions";
import { Badge } from "@/components/ui/badge";
import { DeleteRecordButton } from "@/components/ui/delete-record-button";
import { PenTool, Plus } from "lucide-react";
import { WritingIllustration } from "@/components/ui/module-illustrations";

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
      {/* Module Header */}
      <div className="relative overflow-hidden rounded-2xl p-6" style={{
        background: "linear-gradient(135deg, #0a1a14 0%, #1B4D3E 60%, #2a6b52 100%)",
      }}>
        <div className="absolute top-0 right-0 w-40 h-40 opacity-10" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }} />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-15" style={{
          background: "radial-gradient(circle, #ffffff 0%, transparent 70%)",
        }} />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Writing Entries</h1>
              <p className="text-white/60 text-sm mt-0.5">
                {entries.length} {entries.length === 1 ? "entry" : "entries"} logged
              </p>
            </div>
          </div>
          <Link
            href="/writing/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/15 backdrop-blur-sm text-white font-medium text-sm hover:bg-white/25 transition-colors cursor-pointer border border-white/10"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </Link>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card-base p-12 text-center">
          <WritingIllustration className="w-48 h-36 mx-auto mb-2" />
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
