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

export function getMondayForDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalDateStr(d);
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
