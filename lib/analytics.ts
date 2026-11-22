import "server-only";
import { eq, sql, sum, type AnyColumn } from "drizzle-orm";
import { db } from "@/db";
import {
  archives,
  entryLog,
  gatePass,
  visitorRequest,
  users,
} from "@/db/schema";
import { TIMEZONE, todayKey } from "./dates";
import {
  bucketStarts,
  describeBuckets,
  hourLabel,
  hourTitle,
  formatMinutes,
  shortMinutes,
} from "./analytics-buckets";
import { FREQS, type Frequency } from "./analytics-view";

const n = (v: unknown) => Number(v ?? 0);

const localDay = (col: AnyColumn) =>
  sql`(${col} at time zone ${TIMEZONE})::date`;

export async function getLiveStats() {
  const today = todayKey();

  const [[inside], [liveToday], [archivedToday], [active], [pending]] =
    await Promise.all([
      db
        .select({ n: sql<number>`count(distinct ${entryLog.passId})::int` })
        .from(entryLog)
        .where(
          sql`${entryLog.dateEnter} is not null and ${entryLog.dateExit} is null`,
        ),
      db
        .select({ n: sql<number>`count(distinct ${entryLog.passId})::int` })
        .from(entryLog)
        .where(sql`${localDay(entryLog.dateEnter)} = ${today}::date`),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(archives)
        .where(sql`${localDay(archives.dateEnter)} = ${today}::date`),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(gatePass)
        .where(
          sql`${gatePass.status} <> 'revoked' and coalesce(${gatePass.expiryDate}, ${gatePass.issuedAt} + interval '24 hours') > now()`,
        ),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(visitorRequest)
        .where(eq(visitorRequest.status, "pending")),
    ]);

  return {
    insideNow: n(inside.n),
    visitsToday: n(liveToday.n) + n(archivedToday.n),
    activePasses: n(active.n),
    pendingRequests: n(pending.n),
  };
}

const visitTimes = sql`(
    select ${archives.dateEnter} as ts from ${archives} where ${archives.dateEnter} is not null
    union all
    select min(${entryLog.dateEnter}) as ts from ${entryLog} where ${entryLog.dateEnter} is not null group by ${entryLog.passId}
)`;

export const visitsQuery = (unit: string, since: string) => sql`
    select (date_trunc(${unit}, v.ts at time zone ${TIMEZONE}))::date::text as bucket, count(*)::int as n
  from ${visitTimes} v
  where (v.ts at time zone ${TIMEZONE})::date >= ${since}::date
  group by 1
`;

export const peakHoursQuery = (since: string) => sql`
    select extract(hour from v.ts at time zone ${TIMEZONE})::int as hour, count(*)::int as n
  from ${visitTimes} v
  where (v.ts at time zone ${TIMEZONE})::date >= ${since}::date
  group by 1
`;

export async function getVisitsSeries(freq: Frequency) {
  const starts = bucketStarts(freq, todayKey());
  const { unit, count } = FREQS[freq];

  const rows = await db.execute<{ bucket: string; n: number }>(
    visitsQuery(unit, starts[0]),
  );
  const counts = new Map(Array.from(rows, (r) => [r.bucket, n(r.n)]));

  const items = describeBuckets(freq, starts).map((b, i, all) => ({
    ...b,
    n: counts.get(b.start) ?? 0,
    partial: i === all.length - 1,
  }));

  return {
    unit,
    window: `${count} ${unit}s`,
    items,
    total: items.reduce((sum, it) => sum + it.n, 0),
  };
}

export async function getPeakHours(freq: Frequency) {
  const since = bucketStarts(freq, todayKey())[0];
  const { unit, count } = FREQS[freq];

  const rows = await db.execute<{ hour: number; n: number }>(
    peakHoursQuery(since),
  );
  const counts = new Map(Array.from(rows, (r) => [n(r.hour), n(r.n)]));

  const hours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    n: counts.get(h) ?? 0,
  }));
  const max = Math.max(...hours.map((h) => h.n));

  return {
    unit,
    window: `${count} ${unit}s`,
    total: hours.reduce((sum, h) => sum + h.n, 0),
    max,
    busiest:
      max > 0
        ? hours.filter((h) => h.n === max).map((h) => hourTitle(h.hour))
        : [],
    items: hours.map((h) => ({
      start: String(h.hour),
      label: hourLabel(h.hour),
      title: hourTitle(h.hour),
      n: h.n,
      muted: max > 0 && h.n !== max,
    })),
  };
}

const visitDurations = sql`(
    select ${archives.dateEnter} as ts, ${archives.dateExit} as leaving
    from ${archives}
    where ${archives.dateEnter} is not null and ${archives.dateExit} is not null
    union all
    select min(${entryLog.dateEnter}) as ts, max(${entryLog.dateExit}) as leaving
    from ${entryLog}
    where ${entryLog.dateEnter} is not null
    group by ${entryLog.passId}
    having bool_and(${entryLog.dateExit} is not null)
)`;

export const visitLengthQuery = (unit: string, since: string) => sql`
    select(date_trunc(${unit}, v.ts at time zone ${TIMEZONE}))::date::text as bucket,
        avg(extract(epoch from (v.leaving - v.ts)) / 60)::float8 as minutes,
        count(*)::int as n
    from ${visitDurations} v
    where v.leaving >= v.ts and (v.ts at time zone ${TIMEZONE})::date >= ${since}::date
    group by 1
`;

export async function getVisitLength(freq: Frequency) {
  const starts = bucketStarts(freq, todayKey());
  const unit = FREQS[freq].unit;
  const { count } = FREQS[freq];

  const rows = await db.execute<{ bucket: string; minutes: number; n: number }>(
    visitLengthQuery(unit, starts[0]),
  );
  const byBucket = new Map(
    Array.from(rows, (r) => [r.bucket, { minutes: n(r.minutes), n: n(r.n) }]),
  );

  const items = describeBuckets(freq, starts).map((b, i, all) => {
    const r = byBucket.get(b.start);
    return {
      ...b,
      value: r ? r.minutes : null,
      text: r ? shortMinutes(r.minutes) : "",
      title: r
        ? `${b.title}: ${formatMinutes(r.minutes)} average (${r.n} visit${r.n == 1 ? "" : "s"})`
        : `${b.title}: No completed visits`,
      partial: i === all.length - 1,
    };
  });

  const visits = Array.from(byBucket.values()).reduce((sum, r) => sum + r.n, 0);
  const weighted = Array.from(byBucket.values()).reduce(
    (sum, r) => sum + r.minutes * r.n,
    0,
  );

  return {
    unit,
    window: `${count} ${unit}s`,
    visits,
    overall: visits > 0 ? weighted / visits : null,
    items,
  };
}

const visitTenants = sql`(
    select ${archives.dateEnter} as ts, ${archives.hostName} as tenant, ${archives.unitVisited} as unit
  from ${archives}
  where ${archives.dateEnter} is not null and ${archives.hostName} is not null
  union all
  select min(${entryLog.dateEnter}) as ts, ${users.name} as tenant, ${users.unitNo} as unit
  from ${entryLog}
  join ${gatePass} on ${gatePass.passId} = ${entryLog.passId}
  join ${visitorRequest} on ${visitorRequest.requestId} = ${gatePass.requestId}
  join ${users} on ${users.userId} = ${visitorRequest.hostId}
  where ${entryLog.dateEnter} is not null
  group by ${entryLog.passId}, ${users.name}, ${users.unitNo}
)`;

export const topTenantsQuery = (since: string) => sql`
    select min(trim(v.tenant)) as tenant, min(trim(v.unit)) as unit, count(*)::int as n
    from ${visitTenants} v
    where (v.ts at time zone ${TIMEZONE})::date >= ${since}::date
    group by lower(trim(v.tenant))
    order by n desc, tenant asc
    limit 5
`;

export async function getTopTenants(freq: Frequency) {
  const since = bucketStarts(freq, todayKey())[0];
  const unit = FREQS[freq].unit;
  const { count } = FREQS[freq];

  const rows = await db.execute<{
    tenant: string;
    unit: string | null;
    n: number;
  }>(topTenantsQuery(since));
  return {
    unit,
    window: `${count} ${unit}s`,
    items: Array.from(rows, (r) => ({
      key: r.tenant,
      label: r.tenant,
      sublabel: r.unit
        ? /^unit\b/i.test(r.unit)
          ? r.unit
          : `Unit ${r.unit}`
        : undefined,
      n: n(r.n),
    })),
  };
}
