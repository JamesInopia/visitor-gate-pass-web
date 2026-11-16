"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { approveApplication, rejectApplication, type DecisionResult } from "@/lib/tenant-applications";

const WHY: Record<string, string> = {
  "not-found": "That request no longer exists.",
  "already-answered": "That request was already handled.",
  "not-a-visitor": "That person is no longer a visitor.",
  "has-active-pass": "That visitor still has an active gatepass. Try again once it ends.",
};

function done(result: DecisionResult, success: string): never {
  revalidatePath("/admin/requests");
  const msg = result.ok ? success : (WHY[result.reason] ?? "Something went wrong.");
  redirect(`/admin/requests?${result.ok ? "ok" : "err"}=${encodeURIComponent(msg)}`);
}

const idOf = (form: FormData) => {
  const id = Number(form.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function approve(form: FormData) {
  const admin = await requireAdminPage();
  const id = idOf(form);
  if (!id) redirect("/admin/requests?err=" + encodeURIComponent("Invalid request."));
  done(await approveApplication(admin, id), "Approved. They are now a tenant.");
}

export async function reject(form: FormData) {
  const admin = await requireAdminPage();
  const id = idOf(form);
  if (!id) redirect("/admin/requests?err=" + encodeURIComponent("Invalid request."));
  const note = String(form.get("note") ?? "").trim().slice(0, 300);
  done(await rejectApplication(admin, id, note || undefined), "Rejected.");
}
