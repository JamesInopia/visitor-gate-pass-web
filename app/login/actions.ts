"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password." };

  const profile = await getProfile();
  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "The account must have admin access." };
  }

  redirect("/admin/analytics");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
