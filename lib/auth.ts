import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fail } from "./http";

export type Profile = typeof users.$inferSelect;

export async function getProfile(request?: Request): Promise<Profile | null> {
  const token = request?.headers.get("Authorization")?.replace("Bearer ", "");
  const supabase = await createClient();
  const { data } = await supabase.auth
    .getClaims(token)
    .catch(() => ({ data: null }));
  if (!data) return null;
  const { sub: authId, email = "" } = data.claims;

  const [linked] = await db
    .select()
    .from(users)
    .where(eq(users.authId, authId));
  if (linked) return linked;

  if (email) {
    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (byEmail && !byEmail.authId) {
      const [updated] = await db
        .update(users)
        .set({ authId })
        .where(eq(users.userId, byEmail.userId))
        .returning();
      return updated;
    }
  }

  await db
    .insert(users)
    .values({
      authId,
      email: email || null,
      name: email.split("@")[0] || "New user",
      role: "visitor",
    })
    .onConflictDoNothing();
  const [created] = await db
    .select()
    .from(users)
    .where(eq(users.authId, authId));
  return created ?? null;
}

export async function rquireAdmin(request: Request): Promise<Profile> {
  const profile = await getProfile(request);
  if (!profile) throw fail(401, "Unauthorized");
  if (profile.role !== "admin") throw fail(403, "Forbidden");
  return profile;
}

export async function requireAdminPage(): Promise<Profile> {
  const profile = await currentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");
  return profile;
}

export const currentProfile = cache(() => getProfile());
