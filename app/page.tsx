import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/auth";
import { logOut } from "./login/actions";

export default async function Home() {
  const profile = await currentProfile();

  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin/analytics");

  return (
    <main className="grid min-h-screen place-items-center bg-amber-100 p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-semibold">No access</h1>
        <p className="text-sm text-gray-600">
          Your account ({profile.email}) doesn't have admin permissions.
        </p>
        <form action={logOut}>
          <button className="rounded bg-blue-500 px-4 py-2 text-white">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
