import { getAdminStats, getRecentActivity } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Users, Headphones, BookOpen, PenTool, MessageSquare, BookMarked, Library, Activity, TrendingUp, TrendingDown, Zap, Flame } from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  const [stats, recentActivity] = await Promise.all([
    getAdminStats(),
    getRecentActivity(15),
  ]);

  const overallAvg = [stats.avgBands.listening, stats.avgBands.reading, stats.avgBands.writing, stats.avgBands.speaking]
    .filter((b) => b > 0);
  const platformAvgBand = overallAvg.length > 0
    ? Math.round((overallAvg.reduce((a, b) => a + b, 0) / overallAvg.length) * 2) / 2
    : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg">Admin Overview</h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Platform statistics, user insights, and management
        </p>
      </div>

      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={stats.totalUsers} color="var(--color-accent)" />
        <StatCard icon={<Activity className="w-5 h-5" />} label="Active (7d)" value={stats.activeUsers} color="var(--color-accent)" />
        <StatCard icon={<Zap className="w-5 h-5" />} label="Platform XP" value={stats.totalPlatformXP} color="var(--color-accent)" />
        <StatCard icon={<Flame className="w-5 h-5" />} label="Avg Streak" value={`${stats.avgStreak}d`} color="var(--color-accent)" isText />
      </div>

      {/* Row 2: Platform Band Averages */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Platform Band Averages</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="section-label mb-1">Overall</p>
            <p className="text-3xl font-bold font-mono text-[var(--color-accent)]">{platformAvgBand > 0 ? platformAvgBand.toFixed(1) : "—"}</p>
          </div>
          {([
            { label: "Listening", band: stats.avgBands.listening, color: "#378ADD" },
            { label: "Reading", band: stats.avgBands.reading, color: "#D85A30" },
            { label: "Writing", band: stats.avgBands.writing, color: "#993556" },
            { label: "Speaking", band: stats.avgBands.speaking, color: "#1D9E75" },
          ] as const).map((s) => (
            <div key={s.label} className="text-center">
              <p className="section-label mb-1">{s.label}</p>
              <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.band > 0 ? s.band.toFixed(1) : "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Module Records */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Headphones className="w-5 h-5" />} label="Listening" value={stats.listeningRecords} color="#378ADD" />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Reading" value={stats.readingRecords} color="#D85A30" />
        <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Speaking" value={stats.speakingEntries} color="#1D9E75" />
        <StatCard icon={<PenTool className="w-5 h-5" />} label="Writing" value={stats.writingEntries} color="#993556" />
      </div>

      {/* Row 4: Weakest & Strongest Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-base p-5">
          <h2 className="heading-md flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-red-500" /> Weakest Question Types
          </h2>
          {stats.weakestTypes.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">Not enough data yet</p>
          ) : (
            <div className="space-y-2">
              {stats.weakestTypes.map((t, i) => (
                <div key={t.type} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-ink-muted)] w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-ink)] truncate">{t.type.replace(/_/g, " ")}</p>
                  </div>
                  <div className="w-16 h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${t.accuracy}%` }} />
                  </div>
                  <span className="text-xs font-mono text-red-500 w-10 text-right">{t.accuracy}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-base p-5">
          <h2 className="heading-md flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Strongest Question Types
          </h2>
          {stats.strongestTypes.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">Not enough data yet</p>
          ) : (
            <div className="space-y-2">
              {stats.strongestTypes.map((t, i) => (
                <div key={t.type} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-ink-muted)] w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-ink)] truncate">{t.type.replace(/_/g, " ")}</p>
                  </div>
                  <div className="w-16 h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${t.accuracy}%` }} />
                  </div>
                  <span className="text-xs font-mono text-emerald-500 w-10 text-right">{t.accuracy}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 5: Quick Actions */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-3">Admin Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/forecast" className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-600 text-sm font-medium hover:bg-amber-500/20 transition-colors cursor-pointer">
            Manage Forecast Topics
          </Link>
          <Link href="/admin/topics" className="px-4 py-2 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-ink-secondary)] text-sm font-medium hover:text-[var(--color-ink)] transition-colors cursor-pointer">
            View Topic Bank
          </Link>
          <Link href="/admin/users" className="px-4 py-2 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-ink-secondary)] text-sm font-medium hover:text-[var(--color-ink)] transition-colors cursor-pointer">
            All Users
          </Link>
          <Link href="/admin/settings" className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-500 text-sm font-medium hover:bg-purple-500/20 transition-colors cursor-pointer">
            AI Settings
          </Link>
        </div>
      </div>

      {/* Row 6: Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={<Library className="w-5 h-5" />} label="Topics" value={stats.totalTopics} color="var(--color-accent)" />
        <StatCard icon={<BookMarked className="w-5 h-5" />} label="Vocab Cards" value={stats.vocabCards} color="var(--color-accent)" />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Total Records" value={stats.listeningRecords + stats.readingRecords + stats.writingEntries + stats.speakingEntries} color="var(--color-accent)" />
      </div>

      {/* Row 7: Recent Activity */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Recent Activity (All Users)</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)] text-center py-8">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((entry) => {
              const moduleColors: Record<string, string> = {
                listening: "#378ADD", reading: "#D85A30", speaking: "#1D9E75", writing: "#993556",
              };
              return (
                <div key={`${entry.module}-${entry.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)]">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: moduleColors[entry.module] }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[var(--color-ink)]">
                      {(entry as Record<string, unknown>).test_name as string || (entry as Record<string, unknown>).sub_type as string || entry.module}
                    </span>
                  </div>
                  <Badge variant={entry.module === "listening" ? "info" : entry.module === "reading" ? "warning" : entry.module === "speaking" ? "success" : "purple"}>
                    {entry.module}
                  </Badge>
                  {entry.estimated_band && (
                    <span className="text-sm font-mono text-[var(--color-ink-muted)]">{entry.estimated_band}</span>
                  )}
                  <span className="text-xs text-[var(--color-ink-muted)]">{entry.date}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, isText }: { icon: React.ReactNode; label: string; value: number | string; color: string; isText?: boolean }) {
  return (
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="section-label">{label}</span>
      </div>
      <p className="text-2xl font-bold font-mono text-[var(--color-ink)]">{isText ? value : typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}
