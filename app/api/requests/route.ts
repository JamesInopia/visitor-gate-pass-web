import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { NewRequestSchema } from "@/lib/definitions";
import { fail } from "@/lib/http";
import { createRequest, readRequests } from "@/lib/requests";
import { isAllowedIdImage } from "@/lib/storage";

export async function GET(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  return NextResponse.json(await readRequests(profile));
}

export async function POST(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  if (profile.role !== "visitor") return fail(403);

  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, "Send the request as multipart form data.");

  const parsed = NewRequestSchema.safeParse({
    hostName: form.get("hostName"),
    unitNo: form.get("unitNo"),
    purpose: form.get("purpose"),
    contact: form.get("contact"),
  });
  if (!parsed.success) return fail(400, parsed.error.issues[0].message);

  const idImage = form.get("idImage");
  if (!(idImage instanceof File) || !isAllowedIdImage(idImage))
    return fail(400, "Attach a photo of your ID (JPEG, PNG, WebP or HEIC, up to 5 MB).");

  const result = await createRequest(profile, parsed.data, idImage);
  if (!result.ok) return fail(result.reason === "duplicate" ? 409 : 404);
  return NextResponse.json(result.request, { status: 201 });
}
