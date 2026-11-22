import "server-only";
import { alias } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  archives,
  entryLog,
  gatePass,
  users,
  visitorRequest,
} from "@/db/schema";
import { removeIdImage } from "@/lib/storage";
import { TIMEZONE } from "./dates";

const host = alias(users, "host");

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function clearContactIfIdle(tx: Tx, visitorId: number) {
  await tx
    .update(users)
    .set({ contact: null })
    .where(
      and(
        eq(users.userId, visitorId),
        sql`not exists (select 1 from ${visitorRequest} where ${visitorRequest.visitorId} = ${visitorId})`,
      ),
    );
}

export type Archive = typeof archives.$inferSelect;

export async function purgeRequest(requestId: number) {
  const imagePath = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ request: visitorRequest, visitor: users, host, pass: gatePass })
      .from(visitorRequest)
      .innerJoin(users, eq(users.userId, visitorRequest.visitorId))
      .innerJoin(host, eq(host.userId, visitorRequest.hostId))
      .leftJoin(gatePass, eq(gatePass.requestId, visitorRequest.requestId))
      .where(eq(visitorRequest.requestId, requestId));
    if (!row) return null;

    if (row.pass) {
      const logs = await tx
        .select({
          dateEnter: entryLog.dateEnter,
          dateExit: entryLog.dateExit,
          adminName: users.name,
        })
        .from(entryLog)
        .innerJoin(users, eq(users.userId, entryLog.adminId))
        .where(eq(entryLog.passId, row.pass.passId))
        .orderBy(asc(entryLog.dateEnter));

      if (logs.length > 0) {
        const exits = logs.flatMap((l) =>
          l.dateExit ? [l.dateExit.getTime()] : [],
        );
        await tx
          .insert(archives)
          .values({
            visitorName: row.visitor.name,
            contact: row.visitor.contact,
            unitVisited: row.host.unitNo,
            dateEnter: logs[0].dateEnter,
            dateExit: exits.length ? new Date(Math.max(...exits)) : null,
            visitPurpose: row.request.purposeOfVisit,
            authBy: logs[0].adminName,
            visitorId: row.request.visitorId,
            passId: row.pass.passId,
            hostName: row.host.name,
          })
          .onConflictDoNothing({ target: archives.passId });
      }
    }

    await tx
      .delete(visitorRequest)
      .where(eq(visitorRequest.requestId, requestId));
    await clearContactIfIdle(tx, row.request.visitorId);
    return row.request.idImageUrl;
  });
  await removeIdImage(imagePath);
}

export async function sweepExpired(): Promise<number> {
  const due = await db
    .select({ requestId: gatePass.requestId })
    .from(gatePass)
    .where(lt(gatePass.expiryDate, new Date()))
    .limit(100);
  let done = 0;
  for (const { requestId } of due) {
    try {
      await purgeRequest(requestId);
      done++;
    } catch (e) {
      console.error("sweepExpired", requestId, e);
    }
  }
  return done;
}

export const ARCHIVE_PAGE_SIZE = 20;

export type ArchiveQuery = {
  q?: string;
  from?: string;
  to?: string;
  page?: number;
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

export async function listArchives({ q, from, to, page = 1 }: ArchiveQuery) {
  const term = q?.trim();
  const dayOf = sql`(${archives.dateEnter} at time zone ${TIMEZONE})::date`;

  const filters: (SQL | undefined)[] = [
    term
      ? or(
          ilike(archives.visitorName, `%${escapeLike(term)}%`),
          ilike(archives.unitVisited, `%${escapeLike(term)}%`),
          ilike(archives.authBy, `%${escapeLike(term)}%`),
          ilike(archives.visitPurpose, `%${escapeLike(term)}%`),
        )
      : undefined,
    from && DATE_KEY.test(from) ? sql`${dayOf} >= ${from}::date` : undefined,
    to && DATE_KEY.test(to) ? sql`${dayOf} <= ${to}::date` : undefined,
  ];
  const where = and(...filters);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(archives)
    .where(where);
  const pages = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);

  const rows = await db
    .select()
    .from(archives)
    .where(where)
    .orderBy(desc(archives.dateEnter), desc(archives.logId))
    .limit(ARCHIVE_PAGE_SIZE)
    .offset(current * 1 * ARCHIVE_PAGE_SIZE);

  return { rows, total, page: current, pages };
}
