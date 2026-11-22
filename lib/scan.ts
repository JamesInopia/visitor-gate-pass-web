import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { archives, entryLog, gatePass, users, visitorRequest } from "@/db/schema";
import type { Profile } from "@/lib/auth";
import { expiresAtOf, type Pass } from "@/lib/gatepasses";
import { downloadIdImage } from "@/lib/storage";

const visitor = alias(users, "visitor");
const host = alias(users, "host");

export type DenyReason = "invalid" | "expired" | "not_yet" | "revoked";

type PassInfo = {
  visitorName: string;
  hostName: string;
  unitNo: string | null;
  purpose: string | null;
  startsAt: string;
  expiresAt: string;
  code: string;
};

export type ScanResult =
  | ({ ok: true; action: "enter" | "exit"; at: string } & PassInfo)
  | ({ ok: false; reason: Exclude<DenyReason, "invalid"> } & PassInfo)
  | { ok: false; reason: "invalid" };

type Denied = Extract<ScanResult, { ok: false }>;

// What the gate screen needs before anything is recorded.
export type ScanPreview =
  | ({ ok: true; action: "enter" | "exit"; firstEntry: boolean; idImageUrl: string | null } & PassInfo)
  | Denied;

// "needs_review": a first entry was sent without the admin's confirmation.
export type ScanOutcome = ScanResult | { ok: false; reason: "needs_review" };

const pgCode = (e: unknown) => {
  const x = e as { code?: string; cause?: { code?: string } };
  return x.code ?? x.cause?.code;
};

// Accept "ABCD-EFGH", "abcd efgh" or "ABCDEFGH" typed by hand at the gate.
function normalizeCode(raw: string) {
  const c = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : raw.trim().toUpperCase();
}

type Found = {
  pass: Pass;
  request: typeof visitorRequest.$inferSelect;
  info: PassInfo;
};

// Finds the pass and checks it is valid right now. Records nothing.
async function lookupPass(rawCode: string): Promise<{ denied: Denied; found?: undefined } | { denied?: undefined; found: Found }> {
  const code = normalizeCode(rawCode);
  const [row] = await db
    .select({ pass: gatePass, request: visitorRequest, visitor, host })
    .from(gatePass)
    .innerJoin(visitorRequest, eq(visitorRequest.requestId, gatePass.requestId))
    .innerJoin(visitor, eq(visitor.userId, visitorRequest.visitorId))
    .innerJoin(host, eq(host.userId, visitorRequest.hostId))
    .where(eq(gatePass.code, code));
  if (!row) return { denied: { ok: false, reason: "invalid" } };

  const { pass, request } = row;
  const startsAt = pass.issuedAt;
  const expiresAt = expiresAtOf(pass);
  const info: PassInfo = {
    visitorName: row.visitor.name,
    hostName: row.host.name,
    unitNo: row.host.unitNo,
    purpose: request.purposeOfVisit,
    startsAt: startsAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    code: pass.code,
  };

  const now = new Date();
  if (pass.status === "revoked" || request.status !== "approved") return { denied: { ok: false, reason: "revoked", ...info } };
  if (pass.status === "expired" || now >= expiresAt) return { denied: { ok: false, reason: "expired", ...info } };
  if (now < startsAt) return { denied: { ok: false, reason: "not_yet", ...info } };
  return { found: { pass, request, info } };
}

// Looks the pass up and says whether this would be the visitor's first entry.
// Records nothing. The ID image is only offered on a first entry.
export async function previewPass(rawCode: string): Promise<ScanPreview> {
  const looked = await lookupPass(rawCode);
  if (looked.denied) return looked.denied;
  const found = looked.found;

  const entries = await db.select({ dateExit: entryLog.dateExit }).from(entryLog).where(eq(entryLog.passId, found.pass.passId));
  const firstEntry = entries.length === 0;
  return {
    ok: true,
    action: entries.some((e) => e.dateExit === null) ? "exit" : "enter",
    firstEntry,
    idImageUrl:
      firstEntry && found.request.idImageUrl
        ? `/api/scan/id-image?code=${encodeURIComponent(found.pass.code)}`
        : null,
    ...found.info,
  };
}

// The ID photo the visitor submitted with this pass's request, for the admin's review.
export async function readPassIdImage(rawCode: string) {
  const [row] = await db
    .select({ path: visitorRequest.idImageUrl })
    .from(gatePass)
    .innerJoin(visitorRequest, eq(visitorRequest.requestId, gatePass.requestId))
    .where(eq(gatePass.code, normalizeCode(rawCode)));
  return row?.path ? downloadIdImage(row.path) : null;
}

// `confirmed` means the admin looked at the ID and let the visitor in. A first entry is only
// recorded when it is set; after that, scans record exits and re-entries on their own.
export async function scanPass(admin: Profile, rawCode: string, confirmed = false): Promise<ScanOutcome> {
  const looked = await lookupPass(rawCode);
  if (looked.denied) return looked.denied;
  const { pass, info } = looked.found;

  const now = new Date();
  // First scan opens an entry, the next one closes it, and so on.
  // one_open_entry_per_pass makes a racing double-scan fail with 23505, so retry once.
  for (let attempt = 0; ; attempt++) {
    try {
      const action = await db.transaction(async (tx) => {
        const entries = await tx
          .select({ entryId: entryLog.entryId, dateExit: entryLog.dateExit })
          .from(entryLog)
          .where(eq(entryLog.passId, pass.passId));
        if (entries.length === 0 && !confirmed) return "needs_review" as const;

        const open = entries.find((e) => e.dateExit === null);
        if (open) {
          await tx
            .update(entryLog)
            .set({ dateExit: now })
            .where(and(eq(entryLog.entryId, open.entryId), isNull(entryLog.dateExit)));
          return "exit" as const;
        }
        await tx.insert(entryLog).values({ passId: pass.passId, adminId: admin.userId, dateEnter: now });
        return "enter" as const;
      });
      if (action === "needs_review") return { ok: false, reason: "needs_review" };
      return { ok: true, action, at: now.toISOString(), ...info };
    } catch (e) {
      if (attempt >= 1 || pgCode(e) !== "23505") throw e;
    }
  }
}

export type EntryEventDto = {
  id: string;
  kind: "enter" | "exit";
  at: string;
  visitorName: string;
  code: string;
};

// entry_log keeps one row per visit (enter + optional exit); the app shows them as separate events.
export async function readEntryLog(limit = 100): Promise<EntryEventDto[]> {
  const rows = await db
    .select({
      entryId: entryLog.entryId,
      dateEnter: entryLog.dateEnter,
      dateExit: entryLog.dateExit,
      code: gatePass.code,
      visitorName: visitor.name,
    })
    .from(entryLog)
    .innerJoin(gatePass, eq(gatePass.passId, entryLog.passId))
    .innerJoin(visitorRequest, eq(visitorRequest.requestId, gatePass.requestId))
    .innerJoin(visitor, eq(visitor.userId, visitorRequest.visitorId))
    .orderBy(desc(entryLog.dateEnter))
    .limit(limit);

  const events = rows.flatMap((r): EntryEventDto[] => {
    const base = { visitorName: r.visitorName, code: r.code };
    return [
      ...(r.dateEnter ? [{ ...base, id: `${r.entryId}-in`, kind: "enter" as const, at: r.dateEnter.toISOString() }] : []),
      ...(r.dateExit ? [{ ...base, id: `${r.entryId}-out`, kind: "exit" as const, at: r.dateExit.toISOString() }] : []),
    ];
  });
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export type VisitDto = {
  id: string;
  hostName: string | null;
  unitNo: string | null;
  purpose: string | null;
  dateEnter: string | null;
  dateExit: string | null;
};

export async function readVisits(visitorId: number): Promise<VisitDto[]> {
  const rows = await db
    .select()
    .from(archives)
    .where(eq(archives.visitorId, visitorId))
    .orderBy(desc(archives.dateEnter));
  return rows.map((a) => ({
    id: String(a.logId),
    hostName: null, // archives has no host column; see note about adding "hostName"
    unitNo: a.unitVisited,
    purpose: a.visitPurpose,
    dateEnter: a.dateEnter?.toISOString() ?? null,
    dateExit: a.dateExit?.toISOString() ?? null,
  }));
}
