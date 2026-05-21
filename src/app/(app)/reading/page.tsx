import Link from "next/link";
import { getReadingRecords, deleteReadingRecord } from "./actions";
import { Badge } from "@/components/ui/badge";
import { DeleteRecordButton } from "@/components/ui/delete-record-button";
import { bandToColor } from "@/lib/constants/band-tables";
import { BookOpen, Plus } from "lucide-react";
import { ReadingIllustration } from "@/components/ui/module-illustrations";

export default async function ReadingPage() {
  const records = await getReadingRecords();

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Module Header */}
      <div className="relative overflow-hidden rounded-2xl p-6" style={{
        background: "linear-gradient(135deg, #7a2e14 0%, #D85A30 60%, #e07a54 100%)",
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
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Reading Records</h1>
              <p className="text-white/60 text-sm mt-0.5">
                {records.length} {records.length === 1 ? "record" : "records"} logged
              </p>
            </div>
          </div>
          <Link
            href="/reading/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/15 backdrop-blur-sm text-white font-medium text-sm hover:bg-white/25 transition-colors cursor-pointer border border-white/10"
          >
            <Plus className="w-4 h-4" />
            New Record
          </Link>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card-base p-12 text-center">
          <ReadingIllustration className="w-48 h-36 mx-auto mb-2" />
          <h2 className="heading-md mb-2">No reading records yet</h2>
          <p className="text-[var(--color-ink-muted)] mb-6">
            Log your first reading test to start tracking progress
          </p>
          <Link
            href="/reading/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium text-sm hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log First Test
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="card-interactive flex items-center gap-4 p-4">
              <Link
                href={`/reading/${record.id}`}
                className="flex items-center gap-4 flex-1 min-w-0"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: bandToColor(record.estimated_band || 0) }}
                >
                  {record.estimated_band?.toFixed(1) || "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-ink)] truncate">
                    {record.test_name || "Untitled Test"}
                  </p>
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    {record.date} &middot; {record.total_score}/40
                    {record.total_time_min && ` · ${record.total_time_min} min`}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={record.source === "cambridge" ? "info" : "default"}>
                  {record.source}
                </Badge>
                {record.self_rating && (
                  <span className="text-xs text-[var(--color-ink-muted)]">
                    {"★".repeat(record.self_rating)}
                  </span>
                )}
                <DeleteRecordButton id={record.id} deleteAction={deleteReadingRecord} label="record" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
