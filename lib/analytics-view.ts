export const VIEWS = {
  visits: "Visits",
  peak: "Peak Entry Hours",
  length: "Average Visit Length",
  tenants: "Most Visited Tenants",
} as const;
export type View = keyof typeof VIEWS;

export const FREQS = {
  daily: { label: "Daily", unit: "day", count: 7 },
  weekly: { label: "Weekly", unit: "week", count: 8 },
  monthly: { label: "Monthly", unit: "month", count: 12 },
} as const;
export type Frequency = keyof typeof FREQS;

type Params = { [key: string]: string | string[] | undefined };

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

function pick<T extends string>(
  allowed: Record<T, unknown>,
  value: string | undefined,
  fallback: T,
): T {
  return value !== undefined && Object.hasOwn(allowed, value)
    ? (value as T)
    : fallback;
}

export function parseView(sp: Params): { view: View; frequency: Frequency } {
  return {
    view: pick(VIEWS, first(sp.view), "visits"),
    frequency: pick(FREQS, first(sp.frequency), "daily"),
  };
}

export const analyticsHref = (view: View, frequency: Frequency) =>
  `/admin/analytics?view=${view}&frequency=${frequency}`;
