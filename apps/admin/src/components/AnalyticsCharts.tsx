import Link from "next/link";
import { categoryColor } from "./category";
import type {
  DailySearch,
  TopPoi,
  TopQuery,
} from "@/lib/data/analytics";

export function DailySearchesChart({ data }: { data: DailySearch[] }) {
  const max = Math.max(1, ...data.map((d) => d.searches));
  const width = 600;
  const height = 120;
  const barW = width / Math.max(data.length, 1);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full"
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const h = (d.searches / max) * (height - 20);
          return (
            <g key={d.day}>
              <rect
                x={i * barW + 1}
                y={height - h - 14}
                width={Math.max(barW - 2, 1)}
                height={h}
                fill="#3b82f6"
                rx={1}
              />
              {d.searches > 0 && (
                <text
                  x={i * barW + barW / 2}
                  y={height - h - 16}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#64748b"
                >
                  {d.searches}
                </text>
              )}
            </g>
          );
        })}
        {/* baseline */}
        <line
          x1={0}
          x2={width}
          y1={height - 12}
          y2={height - 12}
          stroke="#cbd5e1"
          strokeWidth={0.5}
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{data[0]?.day ?? ""}</span>
        <span>{data[data.length - 1]?.day ?? ""}</span>
      </div>
    </div>
  );
}

export function TopQueriesTable({ data }: { data: TopQuery[] }) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-slate-500">
        No searches in this period yet.
      </p>
    );
  }
  const max = Math.max(...data.map((q) => q.count));
  return (
    <ul className="space-y-1.5">
      {data.map((q) => (
        <li key={q.query} className="flex items-center gap-3 text-sm">
          <span className="w-1/2 truncate text-slate-700 dark:text-slate-300">
            “{q.query}”
          </span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${(q.count / max) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
            {q.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TopPoisTable({ data }: { data: TopPoi[] }) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-slate-500">
        No POI hits yet.
      </p>
    );
  }
  const max = Math.max(...data.map((p) => p.hits));
  return (
    <ul className="space-y-1.5">
      {data.map((p) => {
        const color = categoryColor[p.category] ?? "#94a3b8";
        return (
          <li key={p.poiId} className="flex items-center gap-3 text-sm">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <Link
              href={`/pois?focus=${p.poiId}`}
              className="w-1/2 truncate text-slate-700 hover:text-blue-600 dark:text-slate-300"
            >
              {p.displayName}
            </Link>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full"
                style={{
                  width: `${(p.hits / max) * 100}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="w-10 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
              {p.hits}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
