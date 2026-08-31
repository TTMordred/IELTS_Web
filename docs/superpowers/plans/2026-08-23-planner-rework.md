# Weekly Planner Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Weekly Planner to the new plan.md structure (7-day × multi-module-per-day, dropdown module select with no default, empty state, toasts, Google Calendar scaffold) and fix the identified bugs (timezone, fabricated ids, missing delete revert, off-theme grammar color).

**Architecture:** Replace the 3 time-slot rows with 7 day columns, each holding a stack of module cards + an "Add" button. The DB drops `time_slot` and the `UNIQUE(user_id, date, time_slot)` constraint so a day holds many rows. Server actions return real inserted rows (no client-fabricated ids). Date math moves to a shared local-timezone helper (no `.toISOString()`). Google Calendar is a read-only scaffold: `.env` credentials gate a "What are you doing today?" header with an optional "Sync into planner" action.

**Tech Stack:** Next.js 16 (App Router, server actions), React 19, Supabase (RLS), Tailwind CSS 4, lucide-react icons, sonner toasts.

**Spec:** [`plan.md`](/home/subin/projects/IELTS_Web/plan.md) (user spec) — argues from the spec; executors read both.

## Global Constraints

- **UI copy in English** only (AGENTS.md). No emoji characters in JSX — use `lucide-react` icons. Server error messages may stay Vietnamese if already present.
- **No pink/purple/off-theme accents** (AGENTS.md). Theme accent is `#1B4D3E` (`var(--color-accent)`). The module color palette below is the only allowed per-module palette.
- **Module palette (fixed, verbatim):** listening `#378ADD`, reading `#D85A30`, speaking `#1D9E75`, writing `#1B4D3E`, vocab `#0F766E`, grammar `#B45309` (grammar is amber — the old `#7C3AED` purple is banned).
- **Dates are "YYYY-MM-DD" local strings.** Never do date arithmetic through `new Date(...).toISOString()` — that shifts to UTC and produces off-by-one days for UTC+7. Use `src/lib/planner/date.ts` helpers.
- **`node_modules` is currently absent** from the repo. Run `npm install` once before the first TypeScript verification (Task 2 onward).
- **No unit-test harness exists** in this repo (no jest/vitest in `package.json`). Verification is: `npx tsc --noEmit`, `npm run lint`, and manual run in `npm run dev`. Do not add a test framework.
- **Supabase schema convention:** new migrations are numbered `supabase/schema-<n>.sql`. This plan adds `schema-2.7.sql`.
- **Server actions return real rows** from `.select()` — never fabricate ids client-side.
- If unsure about a Next.js 16 API, read `node_modules/next/dist/docs/` (per AGENTS.md) before writing code.

---

### Task 1: Add schema migration for multi-module-per-day

**Files:**
- Create: `supabase/schema-2.7.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: `study_plan_items` table without `time_slot` column and without the `(user_id, date, time_slot)` UNIQUE constraint; a new composite index `idx_study_plan_user_date` on `(user_id, date)`. Downstream (Task 3) queries by `user_id` + `date` range only.

- [ ] **Step 1: Write the migration**

```sql
-- Planner rework: allow multiple study plan items per (user_id, date).
-- Drops the old 3-slot model (morning/afternoon/evening).

ALTER TABLE public.study_plan_items
  DROP CONSTRAINT IF EXISTS study_plan_items_user_id_date_time_slot_key;

ALTER TABLE public.study_plan_items
  DROP COLUMN IF EXISTS time_slot;

CREATE INDEX IF NOT EXISTS idx_study_plan_user_date
  ON public.study_plan_items(user_id, date);
```

- [ ] **Step 2: Verify the migration**

The constraint is auto-named by Postgres; if the name differs, find the real name and re-run the drop. Check the current constraint name if needed:

```bash
grep -n "study_plan_items" supabase/schema-2.3.sql
```

Expected: `schema-2.3.sql:60` shows `UNIQUE (user_id, date, time_slot)`. If a local Supabase is running, apply via the Supabase CLI (`supabase db reset`) or manually; otherwise this file is applied later with the rest of the migrations. Confirm `time_slot` no longer appears in the planner table definition.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema-2.7.sql
git commit -m "feat: allow multiple planner modules per day (drop 3-slot model)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create shared planner libs (date + modules)

**Files:**
- Create: `src/lib/planner/date.ts`
- Create: `src/lib/planner/modules.ts`

**Interfaces:**
- Consumes: nothing (pure TS, no framework deps).
- Produces:
  - `getMondayOfCurrentWeek(): string` — local "YYYY-MM-DD" of this week's Monday.
  - `addDays(dateStr: string, days: number): string`
  - `getTodayDateString(): string`
  - `formatDayDate(dateStr: string): string`
  - `formatMonthYear(dateStr: string): string`
  - `isToday(dateStr: string): boolean`
  - `MODULES: ReadonlyArray<{ key, label, color }>` (6 entries, palette from Global Constraints)
  - `ModuleKey` — union of the 6 module keys
  - `MODULE_LABELS: Record<ModuleKey, string>`
  - `MODULE_COLORS: Record<ModuleKey, string>`

Downstream: Task 3 (`actions.ts`) imports `addDays`, `getTodayDateString`, `ModuleKey`. Task 4 (`weekly-grid.tsx`) imports the date helpers and module constants.

- [ ] **Step 1: Write `src/lib/planner/date.ts`**

```ts
// Local-timezone date helpers. Dates are "YYYY-MM-DD" strings built from
// local getters — never from toISOString(), which shifts to UTC and breaks
// day boundaries for UTC+7.

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight
}

export function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return toLocalDateStr(monday);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

export function getTodayDateString(): string {
  return toLocalDateStr(new Date());
}

export function formatDayDate(dateStr: string): string {
  return parseLocalDate(dateStr).getDate().toString();
}

export function formatMonthYear(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function isToday(dateStr: string): boolean {
  return toLocalDateStr(new Date()) === dateStr;
}
```

- [ ] **Step 2: Write `src/lib/planner/modules.ts`**

```ts
export const MODULES = [
  { key: "listening", label: "Listening", color: "#378ADD" },
  { key: "reading", label: "Reading", color: "#D85A30" },
  { key: "speaking", label: "Speaking", color: "#1D9E75" },
  { key: "writing", label: "Writing", color: "#1B4D3E" },
  { key: "vocab", label: "Vocab", color: "#0F766E" },
  { key: "grammar", label: "Grammar", color: "#B45309" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

export const MODULE_LABELS = Object.fromEntries(
  MODULES.map((m) => [m.key, m.label])
) as Record<ModuleKey, string>;

export const MODULE_COLORS = Object.fromEntries(
  MODULES.map((m) => [m.key, m.color])
) as Record<ModuleKey, string>;
```

- [ ] **Step 3: Install deps (first time)**

```bash
npm install
```

Expected: dependencies install (needed for `tsc` below).

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/planner/date.ts src/lib/planner/modules.ts
git commit -m "feat: add planner date and module constants libs

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Rework server actions

**Files:**
- Modify: `src/app/(app)/planner/actions.ts` (full rewrite)

**Interfaces:**
- Consumes: `addDays`, `getTodayDateString` from `@/lib/planner/date`; `ModuleKey` from `@/lib/planner/modules` (Task 2).
- Produces:
  - `export type PlanItem = { id: string; user_id: string; date: string; module: ModuleKey | null; topic: string | null; duration_min: number; completed: boolean; created_at: string }`
  - `export type AddPlanItemInput = { date: string; module: ModuleKey; topic?: string; duration_min?: number }`
  - `getWeekPlan(weekStart: string): Promise<PlanItem[]>` — rows for `[weekStart, weekStart+6]`, ordered by `date` then `created_at`.
  - `addPlanItem(input): Promise<PlanItem>` — inserts and **returns the real row** (fix: fabricated-id bug).
  - `togglePlanItem(id): Promise<void>` — unchanged behavior.
  - `deletePlanItem(id): Promise<void>` — unchanged behavior.

Downstream: Task 4 (`weekly-grid.tsx`) imports all of the above.

- [ ] **Step 1: Rewrite `src/app/(app)/planner/actions.ts`**

Replace the whole file with:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addDays, getTodayDateString } from "@/lib/planner/date";
import type { ModuleKey } from "@/lib/planner/modules";

export type PlanItem = {
  id: string;
  user_id: string;
  date: string;
  module: ModuleKey | null;
  topic: string | null;
  duration_min: number;
  completed: boolean;
  created_at: string;
};

export type AddPlanItemInput = {
  date: string;
  module: ModuleKey;
  topic?: string;
  duration_min?: number;
};

export async function getWeekPlan(weekStart: string): Promise<PlanItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const weekEnd = addDays(weekStart, 6);

  const { data, error } = await supabase
    .from("study_plan_items")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as PlanItem[];
}

export async function addPlanItem(input: AddPlanItemInput): Promise<PlanItem> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("study_plan_items")
    .insert({
      user_id: user.id,
      date: input.date,
      module: input.module,
      topic: input.topic || null,
      duration_min: input.duration_min ?? 30,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/planner");
  return data as PlanItem;
}

export async function togglePlanItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: item, error: fetchError } = await supabase
    .from("study_plan_items")
    .select("completed")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from("study_plan_items")
    .update({ completed: !item.completed })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/planner");
}

export async function deletePlanItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("study_plan_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/planner");
}
```

Note: `getTodayDateString` is imported now but not yet used — it will be used in Task 5 (`syncTodayEvents`). Remove the import if the linter flags it as unused before Task 5 lands (or leave it; `use server` files are not flagged for unused exports). Keep it.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. (If the old `PlanCell`/`AddItemForm` code in `weekly-grid.tsx` still references removed fields like `time_slot`, that's expected — Task 4 rewrites that file. Check whether `tsc` reports planner errors and confirm they are only in `weekly-grid.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/planner/actions.ts
git commit -m "feat: planner server actions return real rows and drop slot logic

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Rework the weekly grid UI + mount toasts

**Files:**
- Rewrite: `src/components/planner/weekly-grid.tsx`
- Modify: `src/app/layout.tsx` (mount `<Toaster />`)
- Modify: `src/app/(app)/planner/page.tsx` (use shared `getMondayOfCurrentWeek` helper)

**Interfaces:**
- Consumes: `PlanItem`, `AddPlanItemInput`-free — actually `PlanItem`, `addPlanItem`, `togglePlanItem`, `deletePlanItem`, `getWeekPlan` from `@/app/(app)/planner/actions`; `MODULES`, `MODULE_LABELS`, `MODULE_COLORS`, `ModuleKey` from `@/lib/planner/modules`; date helpers from `@/lib/planner/date`.
- Produces: `WeeklyGrid` client component (`initialItems: PlanItem[]`, `initialWeekStart: string`). Uses `sonner` `toast` for add/delete/navigation feedback.

- [ ] **Step 1: Mount `<Toaster />` in `src/app/layout.tsx`**

Add the import at the top and the component inside `<body>` (after `{children}`, before `ServiceWorkerRegister`):

```tsx
import { Toaster } from "sonner";
```

```tsx
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
        <ServiceWorkerRegister />
      </body>
```

- [ ] **Step 2: Rewrite `src/components/planner/weekly-grid.tsx`**

Replace the entire file with:

```tsx
"use client";

import { useMemo, useState } from "react";
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
}: {
  initialItems: PlanItem[];
  initialWeekStart: string;
}) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [items, setItems] = useState<PlanItem[]>(initialItems);
  const [loading, setLoading] = useState(false);

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

      {totalCount === 0 ? (
        <div className="card-base p-10 text-center">
          <p className="text-[var(--color-ink)] font-medium">
            No sessions planned yet
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Click <b>+ Add</b> on any day to schedule your first IELTS session
          </p>
        </div>
      ) : (
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
      )}

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
```

- [ ] **Step 3: Update `src/app/(app)/planner/page.tsx`**

Remove the local `getMondayOfCurrentWeek` function (lines 5-12) and import it from the helper instead:

```tsx
import { CalendarDays } from "lucide-react";
import { getWeekPlan } from "./actions";
import { WeeklyGrid } from "@/components/planner/weekly-grid";
import { getMondayOfCurrentWeek } from "@/lib/planner/date";

export default async function PlannerPage() {
  const weekStart = getMondayOfCurrentWeek();
  const items = await getWeekPlan(weekStart);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-[var(--color-accent)]" />
          Weekly Planner
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Plan your IELTS study sessions for the week
        </p>
      </div>

      <WeeklyGrid initialItems={items} initialWeekStart={weekStart} />
    </div>
  );
}
```

- [ ] **Step 4: Type-check and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no errors (lint may need `npm install` already done in Task 2).

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev
```

Open `http://localhost:3000/planner` (must be signed in). Verify:
- Grid shows 7 day columns; each day stacks multiple module cards.
- "+ Add" opens a form with a **"Choose module…"** dropdown (no default), topic, duration.
- Add a session → card appears, green toast "… session added".
- Toggle complete → strikethrough, counter updates; toggle again works (real id).
- Delete → card removed, toast "Session deleted"; reload does not bring it back.
- "This Week" / prev / next week navigate.
- Delete all items → empty state appears; add one → grid returns.

- [ ] **Step 6: Commit**

```bash
git add src/components/planner/weekly-grid.tsx src/app/layout.tsx "src/app/(app)/planner/page.tsx"
git commit -m "feat: rework planner to day columns with multi-module stacking + toasts

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Google Calendar scaffold

**Files:**
- Create: `src/lib/gcal.ts`
- Create: `src/components/planner/gcal-header.tsx`
- Modify: `src/app/(app)/planner/actions.ts` (append `syncTodayEvents`)
- Modify: `src/app/(app)/planner/page.tsx` (render `<GcalHeader />`)
- Modify: `.env.example`
- Create: `docs/gcal-setup.md`

**Interfaces:**
- Consumes: `getTodayDateString` from `@/lib/planner/date`; `ModuleKey` from `@/lib/planner/modules` (Task 2).
- Produces:
  - `src/lib/gcal.ts`:
    - `export type TodayEvent = { summary: string; start: string | null }`
    - `export type GcalState = { connected: true; events: TodayEvent[] } | { connected: false; events: [] }`
    - `export async function getTodayEvents(): Promise<GcalState>`
    - `export function moduleFromTitle(title: string): ModuleKey | null`
  - `src/components/planner/gcal-header.tsx`: client component `GcalHeader({ state }: { state: GcalState })`.
  - `syncTodayEvents(): Promise<{ imported: number }>` in `actions.ts`.

- [ ] **Step 1: Write `src/lib/gcal.ts`**

```ts
import type { ModuleKey } from "@/lib/planner/modules";

export type TodayEvent = { summary: string; start: string | null };

export type GcalState =
  | { connected: true; events: TodayEvent[] }
  | { connected: false; events: [] };

export async function getTodayEvents(): Promise<GcalState> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!apiKey || !calendarId) return { connected: false, events: [] };

  // Local today → absolute start/end of the local day.
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`
  );
  url.searchParams.set("key", apiKey);
  url.searchParams.set("timeMin", start.toISOString());
  url.searchParams.set("timeMax", end.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return { connected: false, events: [] };

  const data = await res.json();
  const events: TodayEvent[] = (data.items ?? []).map((e: any) => ({
    summary: e.summary ?? "Untitled event",
    start: e.start?.dateTime
      ? new Date(e.start.dateTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : (e.start?.date ?? null),
  }));

  return { connected: true, events };
}

// Best-effort mapping of an event title to a planner module.
export function moduleFromTitle(title: string): ModuleKey | null {
  const t = title.toLowerCase();
  if (t.includes("reading")) return "reading";
  if (t.includes("listening")) return "listening";
  if (t.includes("speaking")) return "speaking";
  if (t.includes("writing")) return "writing";
  if (t.includes("vocab")) return "vocab";
  if (t.includes("grammar")) return "grammar";
  return null;
}
```

- [ ] **Step 2: Append `syncTodayEvents` to `src/app/(app)/planner/actions.ts`**

Add these imports to the top of the file:

```ts
import { getTodayEvents, moduleFromTitle } from "@/lib/gcal";
```

Append at the end of the file:

```ts
export async function syncTodayEvents(): Promise<{ imported: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const state = await getTodayEvents();
  if (!state.connected) throw new Error("Google Calendar not configured");

  const today = getTodayDateString();
  let imported = 0;
  for (const e of state.events) {
    const { error } = await supabase.from("study_plan_items").insert({
      user_id: user.id,
      date: today,
      module: moduleFromTitle(e.summary),
      topic: e.summary,
      duration_min: 30,
    });
    if (error) throw error;
    imported += 1;
  }
  revalidatePath("/planner");
  return { imported };
}
```

- [ ] **Step 3: Write `src/components/planner/gcal-header.tsx`**

```tsx
"use client";

import { useState } from "react";
import { CalendarDays, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { syncTodayEvents } from "@/app/(app)/planner/actions";
import type { GcalState } from "@/lib/gcal";

export function GcalHeader({ state }: { state: GcalState }) {
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const { imported } = await syncTodayEvents();
      toast.success(`Imported ${imported} event${imported === 1 ? "" : "s"} into planner`);
    } catch (err) {
      console.error(err);
      toast.error("Sync failed — check Google Calendar setup");
    } finally {
      setSyncing(false);
    }
  }

  if (!state.connected) {
    return (
      <div className="card-base p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
          <CloudOff className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">
            Connect Google Calendar
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Add <code>GOOGLE_CALENDAR_API_KEY</code> and{" "}
            <code>GOOGLE_CALENDAR_ID</code> to your .env to show today&apos;s
            events here. See docs/gcal-setup.md.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium flex items-center gap-2 text-[var(--color-ink)]">
            <CalendarDays className="w-4 h-4 text-[var(--color-accent)]" />
            What are you doing today?
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            {state.events.length} event{state.events.length === 1 ? "" : "s"}{" "}
            from Google Calendar
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || state.events.length === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {syncing ? "Syncing…" : "Sync into planner"}
        </button>
      </div>
      {state.events.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {state.events.map((e, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-accent-light)] text-[var(--color-accent)]"
            >
              {e.start && (
                <span className="font-semibold opacity-70">{e.start} · </span>
              )}
              {e.summary}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire into `src/app/(app)/planner/page.tsx`**

```tsx
import { CalendarDays } from "lucide-react";
import { getWeekPlan } from "./actions";
import { getTodayEvents } from "@/lib/gcal";
import { WeeklyGrid } from "@/components/planner/weekly-grid";
import { GcalHeader } from "@/components/planner/gcal-header";
import { getMondayOfCurrentWeek } from "@/lib/planner/date";

export default async function PlannerPage() {
  const weekStart = getMondayOfCurrentWeek();
  const [items, gcalState] = await Promise.all([
    getWeekPlan(weekStart),
    getTodayEvents(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-[var(--color-accent)]" />
          Weekly Planner
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Plan your IELTS study sessions for the week
        </p>
      </div>

      <GcalHeader state={gcalState} />

      <WeeklyGrid initialItems={items} initialWeekStart={weekStart} />
    </div>
  );
}
```

- [ ] **Step 5: Update `.env.example`**

Append:

```
# Google Calendar (scaffold — set these to enable "What are you doing today?")
GOOGLE_CALENDAR_API_KEY=
GOOGLE_CALENDAR_ID=
```

- [ ] **Step 6: Write `docs/gcal-setup.md`**

```markdown
# Google Calendar Setup (scaffold)

The planner's "What are you doing today?" header reads today's events from
Google Calendar. It is a scaffold: everything is wired up but disabled until
you add credentials.

## 1. Create an API key

1. Go to <https://console.cloud.google.com/> and create (or pick) a project.
2. Enable the **Google Calendar API**:
   APIs & Services → Library → search "Google Calendar API" → Enable.
3. APIs & Services → Credentials → **Create credentials → API key**.
4. Copy the key.

## 2. Find your calendar ID

1. Open Google Calendar in a browser.
2. Settings → Settings for my calendars → select your calendar → scroll to
   **Integrate calendar**.
3. Copy the **Calendar ID** (looks like `abc@gmail.com` or a long hash).
   If you want the app to see a public calendar without auth, ensure that
   calendar's sharing is set to **Make available to public** (read-only is fine).

## 3. Configure the app

Add to your local `.env` (see `.env.example`):

```
GOOGLE_CALENDAR_API_KEY=your-api-key
GOOGLE_CALENDAR_ID=your-calendar-id
```

Restart the dev server. The header now shows today's events and the
**Sync into planner** button imports them as plan items (module is guessed
from the event title, e.g. "Mock Reading Test" → Reading; falls back to no
module).

## Notes / next steps

- This uses a read-only API key (public/readable calendar). For private
  calendars you'll need OAuth 2.0 — add `GOOGLE_CLIENT_ID` and
  `GOOGLE_CLIENT_SECRET` and implement the token flow later.
- Events without a start time display as all-day.
```

- [ ] **Step 7: Type-check, lint, manual test**

```bash
npx tsc --noEmit
npm run lint
npm run dev
```

Open `/planner`. Without `.env` values, expect the **"Connect Google Calendar"** placeholder card. Add `GOOGLE_CALENDAR_API_KEY` + `GOOGLE_CALENDAR_ID`, restart, and expect the events strip with a working **Sync into planner** button.

- [ ] **Step 8: Commit**

```bash
git add src/lib/gcal.ts src/components/planner/gcal-header.tsx "src/app/(app)/planner/actions.ts" "src/app/(app)/planner/page.tsx" .env.example docs/gcal-setup.md
git commit -m "feat: add Google Calendar scaffold for planner (env-gated)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Final Verification

- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run lint` passes.
- [ ] Manual pass over `/planner`: add multiple modules to one day; toggle/delete; week nav; empty state; toasts; GCal header (placeholder without env, events + sync with env).
- [ ] All four bug fixes confirmed: timezone dates (no `.toISOString()` in date math), real ids returned from `addPlanItem`, delete reverts on failure, grammar color is amber not purple.

## Self-Review

**Spec coverage (plan.md):**
- Grid 7 days Mon–Sun ✓ (Task 4)
- Drop 3 slots ✓ (Task 1 schema, Task 3 actions, Task 4 UI)
- Each day holds multiple modules (thêm module) ✓ (schema allows many rows; DayColumn stacks cards)
- Dropdown select, no default Listening ✓ (AddItemForm `<select>` starts `""` with disabled placeholder)
- Topic + duration + completed per module ✓ (ModuleCard + AddItemForm)
- Navigation This Week / next week ✓ (WeeklyGrid nav)
- Empty state ✓ (WeeklyGrid `totalCount === 0` branch)
- Toast notification ✓ (sonner Toaster + toast calls)
- Google Calendar: today's events header + sync ✓ (Task 5 scaffold)
- Colors per module ✓ (modules.ts palette)
- Save to Supabase + RLS ✓ (unchanged policies)
- Responsive ✓ (min-w + overflow-x-auto)
- Month Planner — out of scope (plan.md says "sau Weekly"), not planned here.

**Placeholder scan:** All tasks contain full code; no TBD/TODO steps.

**Type consistency:** `PlanItem.module` is `ModuleKey | null` everywhere (DB allows null for synced events); `AddPlanItemInput.module` is required `ModuleKey` (form enforces selection). `syncTodayEvents` uses `getTodayDateString()` and `moduleFromTitle()` as defined in Task 2 / Task 5. `getWeekPlan` uses `addDays()` from Task 2. No name drift.
