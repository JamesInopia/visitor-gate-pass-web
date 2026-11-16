import { NextResponse } from "next/server";
import * as z from "zod";
import { getProfile } from "@/lib/auth";
import { TenantApplicationSchema } from "@/lib/definitions";
import { fail } from "@/lib/http";
import { createApplication, readApplications } from "@/lib/tenant-applications";
import { TENANT_APPLICATION_STATUSES } from "@/db/schema";

const StatusFilter = z.enum(TENANT_APPLICATION_STATUSES);

// Visitors get their own applications (newest first). Admins get everyone's, and can
// narrow it with ?status=pending|approved|rejected.
export async function GET(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "visitor" && profile.role !== "admin") return fail(403);

  const raw = new URL(request.url).searchParams.get("status");
  let status;
  if (raw !== null) {
    const parsed = StatusFilter.safeParse(raw);
    if (!parsed.success) return fail(400, "Status must be pending, approved or rejected.");
    status = parsed.data;
  }
  return NextResponse.json(await readApplications(profile, status));
}

// A visitor asks to become a tenant.
export async function POST(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "visitor") return fail(403);

  const parsed = TenantApplicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, parsed.error.issues[0].message);

  const result = await createApplication(profile, parsed.data);
  if (result.ok) return NextResponse.json(result.application, { status: 201 });
  return fail(409, result.reason);
}
