import { CalendarDays } from "lucide-react";
import { getWeekPlan, reconcileCalendarDates } from "./actions";
import { getTodayEvents } from "@/lib/gcal";
import { WeeklyGrid } from "@/components/planner/weekly-grid";
import { GcalHeader } from "@/components/planner/gcal-header";
import {
  getMondayForDate,
  getMondayOfCurrentWeek,
} from "@/lib/planner/date";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ gcal?: string; highlight?: string; date?: string }>;
}) {
  const { gcal, highlight, date } = await searchParams;
  // Guard malformed ?date= params (e.g. ?date=abc) so the week grid never gets "NaN".
  const weekStart = date && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? getMondayForDate(date)
    : getMondayOfCurrentWeek();

  // Calendar is the source of truth for dates: reconcile before reading the week.
  await reconcileCalendarDates(weekStart);

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

      <GcalHeader state={gcalState} notice={gcal} />

      <WeeklyGrid
        initialItems={items}
        initialWeekStart={weekStart}
        initialHighlight={highlight ?? null}
      />
    </div>
  );
}
