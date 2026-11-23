import type { ReactNode } from "react";
import AnalyticsControls from "@/components/admin/AnalyticsControls";
import { parseView, FREQS } from "@/lib/analytics-view";
import {
  getLiveStats,
  getVisitsSeries,
  getPeakHours,
  getVisitLength,
  getTopTenants,
} from "@/lib/analytics";
import BarChart from "@/components/admin/BarChart";
import LineChart from "@/components/admin/LineChart";
import RankList from "@/components/admin/RankList";
import { formatMinutes } from "@/lib/analytics-buckets";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex w-36 flex-col items-center rounded-lg border bg-white px-3 py-6 text-center">
      <span className="text-3xl font-bold">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-2 text-base leading-snug font-semibold">{label}</span>
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { view, frequency } = parseView(await searchParams);
  const live = await getLiveStats();
  const tag = FREQS[frequency].label;

  let title: string;
  let summary: ReactNode;
  let chart: ReactNode;

  if (view === "visits") {
    const visits = await getVisitsSeries(frequency);

    title = `Visits per ${visits.unit}`;
    summary = (
      <>
        <strong>{plural(visits.total, "visit")}</strong> in the last{" "}
        {visits.window}.
      </>
    );
    chart = <BarChart items={visits.items} />;
  } else if (view === "peak") {
    const peak = await getPeakHours(frequency);
    const busiest =
      peak.busiest.length > 2
        ? `${peak.busiest.length} hours tied`
        : peak.busiest.join(", ");

    title = `Visits per Hour of Arrival (${tag})`;
    summary =
      peak.total === 0 ? (
        <>
          <strong>No visits</strong> in the last {peak.window}.
        </>
      ) : (
        <>
          <strong>{plural(peak.total, "visit")}</strong> in the last{" "}
          {peak.window}. Busiest:{" "}
          <strong>
            {`${busiest} (${plural(peak.max, "visit")}${peak.busiest.length > 1 ? " each" : ""})`}
          </strong>
        </>
      );
    chart = <BarChart items={peak.items} />;
  } else if (view === "length") {
    const length = await getVisitLength(frequency);

    title = `Average Visit Length (${tag})`;
    summary =
      length.overall === null ? (
        <>
          <strong>No completed visits</strong> in the last {length.window}.
        </>
      ) : (
        <>
          <strong>{formatMinutes(length.overall)} on average</strong> across{" "}
          {plural(length.visits, "completed visit")} in the last {length.window}
          .
        </>
      );
    chart = <LineChart items={length.items} />;
  } else {
    const tenants = await getTopTenants(frequency);

    title = `Most VIsited Tenants (${tag})`;
    summary =
      tenants.items.length === 0 ? (
        <>
          <strong>No visits</strong> in the last {tenants.window}.
        </>
      ) : (
        <>
          <strong>
            {tenants.items.length === 1
              ? "Most visited tenant"
              : `Top ${tenants.items.length}`}
          </strong>
          {tenants.items.length === 1 ? "" : " most visited tenants"} in the
          last {tenants.window}.
        </>
      );
    chart = <RankList items={tenants.items} />;
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <section className="flex flex-wrap gap-5">
        <StatCard label="Visitors Inside Now" value={live.insideNow} />
        <StatCard label="Visits Today" value={live.visitsToday} />
        <StatCard label="Active Passes" value={live.activePasses} />
        <StatCard label="Pending Requests" value={live.pendingRequests} />
      </section>

      <section className="flex flex-1 flex-col rounded-lg border bg-white p-5">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-gray-600">{summary}</p>
          </div>
          <AnalyticsControls view={view} frequency={frequency} />
        </header>
        {chart}
      </section>
    </div>
  );
}
