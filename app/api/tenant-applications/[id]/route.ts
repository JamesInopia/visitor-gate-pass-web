import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { ApplicationDecisionSchema } from "@/lib/definitions";
import { fail, parseId } from "@/lib/http";
import { approveApplication, readApplication, rejectApplication } from "@/lib/tenant-applications";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "visitor" && profile.role !== "admin") return fail(403);
  const id = parseId((await params).id);
  const row = id && (await readApplication(profile, id));
  return row ? NextResponse.json(row) : fail(404);
}

// Admin accepts or rejects: { "decision": "approve" } or { "decision": "reject", "note": "optional" }.
export async function PATCH(request: Request, { params }: Ctx) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "admin") return fail(403);
  const id = parseId((await params).id);
  if (!id) return fail(404);

  const parsed = ApplicationDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, parsed.error.issues[0].message);

  const result =
    parsed.data.decision === "approve"
      ? await approveApplication(profile, id)
      : await rejectApplication(profile, id, parsed.data.note);

  if (result.ok) return NextResponse.json(result.application);
  if (result.reason === "not-found") return fail(404);
  return fail(409, result.reason);
}
