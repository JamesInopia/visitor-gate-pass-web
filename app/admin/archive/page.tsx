import Link from "next/link";
import { listArchives } from "@/lib/archive";
import { TIMEZONE } from "@/lib/dates";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { tr } from "zod/locales";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

const stamp = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIMEZONE,
  dateStyle: "medium",
  timeStyle: "short",
});
const fmt = (d: Date | null) => (d ? stamp.format(d) : "—");

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = one(sp.q);
  const from = one(sp.from);
  const to = one(sp.to);
  const requested = Math.max(1, parseInt(one(sp.page), 10) || 1);

  const { rows, total, page, pages } = await listArchives({
    q,
    from,
    to,
    page: requested,
  });

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/archives?{qs}` : "/admin/archive";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">Archive</h1>
        <span className="text-sm text-gray-600">
          {total} record{total === 1 ? "" : "s"}
        </span>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          Search
          <input
            name="q"
            defaultValue={q}
            placeholder="Visitor, unit, purpose, guard"
            className="w-72 rounded border px-2 py-1 bg-white"
          />
        </label>
        <label className="flex flex-col text-sm">
          From
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded border px-2 py-1 bg-white"
          />
        </label>
        <label className="flex flex-col text-sm">
          To
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded border px-2 py-1 bg-white"
          />
        </label>
        <button className="rounded bg-blue-300 px-4 py-1.5">Filter</button>
        {(q || from || to) && (
          <Link href="/admin/archive" className="py-1.5 text-sm underline">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-sm">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="p-2">Visitor</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Unit</th>
              <th className="p-2">Entered</th>
              <th className="p-2">Exited</th>
              <th className="p-2">Purpose</th>
              <th className="p-2">Authorized By</th>
              <th className="p-2">Archived</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gay-500">
                  No archived visits
                  {q || from || to ? " match these filters" : " yet"}.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.logId} className="border-b">
                  <td className="p-2">{r.visitorName ?? "—"}</td>
                  <td className="p-2">{r.contact ?? "—"}</td>
                  <td className="p-2">{r.unitVisited ?? "—"}</td>
                  <td className="p-2 whitespace-nowrap">{fmt(r.dateEnter)}</td>
                  <td className="p-2 whitespace-nowrap">{fmt(r.dateExit)}</td>
                  <td className="p-2">{r.visitPurpose ?? "—"}</td>
                  <td className="p-2">{r.authBy ?? "—"}</td>
                  <td className="p-2 whitespace-nowrap">{fmt(r.archivedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-4 text-sm">
          {page > 1 ? (
            <Link href={href(page - 1)}>← Previous</Link>
          ) : (
            <span className="text-gray-400">← Previous</span>
          )}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href(page + 1)}>Next →</Link>
          ) : (
            <span className="text-gray-400">← Previous</span>
          )}
        </nav>
      )}
    </div>
  );
}
