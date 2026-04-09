import Link from "next/link";
import { getSpeakingEntries } from "./actions";
import { Badge } from "@/components/ui/badge";
import { bandToColor } from "@/lib/constants/band-tables";
import { MessageSquare, Plus } from "lucide-react";
import { SPEAKING_ENTRY_TYPES } from "@/lib/constants/speaking-types";
import { SPEAKING_CRITERIA } from "@/lib/constants/speaking-types";

const MODULE_COLOR = "#1D9E75";

function typeBadgeVariant(type: string) {
  if (type === "real_test") return "success";
  if (type === "mock_test") return "warning";
  return "default";
}

function typeLabel(type: string) {
  return SPEAKING_ENTRY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default async function SpeakingPage() {
  const entries = await getSpeakingEntries();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg flex items-center gap-2">
            <MessageSquare className="w-6 h-6" style={{ color: MODULE_COLOR }} />
            Speaking Records
          </h1>
          <p className="text-[var(--color-ink-secondary)] mt-1">
            {entries.length} records logged
          </p>
        </div>
        <Link
          href="/speaking/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-colors cursor-pointer"
          style={{ backgroundColor: MODULE_COLOR }}
        >
          <Plus className="w-4 h-4" />
          New Record
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="card-base p-12 text-center">
          <MessageSquare
            className="w-10 h-10 mx-auto mb-4"
            style={{ color: "var(--color-ink-muted)" }}
          />
          <h2 className="heading-md mb-2">No speaking records yet</h2>
          <p className="text-[var(--color-ink-muted)] mb-6">
            Log your first speaking session to start tracking progress
          </p>
          <Link
            href="/speaking/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-colors cursor-pointer"
            style={{ backgroundColor: MODULE_COLOR }}
          >
            <Plus className="w-4 h-4" />
            Log First Session
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/speaking/${entry.id}`}
              className="card-interactive flex items-center gap-4 p-4"
            >
              {/* Band badge */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-white text-sm shrink-0"
                style={{
                  backgroundColor: bandToColor(entry.estimated_band || 0),
                }}
              >
                {entry.estimated_band?.toFixed(1) || "—"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-ink)] truncate">
                  {typeLabel(entry.type)}
                </p>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  {entry.date}
                </p>
              </div>

              {/* Criteria mini display */}
              <div className="hidden sm:flex items-center gap-3 shrink-0">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
