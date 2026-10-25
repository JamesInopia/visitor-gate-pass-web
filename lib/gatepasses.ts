import "server-only";
import { randomInt } from "node:crypto";
import { gatePass } from "@/db/schema";

export type Pass = typeof gatePass.$inferSelect;

export const DEFAULT_PASS_MS = 24 * 60 * 60 * 1000;
export const MAX_PASS_MS = 30 * 24 * 60 * 60 * 1000;

// No 0/O/1/I so a code read out loud at the gate is not misheard.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newCode() {
  const pick = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${pick()}-${pick()}`;
}

export const expiresAtOf = (p: Pick<Pass, "issuedAt" | "expiryDate">) =>
  p.expiryDate ?? new Date(p.issuedAt.getTime() + DEFAULT_PASS_MS);
