import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export type Profile = typeof users.$inferSelect;

export async function getProfile(request?: Request): Promise<Profile | null> {
  const token = request?.headers.get("Authorization")?.replace("Bearer ", "");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims(token).catch(() => ({ data: null }));
  if (!data) return null;
  const { sub: authId, email = "" } = data.claims;

  const [linked] = await db.select().from(users).where(eq(users.authId, authId));
  if (linked) return linked;

  if (email) {
    const [byEmail] = await db.select().from(users).where(eq(users.email, email));
    if (byEmail && !byEmail.authId) {
      const [updated] = await db.update(users).set({ authId }).where(eq(users.userId, byEmail.userId)).returning();
      return updated;
    }
  }

  await db
    .insert(users)
    .values({ authId, email: email || null, name: email.split("@")[0] || "New user", role: "visitor" })
    .onConflictDoNothing();
  const [created] = await db.select().from(users).where(eq(users.authId, authId));
  return created ?? null;
}

export const currentProfile = cache(() => getProfile());