import { NextResponse } from "next/server";

export const fail = (status: number, error?: string) =>
  error ? NextResponse.json({ error }, { status }) : new NextResponse("", { status });

export const noContent = () => new NextResponse(null, { status: 204 });

export function parseId(value: string): number | null {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
