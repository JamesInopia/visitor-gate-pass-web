"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/archive", label: "Archive" },
  { href: "/admin/scanner", label: "Scanner" },
  { href: "/admin/extra", label: "Extra" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-70 shrink-0 flex-col bg-blue-300">
      <div className="h-70 bg-gray-300">{/* logo here hehe*/}</div>
      <nav className="mt-auto mb-auto flex flex-col gap-2">
        {links.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`py-4 text-center text-2xl ${active ? "bg-amber-100 p-2.5" : "bg-white"}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
