import { NextResponse } from "next/server";
import * as z from "zod";
import { getProfile } from "@/lib/auth";
import { fail } from "@/lib/http";
import { scanPass } from "@/lib/scan";

const ScanSchema = z.object({
  code: z.string().trim().min(1).max(64),
  // Set by the app once the admin has checked the ID and let the visitor in.
  confirmed: z.boolean().optional(),
});

export async function POST(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "admin") return fail(403);

  const parsed = ScanSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Send the gatepass code.");

  const result = await scanPass(profile, parsed.data.code, parsed.data.confirmed);
  if (!result.ok && result.reason === "needs_review") return fail(409, "needs_review");
  return NextResponse.json(result);
}
