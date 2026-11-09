import { getProfile } from "@/lib/auth";
import { fail, noContent, parseId } from "@/lib/http";
import { dismissNotice } from "@/lib/notices";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile(request);
  if (!profile) return fail(401);
  const id = parseId((await params).id);
  return id && (await dismissNotice(profile.userId, id)) ? noContent() : fail(404);
}
