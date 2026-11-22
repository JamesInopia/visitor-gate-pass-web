import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { fail } from "@/lib/http";
import { readPassIdImage } from "@/lib/scan";

// The visitor's submitted ID photo, shown to the admin on a first entry.
export async function GET(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "admin") return fail(403);

  const code = new URL(request.url).searchParams.get("code")?.trim();
  if (!code) return fail(400, "Send the gatepass code.");

  const image = await readPassIdImage(code);
  if (!image) return fail(404);
  return new NextResponse(image.body, {
    headers: { "Content-Type": image.type, "Cache-Control": "private, no-store" },
  });
}
