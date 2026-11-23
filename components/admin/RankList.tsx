export type RankItem = {
  key: string;
  label: string;
  sublabel?: string;
  n: number;
};

export default function RankList({ items }: { items: RankItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.n));

  return (
    <ol className="flex flex-col gap-3">
      {items.map((it, i) => (
        <li key={it.key} className="flex items-center gap-4">
          <span className="w-5 text-right text-sm font-semibold text-gray-500">
            {i + 1}
          </span>
          <div className="w-48 shrink-0">
            <div
              className={`truncate text-sm ${i === 0 ? "font-bold" : "font-medium"}`}
              title={it.label}
            >
              {it.label}
            </div>
            {it.sublabel && (
              <div className="truncate text-xs text-gray-500">
                {it.sublabel}
              </div>
            )}
          </div>
          <div className="h-5 flex-1 rounded bg-gray-100">
            <div
              className="h-full rounded bg-blue-800"
              style={{ width: `${(it.n / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-sm font-semibold">{it.n}</span>
        </li>
      ))}
    </ol>
  );
}
