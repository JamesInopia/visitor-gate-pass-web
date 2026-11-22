"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/archive", label: "Archive" },
  { href: "/admin/scanner", label: "Scanner" },
  { href: "/admin/requests", label: "Requests" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-2">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded border px-3 py-1.5 text-xl ${active ? "border-transparent bg-blue-800 font-bold text-white" : "border-gray-300 bg-white font-semibold text-black hover:bg-gray-100"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
