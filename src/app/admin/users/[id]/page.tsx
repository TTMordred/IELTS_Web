import { getUserDetail } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { bandToColor } from "@/lib/constants/band-tables";
import { getLevel } from "@/lib/constants/gamification";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Headphones, BookOpen, MessageSquare, PenTool, BookMarked, Brain, Flame, Zap, Calendar } from "lucide-react";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getUserDetail(id);
  } catch {
    notFound();
  }

  const { profile, listening, reading, writing, speaking, vocabCount, grammarCount, recentActivity, bands, totalRecords } = data;
  const level = getLevel(profile.total_xp || 0);

  const daysActive = recentActivity.length;
  const totalXPRecent = recentActivity.reduce((sum: number, a: { xp_earned: number }) => sum + a.xp_earned, 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <Link href="/admin/users" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] mb-2 flex items-center gap-1 cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> All Users
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="heading-lg">{profile.display_name || "Unnamed User"}</h1>
            <p className="text-[var(--color-ink-secondary)] mt-1">
              Joined {new Date(profile.created_at).toLocaleDateString()} &middot;
              Last active: {profile.last_active || "Never"} &middot;
              <Badge variant={profile.role === "admin" ? "purple" : "default"} className="ml-2">{profile.role}</Badge>
            </p>
          </div>
          <div className="card-base px-4 py-2 text-center shrink-0">
            <p className="text-xs text-[var(--color-ink-muted)]">{level.title}</p>
            <p className="text-lg font-bold font-mono text-[var(--color-accent)]">Lv.{level.level}</p>
            <p className="text-[0.6rem] text-[var(--color-ink-muted)]">{profile.total_xp} XP</p>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <MiniStat icon={<Zap className="w-4 h-4" />} label="Target Band" value={profile.target_band ? `${profile.target_band}` : "—"} />
        <MiniStat icon={<Flame className="w-4 h-4" />} label="Current Streak" value={`${profile.current_streak}d`} />
        <MiniStat icon={<Flame className="w-4 h-4" />} label="Best Streak" value={`${profile.longest_streak}d`} />
        <MiniStat icon={<Calendar className="w-4 h-4" />} label="Exam Date" value={profile.exam_date || "Not set"} />
        <MiniStat icon={<BookMarked className="w-4 h-4" />} label="Vocab Cards" value={`${vocabCount}`} />
        <MiniStat icon={<Brain className="w-4 h-4" />} label="Grammar Notes" value={`${grammarCount}`} />
      </div>

      {/* Band Summary */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Band Performance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {([
            { label: "Listening", band: bands.listening, color: "#378ADD", count: listening.length },
            { label: "Reading", band: bands.reading, color: "#D85A30", count: reading.length },
            { label: "Writing", band: bands.writing, color: "#993556", count: writing.length },
            { label: "Speaking", band: bands.speaking, color: "#1D9E75", count: speaking.length },
          ] as const).map((s) => (
            <div key={s.label} className="text-center">
              <p className="section-label mb-1">{s.label}</p>
              <p className="text-3xl font-bold font-mono" style={{ color: s.band ? bandToColor(s.band) : "var(--color-ink-muted)" }}>
                {s.band ? s.band.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1">{s.count} records</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity (30 days) */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-2">Recent Activity (30 days)</h2>
        <p className="text-xs text-[var(--color-ink-muted)] mb-4">{daysActive} active days &middot; {totalXPRecent} XP earned</p>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)]">No activity in the last 30 days</p>
        ) : (
          <div className="flex gap-1 flex-wrap">
            {recentActivity.map((a: { date: string; xp_earned: number }) => (
              <div
                key={a.date}
                title={`${a.date}: ${a.xp_earned} XP`}
                className="w-6 h-6 rounded text-[0.5rem] flex items-center justify-center font-mono"
                style={{
                  backgroundColor: a.xp_earned > 50 ? "var(--color-accent)" : a.xp_earned > 20 ? "rgba(34,197,94,0.4)" : "rgba(34,197,94,0.15)",
                  color: a.xp_earned > 50 ? "white" : "var(--color-ink-muted)",
                }}
              >
                {a.xp_earned}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecordList title="Listening Records" icon={<Headphones className="w-5 h-5 text-[#378ADD]" />} records={listening} module="listening" />
        <RecordList title="Reading Records" icon={<BookOpen className="w-5 h-5 text-[#D85A30]" />} records={reading} module="reading" />
        <RecordList title="Speaking Entries" icon={<MessageSquare className="w-5 h-5 text-[#1D9E75]" />} records={speaking} module="speaking" />
        <RecordList title="Writing Entries" icon={<PenTool className="w-5 h-5 text-[#993556]" />} records={writing} module="writing" />
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-base p-3">
      <div className="flex items-center gap-1.5 mb-1 text-[var(--color-ink-muted)]">
        {icon}
        <span className="text-[0.65rem] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-semibold font-mono text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

function RecordList({
  title, icon, records, module,
}: {
  title: string;
  icon: React.ReactNode;
  records: Record<string, unknown>[];
  module: string;
}) {
  return (
    <div className="card-base p-5">
      <h2 className="heading-sm flex items-center gap-2 mb-3">
        {icon} {title}
        <span className="text-xs text-[var(--color-ink-muted)] font-normal">({records.length})</span>
      </h2>
      {records.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">No records</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {records.map((r) => (
            <div key={r.id as string} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors text-sm">
              <span className="text-xs text-[var(--color-ink-muted)] w-20 shrink-0">{r.date as string}</span>
              <span className="flex-1 truncate text-[var(--color-ink)]">
                {(r.test_name as string) || (r.sub_type as string) || (r.type as string) || module}
              </span>
              {r.estimated_band != null && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: bandToColor(r.estimated_band as number) }}>
                  {(r.estimated_band as number).toFixed(1)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
