import { createClient } from "@/lib/supabase/server";
import { BandTrendChart } from "@/components/analytics/band-trend-chart";
import { SkillRadar } from "@/components/analytics/skill-radar";
import { Recommendations } from "@/components/analytics/recommendations";
import { QuestionTypeDNA } from "@/components/analytics/question-type-dna";
import { ConfidenceTrends } from "@/components/analytics/confidence-trends";
import { AnalyticsFilterProvider, AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { AnalyticsConditionalSections } from "@/components/analytics/analytics-view";
import { BarChart3, Lightbulb, Dna, SlidersHorizontal, TrendingUp } from "lucide-react";
import Link from "next/link";

async function getAnalyticsData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [listening, reading, writing, speaking] = await Promise.all([
    supabase.from("listening_records").select("date, estimated_band").eq("user_id", user.id).order("date"),
    supabase.from("reading_records").select("date, estimated_band").eq("user_id", user.id).order("date"),
    supabase.from("writing_entries").select("date, estimated_band").eq("user_id", user.id).order("date"),
    supabase.from("speaking_entries").select("date, estimated_band").eq("user_id", user.id).order("date"),
  ]);

  return {
    listening: listening.data || [],
    reading: reading.data || [],
    writing: writing.data || [],
    speaking: speaking.data || [],
  };
}

function getLatestBand(records: { estimated_band: number | null }[]): number {
  const withBand = records.filter((r) => r.estimated_band != null);
  if (withBand.length === 0) return 0;
  // Weighted avg of last 3
  const last3 = withBand.slice(-3);
  if (last3.length === 1) return last3[0].estimated_band!;
  if (last3.length === 2) return last3[0].estimated_band! * 0.3 + last3[1].estimated_band! * 0.7;
  return last3[0].estimated_band! * 0.2 + last3[1].estimated_band! * 0.3 + last3[2].estimated_band! * 0.5;
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  const skillBands = data ? {
    listening: Math.round(getLatestBand(data.listening) * 2) / 2,
    reading: Math.round(getLatestBand(data.reading) * 2) / 2,
    writing: Math.round(getLatestBand(data.writing) * 2) / 2,
    speaking: Math.round(getLatestBand(data.speaking) * 2) / 2,
  } : { listening: 0, reading: 0, writing: 0, speaking: 0 };

  // Merge all records for trend chart
  const trendData: { date: string; listening?: number; reading?: number; writing?: number; speaking?: number }[] = [];
  const dateMap = new Map<string, { listening?: number; reading?: number; writing?: number; speaking?: number }>();

  if (data) {
    for (const r of data.listening) {
      const entry = dateMap.get(r.date) || {};
      entry.listening = r.estimated_band ?? undefined;
      dateMap.set(r.date, entry);
    }
    for (const r of data.reading) {
      const entry = dateMap.get(r.date) || {};
      entry.reading = r.estimated_band ?? undefined;
      dateMap.set(r.date, entry);
    }
    for (const r of data.writing) {
      const entry = dateMap.get(r.date) || {};
      entry.writing = r.estimated_band ?? undefined;
      dateMap.set(r.date, entry);
    }
    for (const r of data.speaking) {
      const entry = dateMap.get(r.date) || {};
      entry.speaking = r.estimated_band ?? undefined;
      dateMap.set(r.date, entry);
    }

    for (const [date, vals] of Array.from(dateMap.entries()).sort()) {
      trendData.push({ date, ...vals });
    }
  }

  return (
    <AnalyticsFilterProvider>
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[var(--color-accent)]" />
          Analytics
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Band trends and skill overview
        </p>
      </div>

      {/* Interactive Filters */}
      <AnalyticsFilters />

      {/* Skill Bands Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { label: "Listening", band: skillBands.listening, color: "#378ADD" },
          { label: "Reading", band: skillBands.reading, color: "#D85A30" },
          { label: "Writing", band: skillBands.writing, color: "#993556" },
          { label: "Speaking", band: skillBands.speaking, color: "#1D9E75" },
        ] as const).map((skill) => (
          <div key={skill.label} className="card-base p-4 text-center">
            <p className="section-label mb-1">{skill.label}</p>
            <p className="text-2xl font-bold font-mono" style={{ color: skill.color }}>
              {skill.band > 0 ? skill.band.toFixed(1) : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Band Trend Chart */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Band Trend</h2>
        {trendData.length > 0 ? (
          <BandTrendChart data={trendData} />
        ) : (
          <p className="text-sm text-[var(--color-ink-muted)] text-center py-12">
            Log test records to see your band trend over time
          </p>
        )}
      </div>

      {/* Skill Radar */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Skill Balance</h2>
        <SkillRadar data={skillBands} />
      </div>

      {/* Confidence Trends */}
      <div className="card-base p-5">
        <h2 className="heading-md flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" />
          Confidence Trends
        </h2>
        <ConfidenceTrends />
      </div>

      {/* Distribution / Comparison views (conditionally rendered by filter) */}
      <AnalyticsConditionalSections />

      {/* Smart Recommendations */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-md flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Smart Recommendations
          </h2>
        </div>
        <Recommendations />
      </div>

      {/* Question Type DNA */}
      <div className="card-base p-5">
        <h2 className="heading-md flex items-center gap-2 mb-4">
          <Dna className="w-5 h-5 text-purple-500" />
          Question Type DNA
        </h2>
        <QuestionTypeDNA />
      </div>

      {/* Simulator Link */}
      <Link href="/analytics/simulator" className="card-base p-5 flex items-center gap-4 hover:bg-[var(--color-surface)] transition-colors">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-light)] flex items-center justify-center">
          <SlidersHorizontal className="w-5 h-5 text-[var(--color-accent)]" />
        </div>
        <div className="flex-1">
          <h2 className="heading-md">Score Simulator</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">
            Adjust question type accuracy to predict your band change
          </p>
        </div>
        <span className="text-[var(--color-accent)] text-sm font-medium">Open &rarr;</span>
      </Link>
    </div>
    </AnalyticsFilterProvider>
  );
}
