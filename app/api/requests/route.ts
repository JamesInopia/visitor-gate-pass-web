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
    visitDate: form.get("visitDate"),
    purpose: form.get("purpose"),
    contact: form.get("contact"),
  });
  if (!parsed.success) return fail(400, parsed.error.issues[0].message);

  const idImage = form.get("idImage");
  if (!(idImage instanceof File) || !isAllowedIdImage(idImage))
    return fail(400, "Attach a photo of your ID (JPEG, PNG, WebP or HEIC, up to 5 MB).");

  const result = await createRequest(profile, parsed.data, idImage);
  if (result.ok) return NextResponse.json(result.request, { status: 201 });

  const status = { no_tenant: 404, visit_date_passed: 400, visit_date_invalid: 400, has_active_pass: 409, duplicate: 409 }[
    result.reason
  ];
  return fail(status, result.reason);
}
