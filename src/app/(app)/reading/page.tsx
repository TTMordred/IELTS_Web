import Link from "next/link";
import { getReadingRecords } from "./actions";
import { Badge } from "@/components/ui/badge";
import { bandToColor } from "@/lib/constants/band-tables";
import { BookOpen, Plus } from "lucide-react";

export default async function ReadingPage() {
  const records = await getReadingRecords();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#D85A30]" />
            Reading Records
          </h1>
          <p className="text-[var(--color-ink-secondary)] mt-1">
            {records.length} records logged
          </p>
        </div>
        <Link
          href="/reading/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium text-sm hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Record
        </Link>
      </div>

      {records.length === 0 ? (
        <div className="card-base p-12 text-center">
          <BookOpen className="w-10 h-10 text-[var(--color-ink-muted)] mx-auto mb-4" />
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
            <Link
              key={record.id}
              href={`/reading/${record.id}`}
              className="card-interactive flex items-center gap-4 p-4"
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
                  {record.total_time_min && ` \u00b7 ${record.total_time_min} min`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={record.source === "cambridge" ? "info" : "default"}>
                  {record.source}
                </Badge>
                {record.self_rating && (
                  <span className="text-xs text-[var(--color-ink-muted)]">
                    {"★".repeat(record.self_rating)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
