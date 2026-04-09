"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getWeekPlan,
  addPlanItem,
  togglePlanItem,
  deletePlanItem,
} from "@/app/(app)/planner/actions";
import type { PlanItem, AddPlanItemInput } from "@/app/(app)/planner/actions";

// ─── Constants ────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  listening: "#378ADD",
  reading: "#D85A30",
  speaking: "#1D9E75",
  writing: "#993556",
  vocab: "var(--color-accent)",
  grammar: "#7C3AED",
};

const MODULE_LABELS: Record<string, string> = {
  listening: "Listening",
  reading: "Reading",
  speaking: "Speaking",
  writing: "Writing",
  vocab: "Vocab",
  grammar: "Grammar",
};

const TIME_SLOTS = ["morning", "afternoon", "evening"] as const;
type TimeSlot = typeof TIME_SLOTS[number];

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Helpers ──────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDate().toString();
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

// ─── Sub-components ───────────────────────────────────────────

type AddFormState = { date: string; time_slot: TimeSlot } | null;

function AddItemForm({
  date,
  timeSlot,
  onClose,
  onAdd,
}: {
  date: string;
  timeSlot: TimeSlot;
  onClose: () => void;
  onAdd: (item: PlanItem) => void;
}) {
  const [module, setModule] = useState<AddPlanItemInput["module"]>("listening");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await addPlanItem({ date, time_slot: timeSlot, module, topic: topic || undefined, duration_min: duration });
      onAdd({
        id: crypto.randomUUID(),
        user_id: "",
        date,
        time_slot: timeSlot,
        module,
        topic: topic || null,
        duration_min: duration,
        completed: false,
        created_at: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-1 p-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] space-y-2 animate-fade-in-up"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[var(--color-ink-secondary)]">New session</span>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Module selector */}
      <div className="grid grid-cols-3 gap-1">
        {Object.keys(MODULE_LABELS).map((mod) => (
          <button
            key={mod}
            type="button"
            onClick={() => setModule(mod as AddPlanItemInput["module"])}
            className={cn(
              "px-1.5 py-1 rounded text-[0.65rem] font-medium transition-all cursor-pointer",
              module === mod
                ? "text-white"
                : "bg-[var(--color-surface-hover)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
            )}
            style={module === mod ? { backgroundColor: MODULE_COLORS[mod] } : undefined}
          >
            {MODULE_LABELS[mod]}
          </button>
        ))}
      </div>

      {/* Topic */}
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Topic (optional)"
        className="w-full px-2 py-1 rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-xs placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
      />

      {/* Duration */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--color-ink-muted)] shrink-0">Duration:</label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="flex-1 px-2 py-1 rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
        >
          {[15, 30, 45, 60, 90, 120].map((d) => (
            <option key={d} value={d}>{d} min</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-1 rounded text-xs font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Adding..." : "Add"}
      </button>
    </form>
  );
}

function PlanCell({
  item,
  date,
  timeSlot,
  onAdd,
  onToggle,
  onDelete,
}: {
  item: PlanItem | undefined;
  date: string;
  timeSlot: TimeSlot;
  onAdd: (item: PlanItem) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  if (!item && !showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full h-full min-h-[3.5rem] flex items-center justify-center rounded-lg border border-dashed border-[var(--color-line)] text-[var(--color-ink-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all cursor-pointer group"
      >
        <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  if (!item && showForm) {
    return (
      <AddItemForm
        date={date}
        timeSlot={timeSlot}
        onClose={() => setShowForm(false)}
        onAdd={(newItem) => {
          onAdd(newItem);
          setShowForm(false);
        }}
      />
    );
  }

  if (!item) return null;

  const color = item.module ? MODULE_COLORS[item.module] : "var(--color-ink-muted)";

  return (
    <div
      className={cn(
        "group relative rounded-lg p-2 min-h-[3.5rem] border transition-all",
        item.completed
          ? "opacity-70 border-[var(--color-line)]"
          : "border-transparent"
      )}
      style={{ backgroundColor: `${color}18` }}
    >
      {/* Module badge */}
      {item.module && (
        <span
          className="inline-block px-1.5 py-0.5 rounded text-[0.6rem] font-semibold text-white mb-1"
          style={{ backgroundColor: color }}
        >
          {MODULE_LABELS[item.module]}
        </span>
      )}

      {/* Topic */}
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

      {/* Duration */}
      <p className="text-[0.6rem] text-[var(--color-ink-muted)] mt-0.5">
        {item.duration_min} min
      </p>

      {/* Actions */}
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

      {/* Completion indicator */}
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

// ─── Main Component ───────────────────────────────────────────

export function WeeklyGrid({
  initialItems,
  initialWeekStart,
}: {
  initialItems: PlanItem[];
  initialWeekStart: string;
}) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [items, setItems] = useState<PlanItem[]>(initialItems);
  const [loading, setLoading] = useState(false);

  const currentMonday = getMondayOfCurrentWeek();

  // Build 7 dates for the week
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  async function navigateWeek(delta: number) {
    const newStart = addDays(weekStart, delta * 7);
    setLoading(true);
    try {
      const newItems = await getWeekPlan(newStart);
      setWeekStart(newStart);
      setItems(newItems);
    } catch (err) {
      console.error(err);
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
    } finally {
      setLoading(false);
    }
  }

  function getItem(date: string, timeSlot: TimeSlot): PlanItem | undefined {
    return items.find((i) => i.date === date && i.time_slot === timeSlot);
  }

  function handleAdd(newItem: PlanItem) {
    setItems((prev) => {
      // Replace if same date+slot already exists (shouldn't happen due to UNIQUE, but guard)
      const filtered = prev.filter(
        (i) => !(i.date === newItem.date && i.time_slot === newItem.time_slot)
      );
      return [...filtered, newItem];
    });
  }

  async function handleToggle(id: string) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i))
    );
    try {
      await togglePlanItem(id);
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i))
      );
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deletePlanItem(id);
    } catch (err) {
      console.error(err);
    }
  }

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
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

      {/* Grid */}
      <div className={cn("card-base p-4 overflow-x-auto", loading && "opacity-60 pointer-events-none")}>
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-3">
            <div />
            {dates.map((date, i) => (
              <div
                key={date}
                className={cn(
                  "text-center rounded-lg py-1.5",
                  isToday(date) && "bg-[var(--color-accent)]/10"
                )}
              >
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    isToday(date)
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-ink-muted)]"
                  )}
                >
                  {DAY_NAMES[i]}
                </p>
                <p
                  className={cn(
                    "text-sm font-medium mt-0.5",
                    isToday(date)
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-ink-secondary)]"
                  )}
                >
                  {formatDayDate(date)}
                </p>
              </div>
            ))}
          </div>

          {/* Time slot rows */}
          {TIME_SLOTS.map((slot) => (
            <div key={slot} className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2">
              {/* Slot label */}
              <div className="flex items-center">
                <span className="text-xs font-medium text-[var(--color-ink-muted)]">
                  {TIME_SLOT_LABELS[slot]}
                </span>
              </div>

              {/* Cells */}
              {dates.map((date) => (
                <PlanCell
                  key={`${date}-${slot}`}
                  item={getItem(date, slot)}
                  date={date}
                  timeSlot={slot}
                  onAdd={handleAdd}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Module legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(MODULE_LABELS).map(([mod, label]) => (
          <div key={mod} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: MODULE_COLORS[mod] }}
            />
            <span className="text-xs text-[var(--color-ink-muted)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
