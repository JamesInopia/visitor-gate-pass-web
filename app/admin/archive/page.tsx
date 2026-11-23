import Link from "next/link";
import { listArchives, isSortKey, type SortKey } from "@/lib/archive";
import { TIMEZONE } from "@/lib/dates";
import FilterPopover from "@/components/admin/FilterPopover";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

const COLUMNS: { label: string; key: SortKey }[] = [
  { label: "Visitor", key: "visitor" },
  { label: "Contact", key: "contact" },
  { label: "Unit", key: "unit" },
  { label: "Time-In", key: "timeIn" },
  { label: "Time-Out", key: "timeOut" },
  { label: "Purpose", key: "purpose" },
  { label: "Authorized By", key: "authBy" },
  { label: "Tenant Visited", key: "tenant" },
  { label: "Archived At", key: "archived" },
];

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});
const dateTwoLine = (d: Date | null) =>
  d ? (
    <>
      {dateFmt.format(d)}
      <div className="text-xs text-gray-500">
        {timeFmt.format(d).toUpperCase()}
      </div>
    </>
  ) : (
    "-"
  );

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
  const sortParam = one(sp.sort);
  const sort: SortKey = isSortKey(sortParam) ? sortParam : "archived";
  const dir = one(sp.dir) === "asc" ? "asc" : "desc";

  const { rows, page, pages } = await listArchives({
    q,
    from,
    to,
    sort,
    dir,
    page: requested,
  });

  const build = (o: {
    page?: number;
    sort?: SortKey;
    dir?: "asc" | "desc";
  }) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const s = o.sort ?? sort;
    const d = o.dir ?? dir;
    if (s !== "archived" || d !== "desc") {
      params.set("sort", s);
      params.set("dir", d);
    }
    if (o.page && o.page > 1) params.set("page", String(o.page));
    const qs = params.toString();
    return qs ? `/admin/archive?${qs}` : "/admin/archive";
  };
  const href = (p: number) => build({ page: p });

  const filtered = Boolean(q || from || to);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <form method="get" className="flex items-center justify-end gap-4">
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <FilterPopover from={from} to={to} />
        <div className="relative">
          <svg
            viewBox="0 0 16 16"
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            autoComplete="off"
            placeholder="Search visitor, unit, tenant..."
            className="w-72 rounded border py-1 pr-2 pl-9 bg-white text-sm"
          />
        </div>
      </form>

      <div className="flex-1 overflow-x-auto bg-gray-300">
        <table className="w-full border-collapse text-center text-sm">
          <thead>
            <tr className="bg-gray-300">
              {COLUMNS.map((c) => {
                const active = sort === c.key;
                const nextDir = active && dir === "asc" ? "desc" : "asc";
                return (
                  <th key={c.key} className="p-0 font-semibold">
                    <Link
                      href={build({
                        sort: c.key,
                        dir: nextDir,
                      })}
                      title={`Sort by ${c.label}`}
                      className={`flex items-center justify-center gap-1 px-3 py-1.5 text-lg border-b-2 hover:bg-gray-200 ${
                        active ? "text-blue-800" : ""
                      }`}
                    >
                      {c.label}
                      <span
                        aria-hidden
                        className={`text-sm ${active ? "" : "text-gray-600"}`}
                      >
                        {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="bg-white">
                <td colSpan={COLUMNS.length} className="p-8 text-gray-500">
                  No archived visits{filtered ? " match these filters" : " yet"}
                  .
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.logId} className="odd:bg-white even:bg-gray-100">
                  <td className="px-3 py-1.5">{r.visitorName ?? "—"}</td>
                  <td className="px-3 py-1.5">{r.contact ?? "—"}</td>
                  <td className="px-3 py-1.5">{r.unitVisited ?? "—"}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    {dateTwoLine(r.dateEnter)}
                  </td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    {dateTwoLine(r.dateExit)}
                  </td>
                  <td className="px-3 py-1.5">{r.visitPurpose ?? "—"}</td>
                  <td className="px-3 py-1.5">{r.authBy ?? "—"}</td>
                  <td className="px-3 py-1.5">{r.hostName ?? "—"}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    {dateTwoLine(r.archivedAt)}
                  </td>
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
            <span className="text-gray-400">Next →</span>
          )}
        </nav>
      )}
    </div>
  );
}
