import { NextResponse } from "next/server";
import * as z from "zod";
import { getProfile } from "@/lib/auth";
import { fail } from "@/lib/http";
import { scanPass } from "@/lib/scan";

const ScanSchema = z.object({ code: z.string().trim().min(1).max(64) });

export async function POST(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "admin") return fail(403);

  const parsed = ScanSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Send the gatepass code.");

  return NextResponse.json(await scanPass(profile, parsed.data.code));
}
