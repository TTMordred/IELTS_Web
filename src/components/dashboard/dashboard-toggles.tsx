"use client";

import { useState, useSyncExternalStore } from "react";
import { Settings2, X } from "lucide-react";

const WIDGETS = [
  { id: "stats", label: "Stats Cards", default: true },
  { id: "exam_countdown", label: "Exam Countdown", default: true },
  { id: "readiness", label: "Readiness Score", default: true },
  { id: "forecast", label: "Forecast Banner", default: true },
  { id: "digest", label: "Weekly Digest", default: true },
  { id: "modules", label: "Module Cards", default: true },
  { id: "quick_actions", label: "Quick Actions", default: true },
  { id: "streak_calendar", label: "Activity Calendar", default: true },
] as const;

type WidgetConfig = Record<string, boolean>;

function getStoredConfig(): WidgetConfig {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("dashboard-widgets");
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

const subscribe = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

const getSnapshot = () => {
  if (typeof window === "undefined") return "{}";
  return localStorage.getItem("dashboard-widgets") ?? "{}";
};

const getServerSnapshot = () => "{}";

function useStoredConfig(): WidgetConfig {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function useDashboardWidgets() {
  const config = useStoredConfig();

  function isVisible(widgetId: string): boolean {
    const widget = WIDGETS.find((w) => w.id === widgetId);
    return config[widgetId] ?? widget?.default ?? true;
  }

  return { isVisible, loaded: true };
}

export function DashboardToggles() {
  const [open, setOpen] = useState(false);
  const config = useStoredConfig();

  function toggle(widgetId: string) {
    const widget = WIDGETS.find((w) => w.id === widgetId);
    const current = config[widgetId] ?? widget?.default ?? true;
    const next = { ...config, [widgetId]: !current };
    localStorage.setItem("dashboard-widgets", JSON.stringify(next));
    // Dispatch storage event so same-tab listeners (useSyncExternalStore) re-render
    window.dispatchEvent(new Event("storage"));
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] transition-colors cursor-pointer"
        title="Customize dashboard"
      >
        <Settings2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="card-base p-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[var(--color-ink)]">Dashboard Widgets</p>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-[var(--color-surface-hover)] cursor-pointer">
          <X className="w-4 h-4 text-[var(--color-ink-muted)]" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {WIDGETS.map((w) => {
          const visible = config[w.id] ?? w.default;
          return (
            <button
              key={w.id}
              onClick={() => toggle(w.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                visible
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-ink)]"
                  : "border-[var(--color-line)] text-[var(--color-ink-muted)]"
              }`}
            >
              <span className={`w-3 h-3 rounded-sm border ${visible ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-[var(--color-line)]"}`} />
              {w.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
