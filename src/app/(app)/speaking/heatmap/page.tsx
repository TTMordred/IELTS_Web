import { createClient } from "@/lib/supabase/server";
import { SPEAKING_CRITERIA, SPEAKING_PART2_CATEGORIES } from "@/lib/constants/speaking-types";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

type CriteriaStats = {
  id: string;
  avg_score: number;
  count: number;
};

type CategoryStats = {
  category: string;
  avg_band: number;
  count: number;
};

async function getHeatmapData(): Promise<{
  criteria: Record<string, CriteriaStats>;
  categories: Record<string, CategoryStats>;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { criteria: {}, categories: {} };

  const [entriesResult, partsResult] = await Promise.all([
    supabase
      .from("speaking_entries")
      .select("fluency_score, lexical_score, grammar_score, pronunciation_score, estimated_band")
      .eq("user_id", user.id)
      .not("estimated_band", "is", null),
    supabase
      .from("speaking_part_details")
      .select(`
        topic_category,
        part,
        entry_id,
        speaking_entries!inner(user_id, estimated_band)
      `)
      .eq("speaking_entries.user_id", user.id)
      .eq("part", 2)
      .not("topic_category", "is", null),
  ]);

  // Aggregate criteria scores
  const criteriaAcc: Record<string, { total: number; count: number }> = {
    fluency: { total: 0, count: 0 },
    lexical: { total: 0, count: 0 },
    grammar: { total: 0, count: 0 },
    pronunciation: { total: 0, count: 0 },
  };

  for (const e of entriesResult.data || []) {
    if (e.fluency_score != null) { criteriaAcc.fluency.total += e.fluency_score; criteriaAcc.fluency.count++; }
    if (e.lexical_score != null) { criteriaAcc.lexical.total += e.lexical_score; criteriaAcc.lexical.count++; }
    if (e.grammar_score != null) { criteriaAcc.grammar.total += e.grammar_score; criteriaAcc.grammar.count++; }
    if (e.pronunciation_score != null) { criteriaAcc.pronunciation.total += e.pronunciation_score; criteriaAcc.pronunciation.count++; }
  }

  const criteria: Record<string, CriteriaStats> = {};
  for (const [key, val] of Object.entries(criteriaAcc)) {
    criteria[key] = {
      id: key,
      avg_score: val.count > 0 ? val.total / val.count : 0,
      count: val.count,
    };
  }

  // Aggregate Part 2 category performance
  type PartRow = {
    topic_category: string | null;
    speaking_entries: { estimated_band: number | null } | { estimated_band: number | null }[];
  };
  const catAcc: Record<string, { total: number; count: number }> = {};
  for (const p of (partsResult.data as PartRow[] | null) || []) {
    const cat = p.topic_category;
    if (!cat) continue;
    const entry = Array.isArray(p.speaking_entries) ? p.speaking_entries[0] : p.speaking_entries;
    const band = entry?.estimated_band;
    if (band == null) continue;
    if (!catAcc[cat]) catAcc[cat] = { total: 0, count: 0 };
    catAcc[cat].total += band;
    catAcc[cat].count++;
  }

  const categories: Record<string, CategoryStats> = {};
  for (const [key, val] of Object.entries(catAcc)) {
    categories[key] = {
      category: key,
      avg_band: val.count > 0 ? val.total / val.count : 0,
      count: val.count,
    };
  }

  return { criteria, categories };
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

export default async function SpeakingHeatmapPage() {
  const { criteria, categories } = await getHeatmapData();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#1D9E75]" />
          Speaking Heatmap
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Average band by criteria and Part 2 topic category. Requires 3+ entries.
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

      {/* Assessment Criteria */}
      <div className="card-base p-5">
        <h2 className="heading-sm mb-3">
          <span className="text-[#1D9E75]">Assessment Criteria</span>
        </h2>
        <div className="grid gap-2">
          {SPEAKING_CRITERIA.map((criterion) => {
            const data = criteria[criterion.id];
            const avg = data?.avg_score || 0;
            const count = data?.count || 0;
            const color = getHeatmapColor(avg, count);
            const label = getHeatmapLabel(avg, count);

            return (
              <div
                key={criterion.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <div
                  className="w-12 h-8 rounded flex items-center justify-center text-xs font-mono font-semibold shrink-0"
                  style={{
                    backgroundColor: color,
                    color: count < 3 ? "var(--color-ink-muted)" : "#fff",
                  }}
                >
                  {label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {criterion.name}
                    <span className="ml-1.5 text-xs text-[var(--color-ink-muted)] font-normal">
                      ({criterion.shortName})
                    </span>
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {count > 0
                      ? `avg ${avg.toFixed(1)} · ${count} ${count === 1 ? "entry" : "entries"}`
                      : "No data yet"}
                  </p>
                </div>
                <span className="text-xs text-[var(--color-ink-muted)] shrink-0 max-w-[160px] text-right hidden sm:block">
                  {criterion.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 2 Topic Categories */}
      <div className="card-base p-5">
        <h2 className="heading-sm mb-3">
          <span className="text-[#1D9E75]">Part 2 — Topic Categories</span>
        </h2>
        <div className="grid gap-2">
          {SPEAKING_PART2_CATEGORIES.map((cat) => {
            const data = categories[cat.id];
            const avg = data?.avg_band || 0;
            const count = data?.count || 0;
            const color = getHeatmapColor(avg, count);
            const label = getHeatmapLabel(avg, count);

            return (
              <div
                key={cat.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <div
                  className="w-12 h-8 rounded flex items-center justify-center text-xs font-mono font-semibold shrink-0"
                  style={{
                    backgroundColor: color,
                    color: count < 3 ? "var(--color-ink-muted)" : "#fff",
                  }}
                >
                  {label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-ink)]">{cat.name}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {count > 0
                      ? `avg band ${avg.toFixed(1)} · ${count} ${count === 1 ? "session" : "sessions"}`
                      : "No data yet"}
                  </p>
                </div>
                <span className="text-xs text-[var(--color-ink-muted)] shrink-0 max-w-[180px] text-right hidden sm:block">
                  {cat.examples}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/speaking"
          className="text-sm text-[var(--color-accent)] hover:underline cursor-pointer"
        >
          Back to Speaking Records
        </Link>
      </div>
    </div>
  );
}
