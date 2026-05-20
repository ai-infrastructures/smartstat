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
import {
  createEdgeAction,
  createQrAnchorAction,
  createWaypointAction,
  deleteEdgeAction,
  deleteNavNodeAction,
  moveNavNodeAction,
  regenerateFloorGraphAction,
} from "@/lib/actions/nav";

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

type Mode = "view" | "add" | "edit" | "edges";
type AddSubMode = "poi" | "waypoint" | "qr";

interface Props {
  floor: Floor;
  pois: Poi[];
  navNodes: NavNode[];
  navEdges: NavEdge[];
  floorPlanUrl?: string | null;
}

export function FloorEditor({
  floor,
  pois,
  navNodes,
  navEdges,
  floorPlanUrl,
}: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [addSubMode, setAddSubMode] = useState<AddSubMode>("poi");
  const [showNavGraph, setShowNavGraph] = useState(true);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draftPoint, setDraftPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [fromPoiId, setFromPoiId] = useState<string | null>(null);
  const [toPoiId, setToPoiId] = useState<string | null>(null);
  const [wheelchair, setWheelchair] = useState(false);
  const [edgeFromNodeId, setEdgeFromNodeId] = useState<string | null>(null);
  const [edgeWheelchair, setEdgeWheelchair] = useState(true);
  const [edgeDeleteMode, setEdgeDeleteMode] = useState(false);
  const [, startTransition] = useTransition();
  const draggingRef = useRef<{ id: string; kind: "poi" | "node" } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const bbox = floor.bbox ?? [0, 0, 60, 40];
  const [xMin, yMin, xMax, yMax] = bbox;
  const width = xMax - xMin;
  const height = yMax - yMin;
  const pad = Math.max(width, height) * 0.05;
  const worldY = useCallback(
    (y: number) => yMax + yMin - y,
    [yMax, yMin]
  );

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
  const selectedNode = useMemo(
    () => navNodes.find((n) => n.id === selectedNodeId) ?? null,
    [navNodes, selectedNodeId]
  );

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

      if (addSubMode === "poi") {
        setDraftPoint(w);
      } else if (addSubMode === "waypoint") {
        const fd = new FormData();
        fd.set("floorId", floor.id);
        fd.set("x", w.x.toFixed(2));
        fd.set("y", w.y.toFixed(2));
        startTransition(async () => {
          await createWaypointAction(fd);
        });
      } else {
        const fd = new FormData();
        fd.set("floorId", floor.id);
        fd.set("x", w.x.toFixed(2));
        fd.set("y", w.y.toFixed(2));
        startTransition(async () => {
          await createQrAnchorAction(fd);
        });
      }
    },
    [mode, addSubMode, floor.id, pointerToWorld]
  );

  const onPoiPointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>, poiId: string) => {
      if (mode !== "edit") return;
      (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
      draggingRef.current = { id: poiId, kind: "poi" };
      setSelectedPoiId(poiId);
      setSelectedNodeId(null);
    },
    [mode]
  );

  const onNodePointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>, nodeId: string) => {
      if (mode !== "edit") return;
      (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
      draggingRef.current = { id: nodeId, kind: "node" };
      setSelectedNodeId(nodeId);
      setSelectedPoiId(null);
    },
    [mode]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const w = pointerToWorld(e.clientX, e.clientY);
      if (!w) return;
      const g = e.currentTarget;
      const baseX =
        drag.kind === "poi"
          ? getPoiX(pois, drag.id)
          : getNodeX(navNodes, drag.id);
      const baseY =
        drag.kind === "poi"
          ? getPoiY(pois, drag.id)
          : getNodeY(navNodes, drag.id);
      g.setAttribute(
        "transform",
        `translate(${w.x - baseX}, ${worldY(w.y) - worldY(baseY)})`
      );
    },
    [pointerToWorld, pois, navNodes, worldY]
  );

  // Edge mode: click a node to start, click another to connect or remove.
  const handleNodeClickForEdges = useCallback(
    (nodeId: string) => {
      if (mode !== "edges") return false;
      if (!edgeFromNodeId) {
        setEdgeFromNodeId(nodeId);
        return true;
      }
      if (edgeFromNodeId === nodeId) {
        setEdgeFromNodeId(null);
        return true;
      }
      const fd = new FormData();
      fd.set("fromNodeId", edgeFromNodeId);
      fd.set("toNodeId", nodeId);
      fd.set("floorId", floor.id);
      fd.set("wheelchair", edgeWheelchair ? "true" : "false");
      const fn = edgeDeleteMode ? deleteEdgeAction : createEdgeAction;
      startTransition(async () => {
        await fn(fd);
      });
      setEdgeFromNodeId(null);
      return true;
    },
    [mode, edgeFromNodeId, edgeWheelchair, edgeDeleteMode, floor.id]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      const drag = draggingRef.current;
      if (!drag) return;
      draggingRef.current = null;
      (e.currentTarget as SVGGElement).releasePointerCapture(e.pointerId);
      const w = pointerToWorld(e.clientX, e.clientY);
      (e.currentTarget as SVGGElement).removeAttribute("transform");
      if (!w) return;

      const fd = new FormData();
      if (drag.kind === "poi") {
        fd.set("poiId", drag.id);
        fd.set("x", w.x.toFixed(2));
        fd.set("y", w.y.toFixed(2));
        startTransition(async () => {
          await movePoiAction(fd);
        });
      } else {
        fd.set("nodeId", drag.id);
        fd.set("floorId", floor.id);
        fd.set("x", w.x.toFixed(2));
        fd.set("y", w.y.toFixed(2));
        startTransition(async () => {
          await moveNavNodeAction(fd);
        });
      }
    },
    [pointerToWorld, floor.id]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <ModeBtn current={mode} value="view" onClick={setMode}>
              👁 View
            </ModeBtn>
            <ModeBtn current={mode} value="add" onClick={setMode}>
              ＋ Add
            </ModeBtn>
            <ModeBtn current={mode} value="edit" onClick={setMode}>
              ✎ Edit
            </ModeBtn>
            <ModeBtn current={mode} value="edges" onClick={setMode}>
              ╱ Edges
            </ModeBtn>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={showNavGraph}
                onChange={(e) => setShowNavGraph(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              Graph
            </label>
            <span className="text-xs text-slate-500">
              {width.toFixed(0)}m × {height.toFixed(0)}m
            </span>
          </div>
        </div>

        {/* Add sub-mode toolbar */}
        {mode === "add" && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
            <span className="px-1 text-xs font-medium text-amber-800 dark:text-amber-200">
              Add a:
            </span>
            <SubModeBtn
              active={addSubMode === "poi"}
              onClick={() => setAddSubMode("poi")}
            >
              ● POI
            </SubModeBtn>
            <SubModeBtn
              active={addSubMode === "waypoint"}
              onClick={() => setAddSubMode("waypoint")}
            >
              ◆ Waypoint
            </SubModeBtn>
            <SubModeBtn
              active={addSubMode === "qr"}
              onClick={() => setAddSubMode("qr")}
            >
              ⬛ QR anchor
            </SubModeBtn>
            <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">
              {addSubMode === "poi"
                ? "Click to place a draft POI"
                : addSubMode === "waypoint"
                ? "Click to drop a corridor waypoint (auto-connects)"
                : "Click to drop a QR calibration anchor (auto-connects)"}
            </span>
          </div>
        )}

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
          {/* Floor plan image as background (if uploaded) */}
          {floorPlanUrl && (
            <image
              href={floorPlanUrl}
              x={xMin}
              y={yMin}
              width={width}
              height={height}
              preserveAspectRatio="xMidYMid slice"
              opacity={0.6}
            />
          )}

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

          {/* Edges — manual edges drawn thicker and in violet */}
          {showNavGraph &&
            navEdges.map((e) => {
              const from = navNodes.find((n) => n.id === e.fromNodeId);
              const to = navNodes.find((n) => n.id === e.toNodeId);
              if (!from || !to) return null;
              const manual = e.source === "manual";
              return (
                <line
                  key={e.id}
                  x1={from.position.x}
                  y1={worldY(from.position.y)}
                  x2={to.position.x}
                  y2={worldY(to.position.y)}
                  stroke={manual ? "#7c3aed" : "#cbd5e1"}
                  strokeWidth={manual ? 0.3 : 0.15}
                  opacity={manual ? 0.95 : 0.7}
                  strokeDasharray={
                    manual && !e.wheelchairAccessible ? "0.5 0.3" : undefined
                  }
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

          {/* Waypoints (small) */}
          {showNavGraph &&
            navNodes
              .filter((n) => n.type === "waypoint")
              .map((n) => (
                <g
                  key={n.id}
                  style={{ cursor: mode === "edit" ? "grab" : "default" }}
                  onPointerDown={(e) => onNodePointerDown(e, n.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (handleNodeClickForEdges(n.id)) return;
                    if (mode === "edit") {
                      setSelectedNodeId(n.id);
                      setSelectedPoiId(null);
                    }
                  }}
                >
                  <circle
                    cx={n.position.x}
                    cy={worldY(n.position.y)}
                    r={
                      edgeFromNodeId === n.id || selectedNodeId === n.id
                        ? 0.6
                        : 0.25
                    }
                    fill={
                      edgeFromNodeId === n.id
                        ? "#f59e0b"
                        : selectedNodeId === n.id
                        ? "#0f172a"
                        : "#94a3b8"
                    }
                  />
                </g>
              ))}

          {/* QR anchors */}
          {showNavGraph &&
            navNodes
              .filter((n) => n.qrCode)
              .map((n) => (
                <g
                  key={n.id}
                  style={{ cursor: mode === "edit" ? "grab" : "default" }}
                  onPointerDown={(e) => onNodePointerDown(e, n.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (handleNodeClickForEdges(n.id)) return;
                    if (mode === "edit") {
                      setSelectedNodeId(n.id);
                      setSelectedPoiId(null);
                    }
                  }}
                >
                  <rect
                    x={n.position.x - 0.5}
                    y={worldY(n.position.y) - 0.5}
                    width={1.0}
                    height={1.0}
                    fill={
                      edgeFromNodeId === n.id
                        ? "#f59e0b"
                        : selectedNodeId === n.id
                        ? "#0f172a"
                        : "#1e293b"
                    }
                    stroke={
                      edgeFromNodeId === n.id
                        ? "#fff"
                        : selectedNodeId === n.id
                        ? "#facc15"
                        : "none"
                    }
                    strokeWidth={0.2}
                  />
                  <text
                    x={n.position.x}
                    y={worldY(n.position.y) + 1.4}
                    textAnchor="middle"
                    fontSize={0.7}
                    fill="#64748b"
                    fontFamily="ui-monospace, monospace"
                    className="pointer-events-none"
                  >
                    QR
                  </text>
                </g>
              ))}

          {/* POIs */}
          {pois.map((p) => {
            const color = CATEGORY_COLOR[p.category] ?? CATEGORY_COLOR.other;
            const isSelected = selectedPoiId === p.id;
            const isStart = fromPoiId === p.id;
            const isEnd = toPoiId === p.id;
            const isEdgeFrom =
              edgeFromNodeId !== null &&
              poiToNode.get(p.id)?.id === edgeFromNodeId;
            const highlighted = isSelected || isStart || isEnd || isEdgeFrom;
            return (
              <g
                key={p.id}
                style={{ cursor: mode === "edit" ? "grab" : "pointer" }}
                onPointerDown={(e) => onPoiPointerDown(e, p.id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onClick={(e) => {
                  e.stopPropagation();
                  // In edges mode, treat the POI's attached nav_node as the endpoint
                  if (mode === "edges") {
                    const attached = poiToNode.get(p.id);
                    if (attached) handleNodeClickForEdges(attached.id);
                    return;
                  }
                  if (mode === "view") {
                    if (!fromPoiId) setFromPoiId(p.id);
                    else if (!toPoiId && p.id !== fromPoiId) setToPoiId(p.id);
                    else {
                      setFromPoiId(p.id);
                      setToPoiId(null);
                    }
                  } else if (mode === "edit") {
                    setSelectedPoiId(p.id);
                    setSelectedNodeId(null);
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
          {mode === "add" && addSubMode === "poi" && draftPoint && (
            <g>
              <circle
                cx={draftPoint.x}
                cy={worldY(draftPoint.y)}
                r={1.0}
                fill="#facc15"
                stroke="#0f172a"
                strokeWidth={0.25}
              />
              <text
                x={draftPoint.x}
                y={worldY(draftPoint.y) - 1.3}
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

        {mode === "add" && addSubMode === "poi" && (
          draftPoint ? (
            <AddPoiForm
              floorId={floor.id}
              x={draftPoint.x}
              y={draftPoint.y}
              onDone={() => setDraftPoint(null)}
              onCancel={() => setDraftPoint(null)}
            />
          ) : (
            <div className="text-xs text-slate-500">
              Click anywhere on the floor to start placing a POI.
            </div>
          )
        )}

        {mode === "add" && addSubMode !== "poi" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {addSubMode === "waypoint" ? "Place waypoints" : "Place QR anchors"}
            </h3>
            <p className="text-xs text-slate-500">
              {addSubMode === "waypoint"
                ? "Click on corridors and intersections. Each waypoint auto-connects to its nearest 3 neighbors (within 15m)."
                : "Place QR markers every ~25m near elevators, intersections and entrances. Print them later from the QR codes panel."}
            </p>
            <RegenerateGraphButton floorId={floor.id} />
          </div>
        )}

        {mode === "edit" && (
          selectedPoi ? (
            <EditPoiForm
              poi={selectedPoi}
              onDeleted={() => setSelectedPoiId(null)}
            />
          ) : selectedNode ? (
            <EditNodeForm
              node={selectedNode}
              floorId={floor.id}
              onDeleted={() => setSelectedNodeId(null)}
            />
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Click a POI, waypoint or QR anchor to edit. Drag to move.
              </div>
              <RegenerateGraphButton floorId={floor.id} />
            </div>
          )
        )}

        {mode === "edges" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Manual edges
            </h3>
            <p className="text-xs text-slate-500">
              Click any two nodes (POI, waypoint, QR anchor) to{" "}
              {edgeDeleteMode ? "remove" : "connect"} them. Edges are
              bidirectional by default.
            </p>

            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setEdgeDeleteMode(false)}
                className={
                  !edgeDeleteMode
                    ? "flex-1 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }
              >
                ＋ Connect
              </button>
              <button
                type="button"
                onClick={() => setEdgeDeleteMode(true)}
                className={
                  edgeDeleteMode
                    ? "flex-1 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm dark:bg-slate-700 dark:text-red-300"
                    : "flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }
              >
                － Remove
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={edgeWheelchair}
                onChange={(e) => setEdgeWheelchair(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              ♿ Wheelchair accessible
            </label>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Step 1
              </div>
              <div className="text-slate-500">
                {edgeFromNodeId
                  ? "✓ First node selected (highlighted in amber)"
                  : "Click the first node on the map."}
              </div>
              <div className="mt-2 font-semibold text-slate-700 dark:text-slate-300">
                Step 2
              </div>
              <div className="text-slate-500">
                {edgeFromNodeId
                  ? `Click another node to ${
                      edgeDeleteMode ? "remove" : "create"
                    } the edge.`
                  : "—"}
              </div>
              {edgeFromNodeId && (
                <button
                  type="button"
                  onClick={() => setEdgeFromNodeId(null)}
                  className="mt-3 text-blue-600 hover:underline"
                >
                  Cancel selection
                </button>
              )}
            </div>

            <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
              <RegenerateGraphButton floorId={floor.id} />
            </div>
          </div>
        )}
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

function SubModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white"
          : "rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
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
function getNodeX(nodes: NavNode[], id: string): number {
  return nodes.find((n) => n.id === id)?.position.x ?? 0;
}
function getNodeY(nodes: NavNode[], id: string): number {
  return nodes.find((n) => n.id === id)?.position.y ?? 0;
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

function EditNodeForm({
  node,
  floorId,
  onDeleted,
}: {
  node: NavNode;
  floorId: string;
  onDeleted: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function remove() {
    if (
      !confirm(
        `Delete this ${node.type === "qr_anchor" ? "QR anchor" : "waypoint"}? Connected edges will be removed too.`
      )
    )
      return;
    setPending(true);
    const fd = new FormData();
    fd.set("nodeId", node.id);
    fd.set("floorId", floorId);
    await deleteNavNodeAction(fd);
    setPending(false);
    onDeleted();
  }

  return (
    <div key={node.id} className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {node.type === "qr_anchor" ? "QR anchor" : "Waypoint"}
        </h3>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-xs text-red-600 hover:underline disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      <div className="font-mono text-xs text-slate-500">
        ({node.position.x.toFixed(1)}, {node.position.y.toFixed(1)})
      </div>
      {node.qrCode && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Anchor code
          </div>
          <code className="text-xs text-slate-700 dark:text-slate-300">
            {node.qrCode}
          </code>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Drag the node on the map to reposition.
      </p>
    </div>
  );
}

function RegenerateGraphButton({ floorId }: { floorId: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          const fd = new FormData();
          fd.set("floorId", floorId);
          startTransition(async () => {
            const r = await regenerateFloorGraphAction(fd);
            setMsg(r.ok ? "Graph regenerated." : `Failed: ${r.error}`);
          });
        }}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {pending ? "Regenerating…" : "🔄 Regenerate edges (auto-connect all nodes)"}
      </button>
      {msg && <div className="text-xs text-slate-500">{msg}</div>}
    </div>
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
