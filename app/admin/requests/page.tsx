import { requireAdminPage } from "@/lib/auth";
import { readApplications, type TenantApplicationDto } from "@/lib/tenant-applications";
import { approve, reject } from "./actions";

export const dynamic = "force-dynamic";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

const BADGE = {
  pending: "bg-amber-200 text-amber-900",
  approved: "bg-green-200 text-green-900",
  rejected: "bg-red-200 text-red-900",
} as const;

function Pending({ a }: { a: TenantApplicationDto }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded border border-gray-300 bg-white p-4">
      <div className="min-w-64 space-y-1">
        <p className="text-lg font-semibold">{a.fullName}</p>
        <p className="text-sm text-gray-700">
          {a.unitNo} · {a.email}
        </p>
        {a.applicant && !a.applicant.emailMatchesAccount && (
          <p className="text-sm text-amber-700">
            Differs from their account email ({a.applicant.accountEmail ?? "none"})
          </p>
        )}
        <p className="text-xs text-gray-500">
          Requested {when(a.requestedAt)}
          {a.applicant?.contact ? ` · ${a.applicant.contact}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <form action={reject} className="flex items-center gap-2">
          <input type="hidden" name="id" value={a.id} />
          <input
            name="note"
            maxLength={300}
            placeholder="Reason (optional)"
            className="w-48 rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">Reject</button>
        </form>
        <form action={approve}>
          <input type="hidden" name="id" value={a.id} />
          <button className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">Approve</button>
        </form>
      </div>
    </li>
  );
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const admin = await requireAdminPage();
  const { ok, err } = await searchParams;
  const all = await readApplications(admin);
  const pending = all.filter((a) => a.status === "pending");
  const history = all.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Requests</h1>
        <p className="text-gray-600">Visitors asking to become tenants.</p>
      </div>

      {ok && <p className="rounded bg-green-100 p-3 text-green-900">{ok}</p>}
      {err && <p className="rounded bg-red-100 p-3 text-red-900">{err}</p>}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Waiting for a decision <span className="text-gray-500">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-gray-600">No visitors are waiting to become tenants.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((a) => (
              <Pending key={a.id} a={a} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Decided</h2>
        {history.length === 0 ? (
          <p className="text-gray-600">Nothing yet.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-300 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Decided</th>
                  <th className="p-3">By</th>
                  <th className="p-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {history.map((a) => (
                  <tr key={a.id} className="border-t border-gray-200">
                    <td className="p-3">{a.fullName}</td>
                    <td className="p-3">{a.unitNo}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-0.5 ${BADGE[a.status]}`}>{a.status}</span>
                    </td>
                    <td className="p-3">{a.respondedAt ? when(a.respondedAt) : ""}</td>
                    <td className="p-3">{a.reviewedBy ?? ""}</td>
                    <td className="p-3">{a.reviewNote ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
