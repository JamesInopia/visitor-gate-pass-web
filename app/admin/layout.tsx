import { requireAdminPage } from "@/lib/auth";
import Header from "@/components/admin/Header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdminPage();

  return (
    <div className="flex h-screen flex-col">
      <Header name={profile.name} />
      <main className="min-h-0 flex-1 overflow-auto bg-gray-100 p-9">
        <div className="min-h-full rounded-bg-white p-6">{children}</div>
      </main>
    </div>
  );
}
