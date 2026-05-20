"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import {
  findPath,
  type NavEdge,
  type NavNode,
  type Poi,
  type PoiCategory,
  type Floor,
} from "@smartstat/shared";
import {
  createPoiAction,
  deletePoiAction,
  movePoiAction,
  updatePoiAction,
} from "@/lib/actions/pois";

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

const CATEGORIES: PoiCategory[] = [
  "department",
  "clinic",
  "room",
  "counter",
  "elevator",
  "stairs",
  "restroom",
  "pharmacy",
  "emergency",
  "cafeteria",
  "parking_entry",
  "entrance",
  "exit",
  "other",
];

type Mode = "view" | "add" | "edit";

interface Props {
  floor: Floor;
  pois: Poi[];
  navNodes: NavNode[];
  navEdges: NavEdge[];
}

export function FloorEditor({ floor, pois, navNodes, navEdges }: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [draftPoi, setDraftPoi] = useState<{ x: number; y: number } | null>(
    null
  );
  const [fromPoiId, setFromPoiId] = useState<string | null>(null);
  const [toPoiId, setToPoiId] = useState<string | null>(null);
  const [wheelchair, setWheelchair] = useState(false);
  const [, startTransition] = useTransition();
  const draggingRef = useRef<{ poiId: string } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const bbox = floor.bbox ?? [0, 0, 60, 40];
  const [xMin, yMin, xMax, yMax] = bbox;
  const width = xMax - xMin;
  const height = yMax - yMin;
  const pad = Math.max(width, height) * 0.05;
  const worldY = (y: number) => yMax + yMin - y;

  const poiToNode = useMemo(() => {
    const m = new Map<string, NavNode>();
    for (const n of navNodes) if (n.poiId) m.set(n.poiId, n);
    return m;
  }, [navNodes]);

  const route = useMemo(() => {
    if (mode !== "view") return null;
    if (!fromPoiId || !toPoiId) return null;
    const a = poiToNode.get(fromPoiId);
    const b = poiToNode.get(toPoiId);
    if (!a || !b) return null;
    return findPath(a.id, b.id, navNodes, navEdges, {
      wheelchairAccessible: wheelchair,
    });
  }, [mode, fromPoiId, toPoiId, poiToNode, navNodes, navEdges, wheelchair]);

  const routeNodes = useMemo(() => {
    if (!route) return [];
    const byId = new Map(navNodes.map((n) => [n.id, n]));
    return route.nodeIds.map((id) => byId.get(id)!).filter(Boolean);
  }, [route, navNodes]);

  const selectedPoi = useMemo(
    () => pois.find((p) => p.id === selectedPoiId) ?? null,
    [pois, selectedPoiId]
  );

  /** Convert pointer event to floor-world coords */
  const pointerToWorld = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const local = pt.matrixTransform(ctm.inverse());
      return { x: local.x, y: yMax + yMin - local.y };
    },
    [yMax, yMin]
  );

  const onSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (mode !== "add") return;
      const w = pointerToWorld(e.clientX, e.clientY);
      if (!w) return;
      setDraftPoi(w);
    },
    [mode, pointerToWorld]
  );

  const onPoiPointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>, poiId: string) => {
      if (mode !== "edit") return;
      (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
      draggingRef.current = { poiId };
      setSelectedPoiId(poiId);
    },
    [mode]
  );

  const onPoiPointerMove = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const w = pointerToWorld(e.clientX, e.clientY);
      if (!w) return;
      // Optimistic local update via DOM transform
      const g = e.currentTarget;
      g.setAttribute(
        "transform",
        `translate(${w.x - getPoiX(pois, drag.poiId)}, ${
          worldY(w.y) - worldY(getPoiY(pois, drag.poiId))
        })`
      );
    },
    [pointerToWorld, pois, worldY]
  );

  const onPoiPointerUp = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      const drag = draggingRef.current;
      if (!drag) return;
      draggingRef.current = null;
      (e.currentTarget as SVGGElement).releasePointerCapture(e.pointerId);
      const w = pointerToWorld(e.clientX, e.clientY);
      // Reset transform; real position will arrive after revalidation
      (e.currentTarget as SVGGElement).removeAttribute("transform");
      if (!w) return;

      const fd = new FormData();
      fd.set("poiId", drag.poiId);
      fd.set("x", w.x.toFixed(2));
      fd.set("y", w.y.toFixed(2));
      startTransition(async () => {
        await movePoiAction(fd);
      });
    },
    [pointerToWorld]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <ModeBtn current={mode} value="view" onClick={setMode}>
              👁 View
            </ModeBtn>
            <ModeBtn current={mode} value="add" onClick={setMode}>
              ＋ Add POI
            </ModeBtn>
            <ModeBtn current={mode} value="edit" onClick={setMode}>
              ✎ Edit
            </ModeBtn>
          </div>
          <span className="text-xs text-slate-500">
            {width.toFixed(0)}m × {height.toFixed(0)}m
          </span>
        </div>

        <svg
          ref={svgRef}
          viewBox={`${xMin - pad} ${yMin - pad} ${width + 2 * pad} ${
            height + 2 * pad
          }`}
          className={`aspect-[3/2] w-full rounded-lg ${
            mode === "add" ? "cursor-crosshair" : "cursor-default"
          } bg-slate-50 dark:bg-slate-950`}
          preserveAspectRatio="xMidYMid meet"
          onClick={onSvgClick}
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

          {/* Navigation edges */}
          {mode === "view" &&
            navEdges.map((e) => {
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

          {/* Active route */}
          {mode === "view" && routeNodes.length > 1 && (
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

          {/* POIs */}
          {pois.map((p) => {
            const color = CATEGORY_COLOR[p.category] ?? CATEGORY_COLOR.other;
            const isSelected = selectedPoiId === p.id;
            const isStart = fromPoiId === p.id;
            const isEnd = toPoiId === p.id;
            const highlighted = isSelected || isStart || isEnd;
            return (
              <g
                key={p.id}
                style={{ cursor: mode === "edit" ? "grab" : "pointer" }}
                onPointerDown={(e) => onPoiPointerDown(e, p.id)}
                onPointerMove={onPoiPointerMove}
                onPointerUp={onPoiPointerUp}
                onClick={(e) => {
                  e.stopPropagation();
                  if (mode === "view") {
                    if (!fromPoiId) setFromPoiId(p.id);
                    else if (!toPoiId && p.id !== fromPoiId) setToPoiId(p.id);
                    else {
                      setFromPoiId(p.id);
                      setToPoiId(null);
                    }
                  } else if (mode === "edit") {
                    setSelectedPoiId(p.id);
                  }
                }}
              >
                <circle
                  cx={p.position.x}
                  cy={worldY(p.position.y)}
                  r={highlighted ? 1.0 : 0.7}
                  fill={color}
                  stroke={highlighted ? "#0f172a" : "white"}
                  strokeWidth={highlighted ? 0.25 : 0.15}
                />
                <text
                  x={p.position.x}
                  y={worldY(p.position.y) - 1.2}
                  textAnchor="middle"
                  fontSize={1.1}
                  fill="#0f172a"
                  fontWeight={600}
                  className="dark:fill-white pointer-events-none select-none"
                >
                  {p.displayName}
                </text>
              </g>
            );
          })}

          {/* Draft POI marker */}
          {mode === "add" && draftPoi && (
            <g>
              <circle
                cx={draftPoi.x}
                cy={worldY(draftPoi.y)}
                r={1.0}
                fill="#facc15"
                stroke="#0f172a"
                strokeWidth={0.25}
              />
              <text
                x={draftPoi.x}
                y={worldY(draftPoi.y) - 1.3}
                textAnchor="middle"
                fontSize={1}
                fill="#0f172a"
                fontWeight={700}
                className="dark:fill-white pointer-events-none"
              >
                new POI
              </text>
            </g>
          )}
        </svg>

        {/* Mode help */}
        {mode === "add" && (
          <p className="mt-2 text-xs text-slate-500">
            Click on the floor to place a new POI. Then fill the form on the
            right.
          </p>
        )}
        {mode === "edit" && (
          <p className="mt-2 text-xs text-slate-500">
            Drag a POI to move it. Click to select and edit on the right.
          </p>
        )}
        {mode === "view" && (
          <p className="mt-2 text-xs text-slate-500">
            Click two POIs to plot the shortest A* route between them.
          </p>
        )}
      </div>

      {/* Right panel */}
      <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {mode === "view" && (
          <ViewPanel
            pois={pois}
            fromPoiId={fromPoiId}
            toPoiId={toPoiId}
            setFromPoiId={setFromPoiId}
            setToPoiId={setToPoiId}
            wheelchair={wheelchair}
            setWheelchair={setWheelchair}
            route={route}
          />
        )}

        {mode === "add" &&
          (draftPoi ? (
            <AddPoiForm
              floorId={floor.id}
              x={draftPoi.x}
              y={draftPoi.y}
              onDone={() => setDraftPoi(null)}
              onCancel={() => setDraftPoi(null)}
            />
          ) : (
            <div className="text-xs text-slate-500">
              Click anywhere on the floor to start placing a POI.
            </div>
          ))}

        {mode === "edit" &&
          (selectedPoi ? (
            <EditPoiForm
              poi={selectedPoi}
              onDeleted={() => setSelectedPoiId(null)}
            />
          ) : (
            <div className="text-xs text-slate-500">
              Click a POI on the map to edit it.
            </div>
          ))}
      </aside>
    </div>
  );
}

function ModeBtn({
  current,
  value,
  children,
  onClick,
}: {
  current: Mode;
  value: Mode;
  children: React.ReactNode;
  onClick: (m: Mode) => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={
        active
          ? "rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
          : "rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      }
    >
      {children}
    </button>
  );
}

function getPoiX(pois: Poi[], id: string): number {
  return pois.find((p) => p.id === id)?.position.x ?? 0;
}
function getPoiY(pois: Poi[], id: string): number {
  return pois.find((p) => p.id === id)?.position.y ?? 0;
}

/* -------------------- Sub-panels -------------------- */

function ViewPanel({
  pois,
  fromPoiId,
  toPoiId,
  setFromPoiId,
  setToPoiId,
  wheelchair,
  setWheelchair,
  route,
}: {
  pois: Poi[];
  fromPoiId: string | null;
  toPoiId: string | null;
  setFromPoiId: (id: string | null) => void;
  setToPoiId: (id: string | null) => void;
  wheelchair: boolean;
  setWheelchair: (v: boolean) => void;
  route: ReturnType<typeof findPath>;
}) {
  return (
    <>
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
              <li key={s.index} className="flex items-start gap-2 leading-snug">
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
          Pick a start and a destination to plot the A* route.
        </p>
      )}
    </>
  );
}

function AddPoiForm({
  floorId,
  x,
  y,
  onDone,
  onCancel,
}: {
  floorId: string;
  x: number;
  y: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function action(fd: FormData) {
    setSaving(true);
    setError(null);
    fd.set("floorId", floorId);
    fd.set("x", x.toFixed(2));
    fd.set("y", y.toFixed(2));
    const result = await createPoiAction(fd);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Unknown error");
      return;
    }
    onDone();
  }

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        New POI at ({x.toFixed(1)}, {y.toFixed(1)})
      </h3>

      <Field label="Display name" required>
        <input
          name="displayName"
          required
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          placeholder="Cardiology"
        />
      </Field>

      <Field label="Category">
        <select
          name="category"
          defaultValue="department"
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Search keywords (comma-separated)">
        <input
          name="keywords"
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          placeholder="heart, cardiac, ECG"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          name="wheelchair"
          value="true"
          defaultChecked
          className="h-4 w-4 rounded border-slate-300"
        />
        ♿ Wheelchair accessible
      </label>

      <Field label="Description (optional)">
        <textarea
          name="description"
          rows={2}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </Field>

      {error && (
        <div className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create POI"}
        </button>
      </div>
    </form>
  );
}

function EditPoiForm({ poi, onDeleted }: { poi: Poi; onDeleted: () => void }) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(fd: FormData) {
    setSaving(true);
    setError(null);
    fd.set("poiId", poi.id);
    const result = await updatePoiAction(fd);
    setSaving(false);
    if (!result.ok) setError(result.error ?? "Unknown error");
  }

  async function remove() {
    if (!confirm(`Delete "${poi.displayName}"?`)) return;
    const fd = new FormData();
    fd.set("poiId", poi.id);
    await deletePoiAction(fd);
    onDeleted();
  }

  return (
    <form
      key={poi.id}
      action={(fd) => startTransition(() => save(fd))}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Edit POI
        </h3>
        <button
          type="button"
          onClick={remove}
          className="text-xs text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>

      <div className="font-mono text-xs text-slate-500">
        ({poi.position.x.toFixed(1)}, {poi.position.y.toFixed(1)})
      </div>

      <Field label="Display name" required>
        <input
          name="displayName"
          required
          defaultValue={poi.displayName}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </Field>

      <Field label="Category">
        <select
          name="category"
          defaultValue={poi.category}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Search keywords">
        <input
          name="keywords"
          defaultValue={poi.searchKeywords.join(", ")}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          name="wheelchair"
          value="true"
          defaultChecked={poi.accessibility.wheelchairAccessible}
          className="h-4 w-4 rounded border-slate-300"
        />
        ♿ Wheelchair accessible
      </label>

      <Field label="Description">
        <textarea
          name="description"
          rows={2}
          defaultValue={poi.description ?? ""}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </Field>

      {error && (
        <div className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
