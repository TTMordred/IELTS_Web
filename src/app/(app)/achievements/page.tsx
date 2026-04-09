import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BADGES } from "@/lib/constants/gamification";
import { AchievementCard } from "@/components/dashboard/achievement-card";
import {
  Target,
  Flame,
  BookMarked,
  Headphones,
  BookOpen,
  TrendingUp,
  Trophy,
  Brain,
  Map,
  Lock,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  target: Target,
  flame: Flame,
  "book-marked": BookMarked,
  headphones: Headphones,
  "book-open": BookOpen,
  "trending-up": TrendingUp,
  trophy: Trophy,
  brain: Brain,
  map: Map,
};

const CATEGORY_COLORS: Record<string, string> = {
  milestone: "#1B4D3E",
  streak: "#F97316",
  module: "#378ADD",
  band: "#EAB308",
  vocab: "#8B5CF6",
  mastery: "#EC4899",
};

function isEarned(
  badgeId: string,
  stats: {
    totalRecords: number;
    longestStreak: number;
    currentStreak: number;
    vocabCount: number;
    listeningCount: number;
    readingCount: number;
    writingCount: number;
    speakingCount: number;
    avgBandListening: number;
    avgBandReading: number;
    avgBandWriting: number;
    avgBandSpeaking: number;
    hasAllModulesThisWeek: boolean;
  },
): boolean {
  switch (badgeId) {
    case "first_blood":
      return stats.totalRecords >= 1;
    case "streak_7":
      return stats.longestStreak >= 7;
    case "streak_30":
      return stats.longestStreak >= 30;
    case "vocab_100":
      return stats.vocabCount >= 100;
    case "vocab_500":
      return stats.vocabCount >= 500;
    case "listening_20":
      return stats.listeningCount >= 20;
    case "reading_20":
      return stats.readingCount >= 20;
    case "band_6":
      return (
        stats.avgBandListening >= 6.0 ||
        stats.avgBandReading >= 6.0 ||
        stats.avgBandWriting >= 6.0 ||
        stats.avgBandSpeaking >= 6.0
      );
    case "band_7":
      return (
        stats.avgBandListening >= 7.0 ||
        stats.avgBandReading >= 7.0 ||
        stats.avgBandWriting >= 7.0 ||
        stats.avgBandSpeaking >= 7.0
      );
    case "all_rounder":
      return stats.hasAllModulesThisWeek;
    case "grammar_guru":
      // Can't query grammar categories here without extra fetch; unlock at writing >= 14 entries as proxy
      return stats.writingCount >= 14;
    case "map_master":
      // Proxy: user has >= 10 listening records (map labelling is a listening type)
      return stats.listeningCount >= 10;
    default:
      return false;
  }
}

function avgBand(rows: { estimated_band: number | null }[] | null): number {
  const vals = (rows ?? [])
    .map((r) => r.estimated_band)
    .filter((v): v is number => v !== null);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString().slice(0, 10);

  const [
    profileResult,
    listeningCount,
    readingCount,
    writingCount,
    speakingCount,
    vocabCount,
    listeningBands,
    readingBands,
    writingBands,
    speakingBands,
    listeningThisWeek,
    readingThisWeek,
    writingThisWeek,
    speakingThisWeek,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, longest_streak, current_streak, total_xp")
      .eq("id", user.id)
      .single(),
    supabase
      .from("listening_records")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("reading_records")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("writing_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("speaking_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("vocab_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("listening_records")
      .select("estimated_band")
      .eq("user_id", user.id)
      .not("estimated_band", "is", null),
    supabase
      .from("reading_records")
      .select("estimated_band")
      .eq("user_id", user.id)
      .not("estimated_band", "is", null),
    supabase
      .from("writing_entries")
      .select("estimated_band")
      .eq("user_id", user.id)
      .not("estimated_band", "is", null),
    supabase
      .from("speaking_entries")
      .select("estimated_band")
      .eq("user_id", user.id)
      .not("estimated_band", "is", null),
    supabase
      .from("listening_records")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("date", oneWeekAgoStr),
    supabase
      .from("reading_records")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("date", oneWeekAgoStr),
    supabase
      .from("writing_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneWeekAgo.toISOString()),
    supabase
      .from("speaking_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneWeekAgo.toISOString()),
  ]);

  const profile = profileResult.data;
  if (!profile) redirect("/onboarding");

  const totalRecords =
    (listeningCount.count ?? 0) +
    (readingCount.count ?? 0) +
    (writingCount.count ?? 0) +
    (speakingCount.count ?? 0);

  const hasAllModulesThisWeek =
    (listeningThisWeek.count ?? 0) > 0 &&
    (readingThisWeek.count ?? 0) > 0 &&
    (writingThisWeek.count ?? 0) > 0 &&
    (speakingThisWeek.count ?? 0) > 0;

  const stats = {
    totalRecords,
    longestStreak: profile.longest_streak ?? 0,
    currentStreak: profile.current_streak ?? 0,
    vocabCount: vocabCount.count ?? 0,
    listeningCount: listeningCount.count ?? 0,
    readingCount: readingCount.count ?? 0,
    writingCount: writingCount.count ?? 0,
    speakingCount: speakingCount.count ?? 0,
    avgBandListening: avgBand(listeningBands.data),
    avgBandReading: avgBand(readingBands.data),
    avgBandWriting: avgBand(writingBands.data),
    avgBandSpeaking: avgBand(speakingBands.data),
    hasAllModulesThisWeek,
  };

  const earned = BADGES.filter((b) => isEarned(b.id, stats));
  const locked = BADGES.filter((b) => !isEarned(b.id, stats));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Trophy className="w-6 h-6 text-[var(--color-accent)]" />
          Achievements
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          {earned.length} of {BADGES.length} badges earned
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold font-mono text-[var(--color-accent)]">
            {earned.length}
          </p>
          <p className="section-label mt-1">Badges Earned</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold font-mono text-[var(--color-ink)]">
            {profile.longest_streak ?? 0}
          </p>
          <p className="section-label mt-1">Best Streak</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold font-mono text-[var(--color-ink)]">
            {totalRecords}
          </p>
          <p className="section-label mt-1">Total Records</p>
        </div>
      </div>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div className="space-y-3">
          <h2 className="heading-md">Earned</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earned.map((badge) => {
              const Icon = ICON_MAP[badge.icon] ?? Trophy;
              const color = CATEGORY_COLORS[badge.category] ?? "#1B4D3E";
              return (
                <div key={badge.id} className="card-base overflow-hidden">
                  {/* Card top */}
                  <div
                    className="px-5 py-4 flex items-center gap-3"
                    style={{
                      backgroundColor: `${color}15`,
                      borderBottom: `2px solid ${color}30`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color, color: "#fff" }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--color-ink)] leading-tight text-sm">
                        {badge.name}
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                  {/* Share area */}
                  <div className="px-5 py-3">
                    <AchievementCard
                      type="badge_earned"
                      value={badge.name}
                      username={profile.display_name}
                      badgeIcon={badge.icon}
                      date={today}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {locked.length > 0 && (
        <div className="space-y-3">
          <h2 className="heading-md text-[var(--color-ink-muted)]">Locked</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((badge) => {
              const Icon = ICON_MAP[badge.icon] ?? Trophy;
              return (
                <div
                  key={badge.id}
                  className="card-base overflow-hidden opacity-50"
                >
                  <div className="px-5 py-4 flex items-center gap-3 bg-[var(--color-surface-hover)]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[var(--color-line)]">
                      <Lock className="w-4 h-4 text-[var(--color-ink-muted)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--color-ink-secondary)] leading-tight text-sm">
                        {badge.name}
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                        {badge.description}
                      </p>
                    </div>
                    <Icon className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {earned.length === 0 && (
        <div className="card-base p-8 text-center">
          <Trophy className="w-10 h-10 text-[var(--color-ink-muted)] mx-auto mb-3" />
          <p className="heading-sm text-[var(--color-ink-secondary)]">No badges yet</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Start logging records to earn your first badge.
          </p>
        </div>
      )}
    </div>
  );
}
