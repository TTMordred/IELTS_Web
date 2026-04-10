import Link from "next/link";
import { getListeningRecords, deleteListeningRecord } from "./actions";
import { Badge } from "@/components/ui/badge";
import { DeleteRecordButton } from "@/components/ui/delete-record-button";
import { bandToColor } from "@/lib/constants/band-tables";
import { Headphones, Plus } from "lucide-react";

export default async function ListeningPage() {
  const records = await getListeningRecords();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg flex items-center gap-2">
            <Headphones className="w-6 h-6 text-[#378ADD]" />
            Listening Records
          </h1>
          <p className="text-[var(--color-ink-secondary)] mt-1">
            {records.length} records logged
          </p>
        </div>
        <Link
          href="/listening/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium text-sm hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Record
        </Link>
      </div>

      {records.length === 0 ? (
        <div className="card-base p-12 text-center">
          <Headphones className="w-10 h-10 text-[var(--color-ink-muted)] mx-auto mb-4" />
          <h2 className="heading-md mb-2">No listening records yet</h2>
          <p className="text-[var(--color-ink-muted)] mb-6">
            Log your first listening test to start tracking progress
          </p>
          <Link
            href="/listening/new"
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
                href={`/listening/${record.id}`}
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
                <DeleteRecordButton id={record.id} deleteAction={deleteListeningRecord} label="record" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
