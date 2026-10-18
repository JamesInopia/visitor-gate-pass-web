import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";

export async function GET(request: Request) {
  const profile = await getProfile(request);
  if (!profile) return new NextResponse("", { status: 401 });
  return NextResponse.json(profile);
}
