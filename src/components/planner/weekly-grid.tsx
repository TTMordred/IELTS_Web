"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getWeekPlan,
  addPlanItem,
  togglePlanItem,
  deletePlanItem,
} from "@/app/(app)/planner/actions";
import type { PlanItem } from "@/app/(app)/planner/actions";
import {
  MODULE_COLORS,
  MODULE_LABELS,
  MODULES,
} from "@/lib/planner/modules";
import type { ModuleKey } from "@/lib/planner/modules";
import {
  addDays,
  formatDayDate,
  formatMonthYear,
  getMondayOfCurrentWeek,
  isToday,
} from "@/lib/planner/date";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DURATIONS = [15, 30, 45, 60, 90, 120];

// ─── Add item form ─────────────────────────────────────────

function AddItemForm({
  date,
  onClose,
  onAdd,
}: {
  date: string;
  onClose: () => void;
  onAdd: (item: PlanItem) => void;
}) {
  const [module, setModule] = useState<ModuleKey | "">("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!module) return;
    setLoading(true);
    try {
      const created = await addPlanItem({
        date,
        module,
        topic: topic || undefined,
        duration_min: duration,
      });
      onAdd(created);
      toast.success(`${MODULE_LABELS[module]} session added`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] space-y-2 animate-fade-in-up"
    >
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider">
          New session
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <select
        value={module}
        onChange={(e) => setModule(e.target.value as ModuleKey | "")}
        className="w-full px-2 py-1 rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
      >
        <option value="" disabled>
          Choose module…
        </option>
        {MODULES.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Topic (optional)"
        className="w-full px-2 py-1 rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-xs placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
      />

      <select
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        className="w-full px-2 py-1 rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
      >
        {DURATIONS.map((d) => (
          <option key={d} value={d}>
            {d} min
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={loading || !module}
        className="w-full py-1 rounded text-xs font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Adding…" : "Add"}
      </button>
    </form>
  );
}

// ─── Module card ───────────────────────────────────────────

function ModuleCard({
  item,
  onToggle,
  onDelete,
}: {
  item: PlanItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const color = item.module ? MODULE_COLORS[item.module] : "#94A3B8";
  const label = item.module ? MODULE_LABELS[item.module] : "Imported";

  return (
    <div
      data-session-id={item.id}
      className={cn(
        "group relative rounded-lg p-2 border transition-all",
        item.completed
          ? "opacity-70 border-[var(--color-line)]"
          : "border-transparent"
      )}
      style={{ backgroundColor: `${color}18` }}
    >
      <span
        className="inline-block px-1.5 py-0.5 rounded text-[0.6rem] font-semibold text-white mb-1"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>

      {item.topic && (
        <p
          className={cn(
            "text-xs text-[var(--color-ink)] leading-tight",
            item.completed && "line-through text-[var(--color-ink-muted)]"
          )}
        >
          {item.topic}
        </p>
      )}

      <p className="text-[0.6rem] text-[var(--color-ink-muted)] mt-0.5">
        {item.duration_min} min
      </p>

      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggle(item.id)}
          className={cn(
            "p-0.5 rounded transition-colors cursor-pointer",
            item.completed
              ? "text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
              : "text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
          )}
          title={item.completed ? "Mark incomplete" : "Mark complete"}
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-0.5 rounded text-[var(--color-ink-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {item.completed && (
        <div
          className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#1D9E75" }}
        >
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
}

// ─── Day column ────────────────────────────────────────────

function DayColumn({
  date,
  dayIndex,
  dayItems,
  onAdd,
  onToggle,
  onDelete,
}: {
  date: string;
  dayIndex: number;
  dayItems: PlanItem[];
  onAdd: (date: string, item: PlanItem) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const today = isToday(date);

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "text-center rounded-lg py-1.5 mb-2",
          today && "bg-[var(--color-accent)]/10"
        )}
      >
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            today ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]"
          )}
        >
          {DAY_NAMES[dayIndex]}
        </p>
        <p
          className={cn(
            "text-sm font-medium mt-0.5",
            today ? "text-[var(--color-accent)]" : "text-[var(--color-ink-secondary)]"
          )}
        >
          {formatDayDate(date)}
        </p>
      </div>

      <div
        className={cn(
          "flex-1 rounded-lg border border-dashed border-[var(--color-line)] p-1.5 flex flex-col gap-1.5 transition-colors",
          today && "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5"
        )}
      >
        {dayItems.map((item) => (
          <ModuleCard
            key={item.id}
            item={item}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}

        {showForm ? (
          <AddItemForm
            date={date}
            onClose={() => setShowForm(false)}
            onAdd={(item) => {
              onAdd(date, item);
              setShowForm(false);
            }}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mt-auto h-8 rounded-lg border border-dashed border-[var(--color-line)] flex items-center justify-center gap-1 text-[0.65rem] font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────

export function WeeklyGrid({
  initialItems,
  initialWeekStart,
  initialHighlight = null,
}: {
  initialItems: PlanItem[];
  initialWeekStart: string;
  initialHighlight?: string | null;
}) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [items, setItems] = useState<PlanItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(
    initialHighlight
  );
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!highlighted) return;
    const el = document.querySelector(
      `[data-session-id="${highlighted}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-[var(--color-accent)]");
      highlightTimer.current = setTimeout(() => {
        el.classList.remove("ring-2", "ring-[var(--color-accent)]");
        setHighlighted(null);
      }, 3000);
    }
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    };
  }, [highlighted]);

  const currentMonday = getMondayOfCurrentWeek();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const byDate = useMemo(() => {
    const map = new Map<string, PlanItem[]>();
    for (const item of items) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [items]);

  async function navigateWeek(delta: number) {
    const newStart = addDays(weekStart, delta * 7);
    setLoading(true);
    try {
      const newItems = await getWeekPlan(newStart);
      setWeekStart(newStart);
      setItems(newItems);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load week");
    } finally {
      setLoading(false);
    }
  }

  async function goToCurrentWeek() {
    setLoading(true);
    try {
      const newItems = await getWeekPlan(currentMonday);
      setWeekStart(currentMonday);
      setItems(newItems);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load week");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd(date: string, newItem: PlanItem) {
    setItems((prev) => [...prev, newItem]);
  }

  async function handleToggle(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i))
    );
    try {
      await togglePlanItem(id);
    } catch (err) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i))
      );
      console.error(err);
      toast.error("Failed to update session");
    }
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deletePlanItem(id);
      toast.success("Session deleted");
    } catch (err) {
      const fresh = await getWeekPlan(weekStart);
      setItems(fresh);
      console.error(err);
      toast.error("Failed to delete session");
    }
  }

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--color-ink-secondary)]" />
          </button>

          <button
            onClick={goToCurrentWeek}
            disabled={loading || weekStart === currentMonday}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-40 cursor-pointer"
          >
            This Week
          </button>

          <button
            onClick={() => navigateWeek(1)}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-[var(--color-ink-secondary)]" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-ink-secondary)]">
            {formatMonthYear(weekStart)}
          </span>
          {totalCount > 0 && (
            <span className="text-xs text-[var(--color-ink-muted)]">
              {completedCount}/{totalCount} done
            </span>
          )}
        </div>
      </div>

      {totalCount === 0 && (
        <p className="text-sm text-[var(--color-ink-muted)]">
          No sessions yet — click <b>+ Add</b> on any day to schedule your first
          IELTS session
        </p>
      )}

      <div
        className={cn(
          "card-base p-4 overflow-x-auto",
          loading && "opacity-60 pointer-events-none"
        )}
      >
        <div className="grid grid-cols-7 gap-2 min-w-[840px]">
          {dates.map((date, i) => (
            <DayColumn
              key={date}
              date={date}
              dayIndex={i}
              dayItems={byDate.get(date) ?? []}
              onAdd={handleAdd}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Module legend */}
      <div className="flex flex-wrap gap-3">
        {MODULES.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: m.color }}
            />
            <span className="text-xs text-[var(--color-ink-muted)]">
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
