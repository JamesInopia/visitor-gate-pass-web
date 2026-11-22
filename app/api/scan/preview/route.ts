import { NextResponse } from "next/server";
import * as z from "zod";
import { getProfile } from "@/lib/auth";
import { fail } from "@/lib/http";
import { previewPass } from "@/lib/scan";

const PreviewSchema = z.object({ code: z.string().trim().min(1).max(64) });

// Looks a gatepass up for the scanner without recording anything.
export async function POST(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "admin") return fail(403);

  const parsed = PreviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Send the gatepass code.");

  return NextResponse.json(await previewPass(parsed.data.code));
}
