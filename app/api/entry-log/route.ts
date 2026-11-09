import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { fail } from "@/lib/http";
import { readEntryLog } from "@/lib/scan";

export async function GET(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "admin") return fail(403);
  return NextResponse.json(await readEntryLog());
}
