import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const profile = await currentProfile();
  if (profile?.role == "admin") redirect("/admin/analytics");

  return (
    <main className="grid min-h-screen place-items-center bg-amber-100 p-6">
      <LoginForm />
    </main>
  );
}
