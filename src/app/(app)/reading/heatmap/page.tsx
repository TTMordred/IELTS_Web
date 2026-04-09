import { createClient } from "@/lib/supabase/server";
import { READING_QUESTION_TYPES } from "@/lib/constants/reading-types";
import { BookOpen } from "lucide-react";
import Link from "next/link";

type TypeAccuracy = {
  question_type: string;
  total_correct: number;
  total_questions: number;
  attempts: number;
  accuracy: number;
};

async function getHeatmapData(): Promise<Record<string, TypeAccuracy>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: results } = await supabase
    .from("reading_type_results")
    .select(`
      question_type,
      correct,
      total,
      passage_detail_id,
      reading_passage_details!inner(
        record_id,
        reading_records!inner(user_id)
      )
    `)
    .eq("reading_passage_details.reading_records.user_id", user.id);

  if (!results) return {};

  const acc: Record<string, TypeAccuracy> = {};
  for (const r of results) {
    const key = r.question_type;
    if (!acc[key]) {
      acc[key] = { question_type: key, total_correct: 0, total_questions: 0, attempts: 0, accuracy: 0 };
    }
    acc[key].total_correct += r.correct;
    acc[key].total_questions += r.total;
    acc[key].attempts += 1;
  }

  for (const key of Object.keys(acc)) {
    acc[key].accuracy = acc[key].total_questions > 0
      ? (acc[key].total_correct / acc[key].total_questions) * 100
      : 0;
  }

  return acc;
}

function getHeatmapColor(accuracy: number, attempts: number): string {
  if (attempts < 3) return "var(--color-line)"; // gray — insufficient data
  if (accuracy >= 75) return "#22C55E"; // green — strong
  if (accuracy >= 50) return "#EAB308"; // yellow — improving
  return "#EF4444"; // red — weak
}

function getHeatmapLabel(accuracy: number, attempts: number): string {
  if (attempts < 3) return "—";
  return `${accuracy.toFixed(0)}%`;
}

// Group types by their group field
const READING_GROUPS = Array.from(
  new Map(READING_QUESTION_TYPES.map((t) => [t.group, t.group])).keys()
).map((group) => ({
  group,
  types: READING_QUESTION_TYPES.filter((t) => t.group === group),
}));

export default async function HeatmapPage() {
  const heatmapData = await getHeatmapData();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#D85A30]" />
          Reading Heatmap
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Question type accuracy across all tests. Click a cell for details.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-ink-muted)]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#22C55E" }} />
          <span>&ge;75% Strong</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#EAB308" }} />
          <span>50-74% Improving</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#EF4444" }} />
          <span>&lt;50% Weak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-line)]" />
          <span>&lt;3 attempts</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="space-y-4">
        {READING_GROUPS.map(({ group, types }) => (
          <div key={group} className="card-base p-5">
            <h2 className="heading-sm mb-3">
              <span className="text-[#D85A30]">{group}</span>
            </h2>
            <div className="grid gap-2">
              {types.map((type) => {
                const data = heatmapData[type.id];
                const accuracy = data?.accuracy || 0;
                const attempts = data?.attempts || 0;
                const color = getHeatmapColor(accuracy, attempts);
                const label = getHeatmapLabel(accuracy, attempts);

                return (
                  <div
                    key={type.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                  >
                    <div
                      className="w-12 h-8 rounded flex items-center justify-center text-xs font-mono font-semibold shrink-0"
                      style={{
                        backgroundColor: color,
                        color: attempts < 3 ? "var(--color-ink-muted)" : "#fff",
                      }}
                    >
                      {label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                        {type.name}
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {attempts > 0
                          ? `${data.total_correct}/${data.total_questions} correct · ${attempts} attempts`
                          : "No data yet"}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--color-ink-muted)] capitalize shrink-0">
                      {type.frequency}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/reading"
          className="text-sm text-[var(--color-accent)] hover:underline cursor-pointer"
        >
          Back to Reading Records
        </Link>
      </div>
    </div>
  );
}
