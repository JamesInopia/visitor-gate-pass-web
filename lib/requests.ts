import "server-only";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { gatePass, notices, users, visitorRequest } from "@/db/schema";
import { clearContactIfIdle, purgeRequest } from "@/lib/archive";
import type { Profile } from "@/lib/auth";
import { MAX_DAYS_AHEAD, addDays, todayKey } from "@/lib/dates";
import { expiresAtOf, newCode } from "@/lib/gatepasses";
import { removeIdImage, saveIdImage } from "@/lib/storage";

const visitor = alias(users, "visitor");
const host = alias(users, "host");

const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;

export type RequestDto = {
  id: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  visitorName: string;
  hostName: string;
  unitNo: string | null;
  purpose: string;
  visitDate: string | null;
  requestedAt: string;
  respondedAt: string | null;
  pass: { code: string; startsAt: string; expiresAt: string } | null;
  visitorContact?: string | null;
};

const select = () =>
  db
    .select({ request: visitorRequest, visitor, host, pass: gatePass })
    .from(visitorRequest)
    .innerJoin(visitor, eq(visitor.userId, visitorRequest.visitorId))
    .innerJoin(host, eq(host.userId, visitorRequest.hostId))
    .leftJoin(gatePass, eq(gatePass.requestId, visitorRequest.requestId));

type Row = Awaited<ReturnType<typeof select>>[number];

const pgCode = (e: unknown) => {
  const x = e as { code?: string; cause?: { code?: string } };
  return x.code ?? x.cause?.code;
};

function toDto(row: Row, viewer: Profile): RequestDto {
  const { request, pass } = row;
  const live = request.status === "approved" && pass && pass.status !== "revoked";
  return {
    id: String(request.requestId),
    status: request.status,
    visitorName: row.visitor.name,
    hostName: row.host.name,
    unitNo: row.host.unitNo,
    purpose: request.purposeOfVisit ?? "",
    visitDate: request.visitDate,
    requestedAt: request.requestedAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString() ?? null,
    pass: live
      ? { code: pass.code, startsAt: pass.issuedAt.toISOString(), expiresAt: expiresAtOf(pass).toISOString() }
      : null,
    ...(viewer.role !== "visitor" ? { visitorContact: row.visitor.contact } : {}),
  };
}

const canSee = (viewer: Profile, row: Row) =>
  (viewer.role === "visitor" && row.request.visitorId === viewer.userId) ||
  (viewer.role === "tenant" && row.request.hostId === viewer.userId);

export async function readRequests(viewer: Profile): Promise<RequestDto[]> {
  const where =
    viewer.role === "visitor"
      ? eq(visitorRequest.visitorId, viewer.userId)
      : eq(visitorRequest.hostId, viewer.userId);
  const rows = await select().where(where).orderBy(desc(visitorRequest.requestedAt));
  return rows.map((r) => toDto(r, viewer));
}

export async function readRequest(viewer: Profile, requestId: number): Promise<RequestDto | null> {
  const [row] = await select().where(eq(visitorRequest.requestId, requestId));
  return row && canSee(viewer, row) ? toDto(row, viewer) : null;
}

async function hasActivePass(visitorId: number): Promise<boolean> {
  const rows = await select().where(and(eq(visitorRequest.visitorId, visitorId), eq(visitorRequest.status, "approved")));
  let active = false;
  for (const row of rows) {
    if (row.pass && expiresAtOf(row.pass) <= new Date()) await purgeRequest(row.request.requestId);
    else active = true;
  }
  return active;
}

export type CreateInput = { hostName: string; unitNo: string; visitDate: string; purpose: string; contact: string };

export type CreateResult =
  | { ok: true; request: RequestDto }
  | { ok: false; reason: "no_tenant" | "visit_date_passed" | "visit_date_invalid" | "has_active_pass" | "duplicate" };

export async function createRequest(visitorProfile: Profile, input: CreateInput, idImage: File): Promise<CreateResult> {
  const [tenant] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.role, "tenant"),
        sql`lower(trim(${users.unitNo})) = ${input.unitNo.toLowerCase()}`,
        sql`lower(trim(${users.name})) = ${input.hostName.toLowerCase()}`,
      ),
    );
  if (!tenant) return { ok: false, reason: "no_tenant" };

  const today = todayKey();
  if (input.visitDate < today) return { ok: false, reason: "visit_date_passed" };
  if (input.visitDate > addDays(today, MAX_DAYS_AHEAD)) return { ok: false, reason: "visit_date_invalid" };

  if (await hasActivePass(visitorProfile.userId)) return { ok: false, reason: "has_active_pass" };

  const [pending] = await db
    .select({ requestId: visitorRequest.requestId })
    .from(visitorRequest)
    .where(
      and(
        eq(visitorRequest.visitorId, visitorProfile.userId),
        eq(visitorRequest.hostId, tenant.userId),
        eq(visitorRequest.status, "pending"),
      ),
    );
  if (pending) return { ok: false, reason: "duplicate" };

  const path = await saveIdImage(visitorProfile.userId, idImage);
  try {
    const requestId = await db.transaction(async (tx) => {
      await tx.update(users).set({ contact: input.contact }).where(eq(users.userId, visitorProfile.userId));
      const [created] = await tx
        .insert(visitorRequest)
        .values({
          visitorId: visitorProfile.userId,
          hostId: tenant.userId,
          visitDate: input.visitDate,
          purposeOfVisit: input.purpose,
          idImageUrl: path,
        })
        .returning({ requestId: visitorRequest.requestId });
      return created.requestId;
    });
    const [row] = await select().where(eq(visitorRequest.requestId, requestId));
    return { ok: true, request: toDto(row, visitorProfile) };
  } catch (e) {
    await removeIdImage(path);
    throw e;
  }
}

export type AnswerFailure = { ok: false; reason: "not-found" | "already-answered" | "bad-window" };

async function pendingFor(
  tenant: Profile,
  requestId: number,
): Promise<{ row: Row; fail?: undefined } | { row?: undefined; fail: AnswerFailure }> {
  const [row] = await select().where(and(eq(visitorRequest.requestId, requestId), eq(visitorRequest.hostId, tenant.userId)));
  if (!row) return { fail: { ok: false, reason: "not-found" } };
  if (row.request.status !== "pending") return { fail: { ok: false, reason: "already-answered" } };
  return { row };
}

export async function approveRequest(
  tenant: Profile,
  requestId: number,
  startsAt: Date,
  expiresAt: Date,
): Promise<{ ok: true; request: RequestDto } | AnswerFailure> {
  const found = await pendingFor(tenant, requestId);
  if (found.fail) return found.fail;
  const visitorId = found.row.request.visitorId;

  const now = new Date();
  if (!(startsAt < expiresAt) || expiresAt <= now || expiresAt.getTime() - startsAt.getTime() > MAX_WINDOW_MS)
    return { ok: false, reason: "bad-window" };
  if (await hasActivePass(visitorId)) return { ok: false, reason: "already-answered" };

  let droppedImages: (string | null)[];
  try {
    droppedImages = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(visitorRequest)
        .set({ status: "approved", respondedAt: now })
        .where(and(eq(visitorRequest.requestId, requestId), eq(visitorRequest.status, "pending")))
        .returning({ requestId: visitorRequest.requestId });
      if (!updated) throw new Error("already-answered");

      for (let attempt = 0; ; attempt++) {
        try {
          await tx.transaction((sp) =>
            sp.insert(gatePass).values({ requestId, code: newCode(), issuedAt: startsAt, expiryDate: expiresAt }),
          );
          break;
        } catch (e) {
          if (attempt >= 4 || pgCode(e) !== "23505") throw e;
        }
      }

      const others = and(
        eq(visitorRequest.visitorId, visitorId),
        eq(visitorRequest.status, "pending"),
        ne(visitorRequest.requestId, requestId),
      );
      const images = (await tx.select({ path: visitorRequest.idImageUrl }).from(visitorRequest).where(others)).map((r) => r.path);
      await tx.update(visitorRequest).set({ status: "cancelled", respondedAt: now, idImageUrl: null }).where(others);
      return images;
    });
  } catch (e) {
    if ((e as Error).message === "already-answered" || pgCode(e) === "23505") return { ok: false, reason: "already-answered" };
    throw e;
  }

  await Promise.all(droppedImages.map((p) => removeIdImage(p)));
  const [row] = await select().where(eq(visitorRequest.requestId, requestId));
  return { ok: true, request: toDto(row, tenant) };
}

export async function denyRequest(tenant: Profile, requestId: number): Promise<{ ok: true } | AnswerFailure> {
  const found = await pendingFor(tenant, requestId);
  if (found.fail) return found.fail;

  const gone = await db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(visitorRequest)
      .where(and(eq(visitorRequest.requestId, requestId), eq(visitorRequest.status, "pending")))
      .returning();
    if (!deleted) return null;
    await tx.insert(notices).values({
      userId: deleted.visitorId,
      kind: "denied",
      hostName: tenant.name,
      visitDate: deleted.visitDate,
    });
    await clearContactIfIdle(tx, deleted.visitorId);
    return deleted;
  });
  if (!gone) return { ok: false, reason: "already-answered" };
  await removeIdImage(gone.idImageUrl);
  return { ok: true };
}

export async function removeRequest(visitorProfile: Profile, requestId: number): Promise<boolean> {
  const [row] = await select().where(
    and(eq(visitorRequest.requestId, requestId), eq(visitorRequest.visitorId, visitorProfile.userId)),
  );
  if (!row) return false;
  await purgeRequest(requestId);
  return true;
}
