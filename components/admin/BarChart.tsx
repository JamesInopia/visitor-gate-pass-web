export type BarItem = {
  start: string;
  label: string;
  title: string;
  n: number;
  partial?: boolean;
  muted?: boolean;
};

export default function BarChart({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.n));

  return (
    <div className="relative min-h-72 flex-1">
      <div className="absolute inset-x-0 top-0 bottom-8 flex items-end gap-2 border-b pt-6">
        {items.map((it) => {
          const pct = (it.n / max) * 100;
          return (
            <div
              key={it.start}
              className="relative h-full flex-1"
              title={`${it.title}: ${it.n}`}
            >
              <div
                className={`absolute inset-x-0 bottom-0 rounded-t ${
                  it.partial
                    ? "border border-dashed border-blue-800 bg-blue-100"
                    : it.muted
                      ? "bg-blue-300"
                      : "bg-blue-800"
                }`}
                style={{ height: `${pct}%`, minHeight: it.n ? 4 : 0 }}
              />
              <span
                className="absolute inset-x-0 pb-1 text-center text-xs font-medium"
                style={{ bottom: `${pct}%` }}
              >
                {it.n}
              </span>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-6 gap-2">
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
