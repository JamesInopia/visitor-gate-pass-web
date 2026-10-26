const TIMEZONE = process.env.APP_TIMEZONE || "Asia/Manila";
export const MAX_DAYS_AHEAD = 30;

export const todayKey = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

export function addDays(key: string, days: number) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
