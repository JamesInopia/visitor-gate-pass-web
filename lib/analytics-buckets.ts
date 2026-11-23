import { FREQS, type Frequency } from "./analytics-view";
import { addDays } from "./dates";

export type Bucket = { start: string; label: string; title: string };

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts });
const parse = (key: string) => new Date(`${key}T00:00:00Z`);
const clock = (h: number, m: number) =>
  `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;

export const hourLabel = (h: number) =>
  `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
export const hourTitle = (h: number) => `${clock(h, 0)} - ${clock(h, 59)}`;

export function bucketStarts(freq: Frequency, today: string): string[] {
  const count = FREQS[freq].count;

  if (freq === "daily")
    return Array.from({ length: count }, (_, i) =>
      addDays(today, i - (count - 1)),
    );
  if (freq === "weekly") {
    const monday = addDays(today, -((parse(today).getUTCDay() + 6) % 7));
    return Array.from({ length: count }, (_, i) =>
      addDays(monday, -7 * (count - 1 - i)),
    );
  }

  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1))
      .toISOString()
      .slice(0, 10),
  );
}

export function describeBuckets(freq: Frequency, starts: string[]): Bucket[] {
  return starts.map((start, i) => {
    const d = parse(start);
    if (freq === "daily") {
      const weekday = fmt({ weekday: "short" }).format(d);
      const dayMonth = fmt({ day: "numeric", month: "short" }).format(d);
      return {
        start,
        label: `(${weekday}) ${dayMonth}`,
        title: fmt({
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(d),
      };
    }
    if (freq === "weekly") {
      const day = fmt({ day: "numeric", month: "short" });
      const full = fmt({ day: "numeric", month: "short", year: "numeric" });
      return {
        start,
        label: day.format(d),
        title: `${day.format(d)} - ${full.format(parse(addDays(start, 6)))}`,
      };
    }
    const withYear = i === 0 || d.getUTCMonth() === 0;
    return {
      start,
      label: fmt(
        withYear ? { month: "short", year: "2-digit" } : { month: "short" },
      ).format(d),
      title: fmt({ month: "long", year: "numeric" }).format(d),
    };
  });
}

export function formatMinutes(total: number) {
  const m = Math.round(total);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

export function shortMinutes(total: number) {
  const m = Math.round(total);
  return m < 60
    ? `${m}m`
    : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}
