"use client";

import { useMemo, useState } from "react";
import {
  findPath,
  type NavEdge,
  type NavNode,
  type Poi,
  type PoiCategory,
  type Floor,
} from "@smartstat/shared";

const CATEGORY_COLOR: Record<PoiCategory, string> = {
  department: "#3b82f6",
  clinic: "#06b6d4",
  room: "#64748b",
  counter: "#8b5cf6",
  elevator: "#eab308",
  stairs: "#ca8a04",
  restroom: "#10b981",
  pharmacy: "#ec4899",
  emergency: "#ef4444",
  cafeteria: "#f97316",
  parking_entry: "#6366f1",
  entrance: "#14b8a6",
  exit: "#0d9488",
  other: "#94a3b8",
};

interface Props {
  floor: Floor;
  pois: Poi[];
  navNodes: NavNode[];
  navEdges: NavEdge[];
}

export function FloorMap({ floor, pois, navNodes, navEdges }: Props) {
  const [fromPoiId, setFromPoiId] = useState<string | null>(null);
  const [toPoiId, setToPoiId] = useState<string | null>(null);
  const [wheelchair, setWheelchair] = useState(false);

  const bbox = floor.bbox ?? [0, 0, 60, 40];
  const [xMin, yMin, xMax, yMax] = bbox;
  const width = xMax - xMin;
  const height = yMax - yMin;
  // Pad the viewBox slightly so points on the edge are visible
  const pad = Math.max(width, height) * 0.05;

  const poiToNode = useMemo(() => {
    const m = new Map<string, NavNode>();
    for (const n of navNodes) {
      if (n.poiId) m.set(n.poiId, n);
    }
    return m;
  }, [navNodes]);

  const route = useMemo(() => {
    if (!fromPoiId || !toPoiId) return null;
    const startNode = poiToNode.get(fromPoiId);
    const goalNode = poiToNode.get(toPoiId);
    if (!startNode || !goalNode) return null;
    return findPath(startNode.id, goalNode.id, navNodes, navEdges, {
      wheelchairAccessible: wheelchair,
    });
  }, [fromPoiId, toPoiId, navNodes, navEdges, poiToNode, wheelchair]);

  const routeNodes = useMemo(() => {
    if (!route) return [];
    const byId = new Map(navNodes.map((n) => [n.id, n]));
    return route.nodeIds.map((id) => byId.get(id)!).filter(Boolean);
  }, [route, navNodes]);

  /** Transform world (y up) → SVG (y down) */
  const worldY = (y: number) => yMax + yMin - y;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            2D map
          </h3>
          <span className="text-xs text-slate-500">
            {width.toFixed(0)}m × {height.toFixed(0)}m
          </span>
        </div>

        <svg
          viewBox={`${xMin - pad} ${yMin - pad} ${width + 2 * pad} ${
            height + 2 * pad
          }`}
          className="aspect-[3/2] w-full rounded-lg bg-slate-50 dark:bg-slate-950"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Floor outline */}
          <rect
            x={xMin}
            y={yMin}
            width={width}
            height={height}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth={0.15}
            strokeDasharray="0.5 0.3"
          />

          {/* Navigation edges (light gray) */}
          {navEdges.map((e) => {
            const from = navNodes.find((n) => n.id === e.fromNodeId);
            const to = navNodes.find((n) => n.id === e.toNodeId);
            if (!from || !to) return null;
            return (
              <line
                key={e.id}
                x1={from.position.x}
                y1={worldY(from.position.y)}
                x2={to.position.x}
                y2={worldY(to.position.y)}
                stroke="#cbd5e1"
                strokeWidth={0.15}
                opacity={0.6}
              />
            );
          })}

          {/* Active route (blue) */}
          {routeNodes.length > 1 && (
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth={0.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={routeNodes
                .map((n) => `${n.position.x},${worldY(n.position.y)}`)
                .join(" ")}
            />
          )}

          {/* Nav node markers (small dots) */}
          {navNodes
            .filter((n) => n.type === "waypoint")
            .map((n) => (
              <circle
                key={n.id}
                cx={n.position.x}
                cy={worldY(n.position.y)}
                r={0.2}
                fill="#94a3b8"
              />
            ))}

          {/* QR anchors */}
          {navNodes
            .filter((n) => n.qrCode)
            .map((n) => (
              <g key={n.id}>
                <rect
                  x={n.position.x - 0.4}
                  y={worldY(n.position.y) - 0.4}
                  width={0.8}
                  height={0.8}
                  fill="#0f172a"
                />
                <text
                  x={n.position.x}
                  y={worldY(n.position.y) + 1.3}
                  textAnchor="middle"
                  fontSize={0.6}
                  fill="#64748b"
                  fontFamily="ui-monospace, monospace"
                >
                  QR
                </text>
              </g>
            ))}

          {/* POIs */}
          {pois.map((p) => {
            const color = CATEGORY_COLOR[p.category] ?? CATEGORY_COLOR.other;
            const isStart = fromPoiId === p.id;
            const isEnd = toPoiId === p.id;
            return (
              <g key={p.id}>
                <circle
                  cx={p.position.x}
                  cy={worldY(p.position.y)}
                  r={isStart || isEnd ? 1.0 : 0.7}
                  fill={color}
                  stroke={isStart || isEnd ? "#0f172a" : "white"}
                  strokeWidth={isStart || isEnd ? 0.25 : 0.15}
                />
                <text
                  x={p.position.x}
                  y={worldY(p.position.y) - 1.2}
                  textAnchor="middle"
                  fontSize={1.1}
                  fill="#0f172a"
                  fontWeight={600}
                  className="dark:fill-white"
                >
                  {p.displayName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Side panel: route controls */}
      <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Navigation simulator
        </h3>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            From
          </label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            value={fromPoiId ?? ""}
            onChange={(e) => setFromPoiId(e.target.value || null)}
          >
            <option value="">— Select start —</option>
            {pois.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            To
          </label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            value={toPoiId ?? ""}
            onChange={(e) => setToPoiId(e.target.value || null)}
          >
            <option value="">— Select destination —</option>
            {pois.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={wheelchair}
            onChange={(e) => setWheelchair(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          ♿ Wheelchair-accessible route only
        </label>

        {route ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                Route found
              </span>
              <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
                {route.totalDistanceMeters.toFixed(0)} m ·{" "}
                {Math.round(route.estimatedDurationSeconds)} s
              </span>
            </div>
            <ol className="mt-3 space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {route.steps.map((s) => (
                <li
                  key={s.index}
                  className="flex items-start gap-2 leading-snug"
                >
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[10px] font-bold text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                    {s.index + 1}
                  </span>
                  <span>{s.instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : fromPoiId && toPoiId ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            No path found with current constraints.
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Pick a start and a destination to see the A* route plotted live on the map.
          </p>
        )}
      </aside>
    </div>
  );
}
