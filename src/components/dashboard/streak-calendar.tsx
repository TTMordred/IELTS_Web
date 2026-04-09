"use client";

type Activity = {
  date: string;
  xp_earned: number;
};

type Props = {
  activities: Activity[];
};

function getXpColor(xp: number): string {
  if (xp === 0) return "var(--color-line)";
  if (xp <= 20) return "#86EFAC"; // light green
  if (xp <= 50) return "#22C55E"; // medium green
  return "#15803D"; // dark green
}

function getXpLabel(xp: number): string {
  if (xp === 0) return "No activity";
  return `${xp} XP`;
}

// Build a 13-week × 7-day grid ending today
function buildGrid(activities: Activity[]) {
  const activityMap = new Map<string, number>();
  for (const a of activities) {
    activityMap.set(a.date, a.xp_earned);
  }

  // End at today, go back 13 weeks (91 days)
  const today = new Date();
  // Align to the end of the current week (Sunday)
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...6=Sat
  // We want the grid to end at today's column
  // Start: 91 days back from today
  const start = new Date(today);
  start.setDate(start.getDate() - 90);

  const weeks: { date: string; xp: number }[][] = [];
  let currentWeek: { date: string; xp: number }[] = [];

  const cursor = new Date(start);
  // Pad the first week if it doesn't start on Monday
  const startDow = cursor.getDay(); // 0=Sun
  // We display Mon=0 ... Sun=6
  const mondayIndex = (startDow + 6) % 7; // convert Sun=0 to Mon=0

  // Fill leading empty slots for the first partial week
  for (let i = 0; i < mondayIndex; i++) {
    currentWeek.push({ date: "", xp: 0 });
  }

  while (cursor <= today) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const xp = activityMap.get(dateStr) ?? 0;
    currentWeek.push({ date: dateStr, xp });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  // Pad the last partial week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: "", xp: 0 });
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

function getMonthLabels(weeks: { date: string; xp: number }[][]): (string | null)[] {
  return weeks.map((week) => {
    // Use first real date in the week
    const firstReal = week.find((d) => d.date !== "");
    if (!firstReal) return null;
    const d = new Date(firstReal.date);
    // Show month label if first week of the month OR first week overall
    if (d.getDate() <= 7) {
      return d.toLocaleString("en-US", { month: "short" });
    }
    return null;
  });
}

const DAY_LABELS = ["M", "", "W", "", "F", "", ""];

export function StreakCalendar({ activities }: Props) {
  const weeks = buildGrid(activities);
  const monthLabels = getMonthLabels(weeks);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        {/* Day labels column */}
        <div className="flex flex-col gap-1 mr-1">
          {/* Spacer for month label row */}
          <div className="h-4" />
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="w-3 h-3 flex items-center justify-center text-[0.6rem] text-[var(--color-ink-muted)]"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {/* Month label */}
            <div className="h-4 flex items-center">
              {monthLabels[wi] && (
                <span className="text-[0.6rem] text-[var(--color-ink-muted)] whitespace-nowrap">
                  {monthLabels[wi]}
                </span>
              )}
            </div>
            {/* Day cells */}
            {week.map((day, di) => (
              <div
                key={di}
                className="w-3 h-3 rounded-sm transition-opacity"
                style={{
                  backgroundColor: day.date ? getXpColor(day.xp) : "transparent",
                  opacity: day.date ? 1 : 0,
                }}
                title={day.date ? `${day.date}: ${getXpLabel(day.xp)}` : undefined}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[0.65rem] text-[var(--color-ink-muted)]">
        <span>Less</span>
        {[0, 10, 30, 60].map((xp) => (
          <div
            key={xp}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getXpColor(xp) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
