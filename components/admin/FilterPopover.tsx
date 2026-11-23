"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function FilterPopover({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = Boolean(from || to);

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
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm hover:bg-gray-50 ${
          active
            ? "border-blue-800 text-blue-800"
            : "border-gray-300 text-gray-500"
        }`}
      >
        Archived Date
        <svg
          viewBox="0 0 16 16"
          aria-hidden
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 3h12L9.5 8.5V13l-3-1.5V8.5L2 3z" />
        </svg>
        {active && <span className="size-1.5 rounded-full bg-blue-800   " />}
      </button>

      <div
        className={`absolute right-0 z-10 mt-2 w-60 rounded-lg border bg-white p-3 text-sm shadow-sm ${open ? "" : "hidden"}`}
      >
        <label className="mb-2 flex flex-col gap-1">
          <span className="font-semibold">Archived From:</span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            key={from}
            autoComplete="off"
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="mb-2 flex flex-col gap-1">
          <span className="font-semibold">Archived To:</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            key={to}
            autoComplete="off"
            className="rounded border px-2 py-1"
          />
        </label>
        <div className="flex items-center justify-between">
          <button className="rounded bg-blue-800 px-4 py-1 mt-2 text-white hover:cursor-pointer hover:brightness-110">
            Apply
          </button>
          {active ? (
            <Link
              href="/admin/archive"
              className="rounded px-4 py-1 bg-red-500 text-white hover:bg-red-600"
            >
              Clear
            </Link>
          ) : (
            <span
              haria-disabled="true"
              className="cursor-not-allowed rounded bg-gray-300 px-4 py-1 text-gray-500 select-none"
            >
              Clear
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
