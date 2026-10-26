import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { RespondSchema } from "@/lib/definitions";
import { fail, noContent, parseId } from "@/lib/http";
import { approveRequest, denyRequest, readRequest, removeRequest } from "@/lib/requests";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  const id = parseId((await params).id);
  const row = id && (await readRequest(profile, id));
  return row ? NextResponse.json(row) : fail(404);
}

export async function PATCH(request: Request, { params }: Ctx) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "tenant") return fail(403);
  const id = parseId((await params).id);
  if (!id) return fail(404);

  const parsed = RespondSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, parsed.error.issues[0].message);

  const result =
    parsed.data.decision === "approve"
      ? await approveRequest(profile, id, parsed.data.startsAt, parsed.data.expiresAt)
      : await denyRequest(profile, id);

  if (result.ok) return "request" in result ? NextResponse.json(result.request) : noContent();
  if (result.reason === "not-found") return fail(404);
  return fail(result.reason === "bad-window" ? 400 : 409, result.reason);
}

export async function DELETE(request: Request, { params }: Ctx) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "visitor") return fail(403);
  const id = parseId((await params).id);
  if (!id) return fail(404);
  return (await removeRequest(profile, id)) ? noContent() : fail(404);
}
