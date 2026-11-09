import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { fail } from "@/lib/http";
import { readNotices } from "@/lib/notices";

export async function GET(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  return NextResponse.json(await readNotices(profile.userId));
}
