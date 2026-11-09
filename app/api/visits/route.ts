import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { fail } from "@/lib/http";
import { readVisits } from "@/lib/scan";

export async function GET(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "visitor") return fail(403);
  return NextResponse.json(await readVisits(profile.userId));
}
