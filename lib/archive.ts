import "server-only";
import { alias } from "drizzle-orm/pg-core";
import { and, asc, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { archives, entryLog, gatePass, users, visitorRequest } from "@/db/schema";
import { removeIdImage } from "@/lib/storage";

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
        .select({ dateEnter: entryLog.dateEnter, dateExit: entryLog.dateExit, adminName: users.name })
        .from(entryLog)
        .innerJoin(users, eq(users.userId, entryLog.adminId))
        .where(eq(entryLog.passId, row.pass.passId))
        .orderBy(asc(entryLog.dateEnter));

      if (logs.length > 0) {
        const exits = logs.flatMap((l) => (l.dateExit ? [l.dateExit.getTime()] : []));
        await tx.insert(archives).values({
          visitorName: row.visitor.name,
          unitVisited: row.host.unitNo,
          dateEnter: logs[0].dateEnter,
          dateExit: exits.length ? new Date(Math.max(...exits)) : null,
          visitPurpose: row.request.purposeOfVisit,
          authBy: logs[0].adminName,
        });
      }
    }

    await tx.delete(visitorRequest).where(eq(visitorRequest.requestId, requestId));
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
