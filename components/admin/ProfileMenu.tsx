"use client";
import { useEffect, useRef, useState } from "react";
import { logOut } from "@/app/login/actions";

export default function ProfileMenu({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-full py-1 pr-2 pl-3 hover:bg-gray-100 hover:cursor-pointer"
      >
        <span className="font-semibold text-xl">{name}</span>
        <span className="size-11 overflow-hidden rounded-full bg-gray-300">
          {avatarUrl && (
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-sm"
        >
          <form action={logOut}>
            <button
              role="menuitem"
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Log Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
