import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type ModuleStats = {
  avg: number | null;
  count: number;
};

type Snapshot = {
  display_name: string;
  target_band: number | null;
  current_est_band: number | null;
  current_streak: number;
  listening_avg: number | null;
  reading_avg: number | null;
  writing_avg: number | null;
  speaking_avg: number | null;
  listening_count: number;
  reading_count: number;
  writing_count: number;
  speaking_count: number;
};

type ViewConfig = {
  modules: string[];
  showHeatmap: boolean;
  showTrends: boolean;
  snapshot?: Snapshot;
};

const MODULE_COLORS: Record<string, string> = {
  listening: "#378ADD",
  reading: "#D85A30",
  writing: "#993556",
  speaking: "#1D9E75",
};

const MODULE_LABELS: Record<string, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

function BandBadge({ band }: { band: number | null }) {
  if (band === null) return <span className="text-[var(--color-ink-muted)]">—</span>;
  return (
    <span className="font-bold text-[var(--color-ink)]">{band.toFixed(1)}</span>
  );
}

function ModuleCard({
  module,
  avg,
  count,
}: {
  module: string;
  avg: number | null;
  count: number;
}) {
  const color = MODULE_COLORS[module] ?? "#888";
  const label = MODULE_LABELS[module] ?? module;

  return (
    <div
      className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-4"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color }}
      >
        {label}
      </p>
      <p className="text-3xl font-bold text-[var(--color-ink)]">
        {avg !== null ? avg.toFixed(1) : "—"}
      </p>
      <p className="text-xs text-[var(--color-ink-muted)] mt-1">
        avg band · {count} {count === 1 ? "record" : "records"}
      </p>
    </div>
  );
}

export default async function SharedViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: shareLink, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !shareLink) {
    notFound();
  }

  // Check expiry
  const isExpired = new Date(shareLink.expires_at) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="heading-lg mb-2">This link has expired</h1>
          <p className="text-[var(--color-ink-secondary)]">
            This shared view link is no longer valid. Ask the student to generate a new one.
          </p>
        </div>
      </div>
    );
  }

  const config = shareLink.view_config as ViewConfig;
  const snapshot = config?.snapshot;

  const modules = config?.modules ?? ["listening", "reading", "writing", "speaking"];

  const moduleStats: Record<string, ModuleStats> = {
    listening: { avg: snapshot?.listening_avg ?? null, count: snapshot?.listening_count ?? 0 },
    reading: { avg: snapshot?.reading_avg ?? null, count: snapshot?.reading_count ?? 0 },
    writing: { avg: snapshot?.writing_avg ?? null, count: snapshot?.writing_count ?? 0 },
    speaking: { avg: snapshot?.speaking_avg ?? null, count: snapshot?.speaking_count ?? 0 },
  };

  const expiresDate = new Date(shareLink.expires_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      {/* Header */}
      <header className="border-b border-[var(--color-line)] bg-[var(--color-card)] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">IH</span>
            </div>
            <span className="heading-sm text-[var(--color-ink)]">IELTS Hub</span>
          </div>
          <span className="text-xs text-[var(--color-ink-muted)]">
            Read-only · expires {expiresDate}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Profile */}
        <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="heading-lg">
                {snapshot?.display_name ?? "Student"}
              </h1>
              <p className="text-[var(--color-ink-secondary)] text-sm mt-0.5">
                IELTS Self-Study Progress
              </p>
            </div>
            <div className="text-right shrink-0">
              {snapshot?.target_band && (
                <div className="text-sm text-[var(--color-ink-secondary)]">
                  Target:{" "}
                  <span className="font-semibold text-[var(--color-ink)]">
                    {snapshot.target_band}
                  </span>
                </div>
              )}
              {snapshot?.current_est_band && (
                <div className="text-sm text-[var(--color-ink-secondary)] mt-0.5">
                  Est. Overall:{" "}
                  <span className="font-semibold text-[var(--color-accent)]">
                    {snapshot.current_est_band}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Streak */}
          {(snapshot?.current_streak ?? 0) > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-ink-secondary)]">
              <span>🔥</span>
              <span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {snapshot!.current_streak}
                </span>{" "}
                day streak
              </span>
            </div>
          )}
        </div>

        {/* Module Stats */}
        <div>
          <h2 className="heading-md mb-3">Module Performance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {modules.map((module) => {
              const stats = moduleStats[module];
              if (!stats) return null;
              return (
                <ModuleCard
                  key={module}
                  module={module}
                  avg={stats.avg}
                  count={stats.count}
                />
              );
            })}
          </div>
        </div>

        {/* Record Counts Summary */}
        <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="heading-md mb-4">Activity Summary</h2>
          <div className="divide-y divide-[var(--color-line-light)]">
            {modules.map((module) => {
              const stats = moduleStats[module];
              const color = MODULE_COLORS[module] ?? "#888";
              const label = MODULE_LABELS[module] ?? module;
              if (!stats) return null;
              return (
                <div key={module} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="text-sm text-[var(--color-ink)]">{label}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-[var(--color-ink-secondary)]">
                      {stats.count} {stats.count === 1 ? "record" : "records"}
                    </span>
                    <span className="font-semibold text-[var(--color-ink)] w-10 text-right">
                      <BandBadge band={stats.avg} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-[var(--color-ink-muted)]">
          This is a snapshot generated on{" "}
          {new Date(shareLink.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          . Data may not reflect the latest activity.
        </p>
      </main>
    </div>
  );
}
