export type LinePoint = {
  start: string;
  label: string;
  title: string;
  value: number | null;
  text: string;
  partial?: boolean;
};

export default function LineChart({ items }: { items: LinePoint[] }) {
  const max = Math.max(1, ...items.map((i) => i.value ?? 0)) * 1.5;
  const count = items.length;
  const pct = (v: number) => (v / max) * 100;

  const segments: string[] = [];
  let current: string[] = [];
  items.forEach((it, i) => {
    if (it.value === null) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
    } else {
      current.push(`${((i + 0.5) / count) * 100}, ${100 - pct(it.value)}`);
    }
  });
  if (current.length > 1) segments.push(current.join(" "));

  return (
    <div className="relative min-h-72 flex-1">
      <div className="absolute inset-x-0 top-0 bottom-8 border-b pt-6">
        <div className="relative h-full">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            {segments.map((points) => (
              <polyline
                key={points}
                points={points}
                fill="none"
                stroke="#1e40af"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className="absolute inset-0 flex">
            {items.map((it) => (
              <div
                key={it.start}
                className="relative h-full flex-1"
                title={it.title}
              >
                {it.value !== null && (
                  <>
                    <span
                      className={`absolute left-1/2 size-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-blue-800 ${
                        it.partial ? "bg-white" : "bg-blue-800"
                      }`}
                      style={{ bottom: `${pct(it.value)}%` }}
                    />
                    <span
                      className="absolute inset-x-0 mb-2 text-center text-xs font-medium"
                      style={{ bottom: `${pct(it.value)}%` }}
                    >
                      {it.text}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-6">
        {items.map((it) => (
          <span
            key={it.start}
            className={`flex-1 text-center text-xs 
                ${it.partial ? "font-bold text-black" : "text-gray-600"}`}
          >
            {it.label}
            {it.partial ? " - Current" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
