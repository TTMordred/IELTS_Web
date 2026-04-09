import { createClient } from "@/lib/supabase/server";
import { WRITING_TASK1_TYPES, WRITING_TASK2_TYPES } from "@/lib/constants/writing-types";
import { PenTool } from "lucide-react";
import Link from "next/link";

type SubTypeStats = {
  sub_type: string;
  avg_band: number;
  count: number;
};

async function getHeatmapData(): Promise<Record<string, SubTypeStats>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: entries } = await supabase
    .from("writing_entries")
    .select("sub_type, estimated_band")
    .eq("user_id", user.id)
    .not("estimated_band", "is", null);

  if (!entries) return {};

  const acc: Record<string, { total_band: number; count: number }> = {};
  for (const e of entries) {
    const key = e.sub_type as string;
    if (!acc[key]) acc[key] = { total_band: 0, count: 0 };
    acc[key].total_band += e.estimated_band as number;
    acc[key].count += 1;
  }

  const result: Record<string, SubTypeStats> = {};
  for (const [key, val] of Object.entries(acc)) {
    result[key] = {
      sub_type: key,
      avg_band: val.count > 0 ? val.total_band / val.count : 0,
      count: val.count,
    };
  }
  return result;
}

function getHeatmapColor(avg_band: number, count: number): string {
  if (count < 3) return "var(--color-line)";
  if (avg_band >= 7.0) return "#22C55E";
  if (avg_band >= 5.5) return "#EAB308";
  return "#EF4444";
}

function getHeatmapLabel(avg_band: number, count: number): string {
  if (count < 3) return "—";
  return avg_band.toFixed(1);
}

export default async function WritingHeatmapPage() {
  const heatmapData = await getHeatmapData();

  const groups = [
    { label: "Task 1", types: WRITING_TASK1_TYPES },
    { label: "Task 2", types: WRITING_TASK2_TYPES },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <PenTool className="w-6 h-6 text-[#993556]" />
          Writing Heatmap
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Average estimated band by question sub-type. Requires 3+ entries per type.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-ink-muted)]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#22C55E" }} />
          <span>&ge;7.0 Strong</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#EAB308" }} />
          <span>5.5-6.9 Developing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#EF4444" }} />
          <span>&lt;5.5 Weak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-line)]" />
          <span>&lt;3 entries</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="space-y-4">
        {groups.map(({ label, types }) => (
          <div key={label} className="card-base p-5">
            <h2 className="heading-sm mb-3">
              <span className="text-[#993556]">{label}</span>
            </h2>
            <div className="grid gap-2">
              {types.map((type) => {
                const data = heatmapData[type.id];
                const avg_band = data?.avg_band || 0;
                const count = data?.count || 0;
                const color = getHeatmapColor(avg_band, count);
                const label_text = getHeatmapLabel(avg_band, count);

                return (
                  <div
                    key={type.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                  >
                    <div
                      className="w-12 h-8 rounded flex items-center justify-center text-xs font-mono font-semibold shrink-0"
                      style={{
                        backgroundColor: color,
                        color: count < 3 ? "var(--color-ink-muted)" : "#fff",
                      }}
                    >
                      {label_text}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                        {type.name}
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {count > 0
                          ? `avg band ${avg_band.toFixed(1)} · ${count} ${count === 1 ? "entry" : "entries"}`
                          : "No data yet"}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--color-ink-muted)] shrink-0 max-w-[140px] text-right hidden sm:block">
                      {type.description}
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
          href="/writing"
          className="text-sm text-[var(--color-accent)] hover:underline cursor-pointer"
        >
          Back to Writing Records
        </Link>
      </div>
    </div>
  );
}
