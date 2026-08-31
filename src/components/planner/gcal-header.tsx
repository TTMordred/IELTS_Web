"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CloudOff,
  LogOut,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  disconnectGoogleCalendar,
  syncAllSessionsToCalendar,
} from "@/app/(app)/planner/actions";
import type { GcalState } from "@/lib/gcal";

export function GcalHeader({
  state,
  notice,
}: {
  state: GcalState;
  notice?: string | null;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (notice === "connected") toast.success("Google Calendar connected");
    else if (notice === "disconnected")
      toast.success("Google Calendar disconnected");
    else if (notice === "error") toast.error("Google Calendar connection failed");
    else if (notice === "no-settings")
      toast.error("Google Calendar is not configured yet");
  }, [notice]);

  async function handleDisconnect() {
    const ok = window.confirm(
      "Disconnect this Google Calendar? All planner sessions will be permanently deleted and their events removed from your calendar. You can connect a different account afterward."
    );
    if (!ok) return;
    setDisconnecting(true);
    try {
      await disconnectGoogleCalendar();
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to disconnect Google Calendar");
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleBackfill() {
    setBackfilling(true);
    try {
      const { synced } = await syncAllSessionsToCalendar();
      toast.success(`Synced ${synced} session${synced === 1 ? "" : "s"} to your calendar`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Sync to calendar failed — Google Calendar is not connected");
    } finally {
      setBackfilling(false);
    }
  }

  if (state.connected) {
    return (
      <div className="card-base p-4">
        {!state.scopeOk && (
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-800">
              Re-connect to enable syncing sessions to your calendar.
            </p>
            <a
              href="/auth/google-calendar"
              className="px-2.5 py-1 rounded-md text-xs font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
            >
              Re-connect
            </a>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium flex items-center gap-2 text-[var(--color-ink)]">
              <CalendarDays className="w-4 h-4 text-[var(--color-accent)]" />
              What are you doing today?
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              {state.events.length} event{state.events.length === 1 ? "" : "s"}{" "}
              from your Google Calendar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackfill}
              disabled={backfilling || !state.scopeOk}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-accent)] border border-[var(--color-accent)]/40 hover:bg-[var(--color-accent-light)] disabled:opacity-50 transition-colors cursor-pointer"
              title="Push every session that has no calendar event yet"
            >
              {backfilling ? "Syncing…" : "Sync all to calendar"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-ink-muted)] border border-[var(--color-line)] hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              title="Disconnect and connect a different Google account"
            >
              <LogOut className="w-3.5 h-3.5" />
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        </div>

        {state.events.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {state.events.map((e, i) => {
              const chip = (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                  {e.start && (
                    <span className="font-semibold opacity-70">{e.start} · </span>
                  )}
                  {e.summary}
                  {e.sessionId && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-[var(--color-accent)] text-white px-1 py-0.5 text-[0.6rem] font-medium">
                      In planner
                    </span>
                  )}
                </span>
              );
              return e.sessionId && e.date ? (
                <button
                  key={i}
                  onClick={() =>
                    router.push(`/planner?highlight=${e.sessionId}&date=${e.date}`)
                  }
                  className="group inline-flex items-center gap-1 cursor-pointer"
                  title="Open in planner"
                >
                  {chip}
                  <ArrowRight className="w-3 h-3 text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                </button>
              ) : (
                <span key={i}>{chip}</span>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Not connected ──────────────────────────────────────────

  if (state.reason === "no-settings") {
    return (
      <div className="card-base p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">
            Google Calendar not configured
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Set the Google OAuth <code>client_id</code> in the{" "}
            <code>google_oauth_settings</code> table. See docs/gcal-setup.md.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-base p-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
          <CloudOff className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">
            Connect Google Calendar
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Link your calendar to see today&apos;s events and sync them into
            your planner.
          </p>
        </div>
      </div>
      <a
        href="/auth/google-calendar"
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
      >
        Connect
      </a>
    </div>
  );
}
