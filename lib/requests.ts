import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { gatePass, users, visitorRequest } from "@/db/schema";
import { purgeRequest } from "@/lib/archive";
import type { Profile } from "@/lib/auth";
import { DEFAULT_PASS_MS, MAX_PASS_MS, expiresAtOf, newCode } from "@/lib/gatepasses";
import { removeIdImage, saveIdImage } from "@/lib/storage";

const visitor = alias(users, "visitor");
const host = alias(users, "host");

export type RequestDto = {
  id: string;
  status: "pending" | "approved" | "denied";
  visitorName: string;
  hostName: string;
  unitNo: string | null;
  purpose: string;
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

function toDto(row: Row, viewer: Profile): RequestDto {
  const { request, pass } = row;
  const status = request.status === "pending" ? "pending" : request.status === "approved" ? "approved" : "denied";
  const live = status === "approved" && pass && pass.status !== "revoked";
  return {
    id: String(request.requestId),
    status,
    visitorName: row.visitor.name,
    hostName: row.host.name,
    unitNo: row.host.unitNo,
    purpose: request.purposeOfVisit ?? "",
    requestedAt: request.requestedAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString() ?? null,
    pass: pass && live
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

export type CreateInput = { hostName: string; unitNo: string; purpose: string; contact: string };

export async function createRequest(
  visitorProfile: Profile,
  input: CreateInput,
  idImage: File,
): Promise<{ ok: true; request: RequestDto } | { ok: false; reason: "host-not-found" | "duplicate" }> {
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
  if (!tenant) return { ok: false, reason: "host-not-found" };

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

export type RespondResult =
  | { ok: true; request: RequestDto }
  | { ok: false; reason: "not-found" | "already-answered" | "bad-expiry" };

export async function respondToRequest(
  tenant: Profile,
  requestId: number,
  decision: "approve" | "deny",
  expiresAt?: Date,
): Promise<RespondResult> {
  const [current] = await select().where(and(eq(visitorRequest.requestId, requestId), eq(visitorRequest.hostId, tenant.userId)));
  if (!current) return { ok: false, reason: "not-found" };
  if (current.request.status !== "pending") return { ok: false, reason: "already-answered" };

  const now = new Date();
  const expiry = expiresAt ?? new Date(now.getTime() + DEFAULT_PASS_MS);
  if (decision === "approve" && (expiry <= now || expiry.getTime() - now.getTime() > MAX_PASS_MS))
    return { ok: false, reason: "bad-expiry" };

  const changed = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(visitorRequest)
      .set({
        status: decision === "approve" ? "approved" : "rejected",
        respondedAt: now,
        ...(decision === "deny" ? { idImageUrl: null } : {}),
      })
      .where(and(eq(visitorRequest.requestId, requestId), eq(visitorRequest.status, "pending")))
      .returning({ requestId: visitorRequest.requestId });
    if (!updated) return false;

    if (decision === "approve") {
      for (let attempt = 0; ; attempt++) {
        try {
          await tx.transaction((sp) =>
            sp.insert(gatePass).values({ requestId, code: newCode(), expiryDate: expiry, issuedAt: now }),
          );
          break;
        } catch (e) {
          const code = (e as { code?: string; cause?: { code?: string } });
          if (attempt >= 4 || (code.code ?? code.cause?.code) !== "23505") throw e;
        }
      }
    }
    return true;
  });
  if (!changed) return { ok: false, reason: "already-answered" };

  if (decision === "deny") await removeIdImage(current.request.idImageUrl);
  const [row] = await select().where(eq(visitorRequest.requestId, requestId));
  return { ok: true, request: toDto(row, tenant) };
}

export type RemoveResult = { ok: true } | { ok: false; reason: "not-found" | "not-cancellable" };

export async function removeRequest(viewer: Profile, requestId: number): Promise<RemoveResult> {
  const [row] = await select().where(eq(visitorRequest.requestId, requestId));
  if (!row || !canSee(viewer, row)) return { ok: false, reason: "not-found" };

  if (viewer.role === "visitor") {
    await purgeRequest(requestId);
    return { ok: true };
  }

  if (row.request.status !== "approved" || !row.pass || row.pass.status === "revoked")
    return { ok: false, reason: "not-cancellable" };
  await db.transaction(async (tx) => {
    await tx.update(gatePass).set({ status: "revoked" }).where(eq(gatePass.requestId, requestId));
    await tx
      .update(visitorRequest)
      .set({ status: "cancelled", respondedAt: new Date(), idImageUrl: null })
      .where(eq(visitorRequest.requestId, requestId));
  });
  await removeIdImage(row.request.idImageUrl);
  return { ok: true };
}
