import { CalendarDays } from "lucide-react";
import { getWeekPlan } from "./actions";
import { WeeklyGrid } from "@/components/planner/weekly-grid";

function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

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
