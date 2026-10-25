import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { RespondSchema } from "@/lib/definitions";
import { fail, noContent, parseId } from "@/lib/http";
import { readRequest, removeRequest, respondToRequest } from "@/lib/requests";

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

  const result = await respondToRequest(profile, id, parsed.data.decision, parsed.data.expiresAt);
  if (result.ok) return NextResponse.json(result.request);
  if (result.reason === "not-found") return fail(404);
  return fail(result.reason === "bad-expiry" ? 400 : 409, result.reason);
}

export async function DELETE(request: Request, { params }: Ctx) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  const id = parseId((await params).id);
  if (!id) return fail(404);

  const result = await removeRequest(profile, id);
  if (result.ok) return noContent();
  return fail(result.reason === "not-found" ? 404 : 409, result.reason);
}
