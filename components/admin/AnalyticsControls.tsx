"use client";
import { useRouter } from "next/navigation";
import {
  FREQS,
  VIEWS,
  analyticsHref,
  type Frequency,
  type View,
} from "@/lib/analytics-view";

const select =
  "appearance-none rounded-full border border-gray-300 bg-white py-1.5 pr-9 pl-4 text-sm text-gray-700 hover:bg-gray-50";

function Funnel() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-gray-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 3h12L9.5 8.5V13l-3-1.5V8.5L2 3z" />
    </svg>
  );
}

export default function AnalyticsControls({
  view,
  frequency,
}: {
  view: View;
  frequency: Frequency;
}) {
  const router = useRouter();
  const go = (v: View, f: Frequency) =>
    router.push(analyticsHref(v, f), { scroll: false });

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Filter by:</span>

      <label className="relative">
        <span className="sr-only">Category</span>
        <select
          key={view}
          defaultValue={view}
          onChange={(e) => go(e.target.value as View, frequency)}
          className={select}
        >
          {(Object.keys(VIEWS) as View[]).map((v) => (
            <option key={v} value={v}>
              {VIEWS[v]}
            </option>
          ))}
        </select>
        <Funnel />
      </label>

      <label className="relative">
        <span className="sr-only">Frequency</span>
        <select
          key={frequency}
          defaultValue={frequency}
          onChange={(e) => go(e.target.value as View, frequency)}
          className={select}
        >
          {(Object.keys(FREQS) as Frequency[]).map((f) => (
            <option key={f} value={f}>
              {FREQS[f].label}
            </option>
          ))}
        </select>
        <Funnel />
      </label>
    </div>
  );
}
