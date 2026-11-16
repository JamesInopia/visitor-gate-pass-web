import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { gatePass, tenantApplication, users, visitorRequest, type TenantApplicationStatus } from "@/db/schema";
import { purgeRequest } from "@/lib/archive";
import type { Profile } from "@/lib/auth";
import { expiresAtOf } from "@/lib/gatepasses";

const applicant = alias(users, "applicant");
const reviewer = alias(users, "reviewer");

export type TenantApplicationDto = {
  id: string;
  status: TenantApplicationStatus;
  fullName: string;
  email: string;
  unitNo: string;
  requestedAt: string;
  respondedAt: string | null;
  reviewNote: string | null;
  // Only sent to admins.
  applicant?: { userId: number; accountEmail: string | null; contact: string | null; emailMatchesAccount: boolean };
  reviewedBy?: string | null;
};

const select = () =>
  db
    .select({ application: tenantApplication, applicant, reviewerName: reviewer.name })
    .from(tenantApplication)
    .innerJoin(applicant, eq(applicant.userId, tenantApplication.userId))
    .leftJoin(reviewer, eq(reviewer.userId, tenantApplication.reviewedBy));

type Row = Awaited<ReturnType<typeof select>>[number];

const pgCode = (e: unknown) => {
  const x = e as { code?: string; cause?: { code?: string } };
  return x.code ?? x.cause?.code;
};

function toDto(row: Row, viewer: Profile): TenantApplicationDto {
  const { application: a } = row;
  const dto: TenantApplicationDto = {
    id: String(a.applicationId),
    status: a.status,
    fullName: a.fullName,
    email: a.email,
    unitNo: a.unitNo,
    requestedAt: a.requestedAt.toISOString(),
    respondedAt: a.respondedAt?.toISOString() ?? null,
    reviewNote: a.reviewNote,
  };
  if (viewer.role === "admin") {
    dto.applicant = {
      userId: row.applicant.userId,
      accountEmail: row.applicant.email,
      contact: row.applicant.contact,
      emailMatchesAccount: (row.applicant.email ?? "").toLowerCase() === a.email.toLowerCase(),
    };
    dto.reviewedBy = row.reviewerName;
  }
  return dto;
}

// Visitors see their own applications. Admins see everyone's, optionally filtered by status.
export async function readApplications(
  viewer: Profile,
  status?: TenantApplicationStatus,
): Promise<TenantApplicationDto[]> {
  const where =
    viewer.role === "admin"
      ? status
        ? eq(tenantApplication.status, status)
        : undefined
      : eq(tenantApplication.userId, viewer.userId);
  const rows = await select().where(where).orderBy(desc(tenantApplication.requestedAt));
  return rows.map((r) => toDto(r, viewer));
}

export async function readApplication(viewer: Profile, id: number): Promise<TenantApplicationDto | null> {
  const [row] = await select().where(eq(tenantApplication.applicationId, id));
  if (!row) return null;
  if (viewer.role !== "admin" && row.application.userId !== viewer.userId) return null;
  return toDto(row, viewer);
}

export type CreateInput = { fullName: string; email: string; unitNo: string };
export type CreateResult = { ok: true; application: TenantApplicationDto } | { ok: false; reason: "already_pending" };

export async function createApplication(visitorProfile: Profile, input: CreateInput): Promise<CreateResult> {
  try {
    const [created] = await db
      .insert(tenantApplication)
      .values({ userId: visitorProfile.userId, ...input })
      .returning({ id: tenantApplication.applicationId });
    const [row] = await select().where(eq(tenantApplication.applicationId, created.id));
    return { ok: true, application: toDto(row, visitorProfile) };
  } catch (e) {
    // one_pending_application_per_user: the visitor already has one waiting.
    if (pgCode(e) === "23505") return { ok: false, reason: "already_pending" };
    throw e;
  }
}

export type DecisionFailure = {
  ok: false;
  reason: "not-found" | "already-answered" | "not-a-visitor" | "has-active-pass";
};
export type DecisionResult = { ok: true; application: TenantApplicationDto } | DecisionFailure;

export async function approveApplication(admin: Profile, id: number): Promise<DecisionResult> {
  const now = new Date();

  const outcome = await db.transaction(async (tx): Promise<DecisionFailure | { ok: true; visitorId: number }> => {
    const [app] = await tx
      .select()
      .from(tenantApplication)
      .where(eq(tenantApplication.applicationId, id))
      .for("update");
    if (!app) return { ok: false, reason: "not-found" };
    if (app.status !== "pending") return { ok: false, reason: "already-answered" };

    const [user] = await tx.select().from(users).where(eq(users.userId, app.userId)).for("update");
    if (!user || user.role !== "visitor") return { ok: false, reason: "not-a-visitor" };

    // A visitor with a live gatepass has to wait for it to end before switching roles.
    const passes = await tx
      .select({ pass: gatePass })
      .from(visitorRequest)
      .innerJoin(gatePass, eq(gatePass.requestId, visitorRequest.requestId))
      .where(and(eq(visitorRequest.visitorId, app.userId), eq(visitorRequest.status, "approved")));
    if (passes.some((p) => expiresAtOf(p.pass) > now)) return { ok: false, reason: "has-active-pass" };

    await tx
      .update(tenantApplication)
      .set({ status: "approved", respondedAt: now, reviewedBy: admin.userId, reviewNote: null })
      .where(eq(tenantApplication.applicationId, id));

    // The name and unit are what visitors type to find this tenant, so they come from the application.
    await tx
      .update(users)
      .set({ role: "tenant", name: app.fullName, unitNo: app.unitNo })
      .where(eq(users.userId, app.userId));

    return { ok: true, visitorId: app.userId };
  });

  if (!outcome.ok) return outcome;

  // The new tenant no longer sends gatepass requests, so clear out whatever they had as a visitor
  // (pending requests, expired passes, ID photos). Best effort: the role change has already happened.
  const leftovers = await db
    .select({ requestId: visitorRequest.requestId })
    .from(visitorRequest)
    .where(eq(visitorRequest.visitorId, outcome.visitorId));
  for (const { requestId } of leftovers) {
    try {
      await purgeRequest(requestId);
    } catch (e) {
      console.error("approveApplication: purge", requestId, e);
    }
  }

  const [row] = await select().where(eq(tenantApplication.applicationId, id));
  return { ok: true, application: toDto(row, admin) };
}

export async function rejectApplication(admin: Profile, id: number, note?: string): Promise<DecisionResult> {
  const [updated] = await db
    .update(tenantApplication)
    .set({ status: "rejected", respondedAt: new Date(), reviewedBy: admin.userId, reviewNote: note || null })
    .where(and(eq(tenantApplication.applicationId, id), eq(tenantApplication.status, "pending")))
    .returning({ id: tenantApplication.applicationId });

  if (!updated) {
    const [exists] = await db
      .select({ id: tenantApplication.applicationId })
      .from(tenantApplication)
      .where(eq(tenantApplication.applicationId, id));
    return { ok: false, reason: exists ? "already-answered" : "not-found" };
  }
  const [row] = await select().where(eq(tenantApplication.applicationId, id));
  return { ok: true, application: toDto(row, admin) };
}
