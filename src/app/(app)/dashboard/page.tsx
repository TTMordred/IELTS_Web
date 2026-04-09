import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLevel } from "@/lib/constants/gamification";
import { Headphones, BookOpen, MessageSquare, PenTool, BookMarked, Plus } from "lucide-react";
import { StreakCalendar } from "@/components/dashboard/streak-calendar";
import { ExamCountdown } from "@/components/dashboard/exam-countdown";
import { ReadinessScore } from "@/components/dashboard/readiness-score";
import { ForecastBanner } from "@/components/dashboard/forecast-banner";
import { WeeklyDigest } from "@/components/dashboard/weekly-digest";
import { GoalTracker } from "@/components/dashboard/goal-tracker";
import { getReadinessData } from "./readiness-action";
import { getWeeklyDigest } from "./digest-action";
import { WidgetSection } from "@/components/dashboard/widget-section";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, target_band, current_streak, longest_streak, total_xp, exam_date")
    .eq("id", user.id)
    .single();

  if (!profile?.display_name) {
    redirect("/onboarding");
  }

  // Fetch counts and activity in parallel
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);

  const [listening, reading, writing, speaking, vocab, activityResult, listeningBands, readingBands, writingBands, speakingBands] = await Promise.all([
    supabase.from("listening_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("reading_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("writing_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("speaking_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("vocab_cards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("daily_activity").select("date, xp_earned").eq("user_id", user.id).gte("date", ninetyDaysAgoStr).order("date", { ascending: true }),
    supabase.from("listening_records").select("estimated_band").eq("user_id", user.id).not("estimated_band", "is", null),
    supabase.from("reading_records").select("estimated_band").eq("user_id", user.id).not("estimated_band", "is", null),
    supabase.from("writing_entries").select("estimated_band").eq("user_id", user.id).not("estimated_band", "is", null),
    supabase.from("speaking_entries").select("estimated_band").eq("user_id", user.id).not("estimated_band", "is", null),
  ]);

  function avgBand(rows: { estimated_band: number | null }[] | null): number {
    const vals = (rows ?? []).map((r) => r.estimated_band).filter((v): v is number => v !== null);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2;
  }

  const goalData = profile.target_band
    ? [
        { module: "Listening", currentBand: avgBand(listeningBands.data), targetBand: profile.target_band },
        { module: "Reading", currentBand: avgBand(readingBands.data), targetBand: profile.target_band },
        { module: "Writing", currentBand: avgBand(writingBands.data), targetBand: profile.target_band },
        { module: "Speaking", currentBand: avgBand(speakingBands.data), targetBand: profile.target_band },
      ]
    : [];

  const activities = activityResult.data ?? [];

  const totalRecords = (listening.count || 0) + (reading.count || 0) + (writing.count || 0) + (speaking.count || 0);
  const level = getLevel(profile.total_xp || 0);
  const readinessData = await getReadinessData();
  const digestData = await getWeeklyDigest();

  // Forecast topics for current quarter
  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}/${new Date().getFullYear()}`;
  const { data: forecastTopics } = await supabase
    .from("global_topics")
    .select("name, part")
    .eq("is_forecast", true)
    .eq("forecast_quarter", currentQuarter);

  // Days until exam (computed server-side, stable per request)
  const now = new Date();
  const daysUntilExam = profile.exam_date
    ? Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - now.getTime()) / 86400000))
    : null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header + Level */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="heading-lg">
            Welcome back, <span className="text-accent">{profile.display_name}</span>
          </h1>
          <p className="text-[var(--color-ink-secondary)] mt-1">
            Track your IELTS progress
          </p>
        </div>
        <div className="card-base px-4 py-2 text-center shrink-0">
          <p className="text-xs text-[var(--color-ink-muted)]">{level.title}</p>
          <p className="text-lg font-bold font-mono text-[var(--color-accent)]">Lv.{level.level}</p>
          <div className="w-20 h-1.5 rounded-full bg-[var(--color-line)] mt-1 overflow-hidden">
            <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${level.progress}%` }} />
          </div>
          <p className="text-[0.6rem] text-[var(--color-ink-muted)] mt-0.5">{profile.total_xp} XP</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Target Band" value={profile.target_band ? `${profile.target_band}` : "—"} />
        <StatCard label="Streak" value={`${profile.current_streak || 0}d`} accent={profile.current_streak > 0} />
        <StatCard label="Records" value={`${totalRecords}`} />
        <StatCard label="Vocab" value={`${vocab.count || 0}`} />
        {daysUntilExam !== null ? (
          <StatCard label="Exam In" value={`${daysUntilExam}d`} accent={daysUntilExam <= 30} />
        ) : (
          <StatCard label="Best Streak" value={`${profile.longest_streak || 0}d`} />
        )}
      </div>

      {/* Exam Countdown (only if exam date set) */}
      <WidgetSection widgetId="exam_countdown">
        {daysUntilExam !== null && (
          <ExamCountdown examDate={profile.exam_date!} daysLeft={daysUntilExam} />
        )}
      </WidgetSection>

      {/* Readiness Score */}
      <WidgetSection widgetId="readiness">
        {readinessData && readinessData.dataPoints > 0 && (
          <ReadinessScore data={readinessData} />
        )}
      </WidgetSection>

      {/* Forecast Banner */}
      <WidgetSection widgetId="forecast">
        {forecastTopics && forecastTopics.length > 0 && (
          <ForecastBanner quarter={currentQuarter} topics={forecastTopics} />
        )}
      </WidgetSection>

      {/* Weekly Digest */}
      <WidgetSection widgetId="digest">
        {digestData && (
          <WeeklyDigest
            thisWeek={digestData.thisWeek}
            lastWeek={digestData.lastWeek}
            weekLabel={digestData.weekLabel}
          />
        )}
      </WidgetSection>

      {/* Module Cards */}
      <WidgetSection widgetId="modules">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModuleCard
          label="Listening"
          count={listening.count || 0}
          href="/listening"
          newHref="/listening/new"
          color="#378ADD"
          icon={<Headphones className="w-5 h-5" />}
        />
        <ModuleCard
          label="Reading"
          count={reading.count || 0}
          href="/reading"
          newHref="/reading/new"
          color="#D85A30"
          icon={<BookOpen className="w-5 h-5" />}
        />
        <ModuleCard
          label="Speaking"
          count={speaking.count || 0}
          href="/speaking"
          newHref="/speaking/new"
          color="#1D9E75"
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <ModuleCard
          label="Writing"
          count={writing.count || 0}
          href="/writing"
          newHref="/writing/new"
          color="#993556"
          icon={<PenTool className="w-5 h-5" />}
        />
      </div>

      </WidgetSection>

      {/* Goal Tracker */}
      {goalData.length > 0 && (
        <GoalTracker goals={goalData} examDate={profile.exam_date ?? null} />
      )}

      {/* Activity Calendar */}
      <WidgetSection widgetId="streak_calendar">
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Activity Calendar</h2>
        <StreakCalendar activities={activities} />
      </div>
      </WidgetSection>

      {/* Quick Actions */}
      <WidgetSection widgetId="quick_actions">
      <div className="card-base p-5">
        <h2 className="heading-sm mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/listening/new" label="Log Listening" icon={<Headphones className="w-4 h-4" />} />
          <QuickAction href="/reading/new" label="Log Reading" icon={<BookOpen className="w-4 h-4" />} />
          <QuickAction href="/vocab" label="Add Vocab" icon={<BookMarked className="w-4 h-4" />} />
          <QuickAction href="/vocab/review" label="Review Vocab" icon={<BookMarked className="w-4 h-4" />} />
        </div>
      </div>
      </WidgetSection>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-base p-4">
      <p className="section-label mb-1">{label}</p>
      <p className={`text-xl font-semibold font-mono ${accent ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"}`}>
        {value}
      </p>
    </div>
  );
}

function ModuleCard({
  label, count, href, newHref, color, icon,
}: {
  label: string; count: number; href: string; newHref: string; color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-base p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color }}>
          {icon}
          <span className="font-medium text-sm text-[var(--color-ink)]">{label}</span>
        </div>
        <span className="text-lg font-bold font-mono text-[var(--color-ink)]">{count}</span>
      </div>
      <div className="flex gap-2">
        <Link
          href={href}
          className="flex-1 text-center text-xs py-1.5 rounded-md bg-[var(--color-surface-hover)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
        >
          View
        </Link>
        <Link
          href={newHref}
          className="flex items-center justify-center gap-1 flex-1 text-xs py-1.5 rounded-md text-white transition-colors cursor-pointer"
          style={{ backgroundColor: color }}
        >
          <Plus className="w-3 h-3" /> New
        </Link>
      </div>
    </div>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors text-sm cursor-pointer"
    >
      {icon}
      {label}
    </Link>
  );
}
