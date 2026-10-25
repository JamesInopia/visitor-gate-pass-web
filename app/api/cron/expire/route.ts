import { NextResponse } from "next/server";
import { sweepExpired } from "@/lib/archive";
import { fail } from "@/lib/http";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("Authorization") !== `Bearer ${secret}`) return fail(401);
  return NextResponse.json({ purged: await sweepExpired() });
}
