/**
 * A* pathfinding over the navigation graph.
 *
 * Pure, dependency-free, runs in the browser, the mobile app, or the server.
 * Inputs are plain data; no Supabase or framework dependencies.
 */
import type { NavNode, NavEdge, Route, RouteStep } from "./types/navigation";
import { AVG_WALKING_SPEED_MPS } from "./constants";

export interface PathfindingOptions {
  /** Require wheelchair-accessible edges only */
  wheelchairAccessible?: boolean;
}

interface InternalEdge {
  toNodeId: string;
  distance: number;
  wheelchairAccessible: boolean;
}

/**
 * Build an adjacency list from nodes and edges.
 */
function buildAdjacency(
  nodes: NavNode[],
  edges: NavEdge[]
): Map<string, InternalEdge[]> {
  const adj = new Map<string, InternalEdge[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.fromNodeId)?.push({
      toNodeId: e.toNodeId,
      distance: e.distance,
      wheelchairAccessible: e.wheelchairAccessible,
    });
    if (!e.oneWay) {
      adj.get(e.toNodeId)?.push({
        toNodeId: e.fromNodeId,
        distance: e.distance,
        wheelchairAccessible: e.wheelchairAccessible,
      });
    }
  }
  return adj;
}

function euclidean(a: NavNode, b: NavNode): number {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  const dz = a.position.z - b.position.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * A* shortest path from startNodeId to goalNodeId.
 * Returns null if no path is found.
 */
export function findPath(
  startNodeId: string,
  goalNodeId: string,
  nodes: NavNode[],
  edges: NavEdge[],
  options: PathfindingOptions = {}
): Route | null {
  const nodeById = new Map<string, NavNode>(nodes.map((n) => [n.id, n]));
  const start = nodeById.get(startNodeId);
  const goal = nodeById.get(goalNodeId);
  if (!start || !goal) return null;
  if (startNodeId === goalNodeId) {
    return {
      nodeIds: [startNodeId],
      totalDistanceMeters: 0,
      estimatedDurationSeconds: 0,
      floorChanges: 0,
      steps: [
        {
          index: 0,
          instruction: "You are here.",
          distanceMeters: 0,
          direction: "arrive",
          position: { ...start.position },
        },
      ],
    };
  }

  const adj = buildAdjacency(nodes, edges);

  // Open set: priority queue keyed by fScore. Simple array-based PQ
  // (graphs in V1 are small — a few hundred nodes per floor).
  const openSet = new Set<string>([startNodeId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, euclidean(start, goal));

  while (openSet.size > 0) {
    // Pick node with lowest fScore
    let current: string | null = null;
    let currentF = Infinity;
    for (const id of openSet) {
      const f = fScore.get(id) ?? Infinity;
      if (f < currentF) {
        currentF = f;
        current = id;
      }
    }
    if (!current) break;

    if (current === goalNodeId) {
      return reconstructRoute(
        cameFrom,
        current,
        nodeById,
        gScore.get(current) ?? 0
      );
    }

    openSet.delete(current);

    const neighbors = adj.get(current) ?? [];
    for (const n of neighbors) {
      if (options.wheelchairAccessible && !n.wheelchairAccessible) continue;

      const tentativeG = (gScore.get(current) ?? Infinity) + n.distance;
      if (tentativeG < (gScore.get(n.toNodeId) ?? Infinity)) {
        cameFrom.set(n.toNodeId, current);
        gScore.set(n.toNodeId, tentativeG);
        const neighborNode = nodeById.get(n.toNodeId)!;
        fScore.set(n.toNodeId, tentativeG + euclidean(neighborNode, goal));
        openSet.add(n.toNodeId);
      }
    }
  }

  return null;
}

function reconstructRoute(
  cameFrom: Map<string, string>,
  endNodeId: string,
  nodeById: Map<string, NavNode>,
  totalDistance: number
): Route {
  const nodeIds: string[] = [endNodeId];
  let current = endNodeId;
  while (cameFrom.has(current)) {
    current = cameFrom.get(current)!;
    nodeIds.unshift(current);
  }

  const path = nodeIds.map((id) => nodeById.get(id)!).filter(Boolean);
  const floorChanges = countFloorChanges(path);
  const duration = totalDistance / AVG_WALKING_SPEED_MPS;
  const steps = buildSteps(path);

  return {
    nodeIds,
    totalDistanceMeters: totalDistance,
    estimatedDurationSeconds: duration,
    floorChanges,
    steps,
  };
}

function countFloorChanges(path: NavNode[]): number {
  let changes = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    if (
      (a.type === "elevator" || a.type === "stairs") &&
      (b.type === "elevator" || b.type === "stairs") &&
      a.interFloorLinkId &&
      a.interFloorLinkId === b.interFloorLinkId &&
      a.floorId !== b.floorId
    ) {
      changes += 1;
    }
  }
  return changes;
}

/**
 * Turn-by-turn steps with rough direction inference based on bearing change.
 */
function buildSteps(path: NavNode[]): RouteStep[] {
  if (path.length === 0) return [];
  if (path.length === 1) {
    return [
      {
        index: 0,
        instruction: "You are here.",
        distanceMeters: 0,
        direction: "arrive",
        position: { ...path[0]!.position },
      },
    ];
  }

  const steps: RouteStep[] = [];
  let prevBearing: number | null = null;

  for (let i = 0; i < path.length; i++) {
    const node = path[i]!;
    const next = path[i + 1];

    if (!next) {
      // Final node
      steps.push({
        index: steps.length,
        instruction: "You have arrived.",
        distanceMeters: 0,
        direction: "arrive",
        position: { ...node.position },
      });
      break;
    }

    const dx = next.position.x - node.position.x;
    const dy = next.position.y - node.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const bearing = Math.atan2(dy, dx); // radians, 0 = +x

    let direction: RouteStep["direction"];
    let instruction: string;

    // Special floor-change cases
    if (
      (node.type === "elevator" || node.type === "stairs") &&
      next.floorId !== node.floorId
    ) {
      direction = node.type === "elevator" ? "elevator" : "stairs_up";
      instruction =
        node.type === "elevator"
          ? "Take the elevator."
          : "Take the stairs.";
    } else if (prevBearing === null) {
      direction = "straight";
      instruction = `Walk ${distance.toFixed(0)} m straight ahead`;
    } else {
      const delta = normalizeAngle(bearing - prevBearing);
      direction = deltaToDirection(delta);
      instruction = directionToInstruction(direction, distance);
    }

    steps.push({
      index: steps.length,
      instruction,
      distanceMeters: distance,
      direction,
      position: { ...node.position },
    });

    prevBearing = bearing;
  }

  return steps;
}

function normalizeAngle(rad: number): number {
  while (rad > Math.PI) rad -= 2 * Math.PI;
  while (rad < -Math.PI) rad += 2 * Math.PI;
  return rad;
}

function deltaToDirection(delta: number): RouteStep["direction"] {
  const deg = (delta * 180) / Math.PI;
  // Positive = turn left (CCW). Negative = turn right (CW).
  if (Math.abs(deg) < 15) return "straight";
  if (Math.abs(deg) > 150) return "u_turn";
  if (deg > 60) return "left";
  if (deg < -60) return "right";
  if (deg > 0) return "slight_left";
  return "slight_right";
}

function directionToInstruction(
  dir: RouteStep["direction"],
  distance: number
): string {
  const d = distance.toFixed(0);
  switch (dir) {
    case "straight":
      return `Continue straight for ${d} m`;
    case "left":
      return `Turn left and walk ${d} m`;
    case "right":
      return `Turn right and walk ${d} m`;
    case "slight_left":
      return `Slight left, then ${d} m`;
    case "slight_right":
      return `Slight right, then ${d} m`;
    case "u_turn":
      return `Make a U-turn and walk ${d} m`;
    case "elevator":
      return "Take the elevator";
    case "stairs_up":
      return "Take the stairs up";
    case "stairs_down":
      return "Take the stairs down";
    case "arrive":
      return "You have arrived";
  }
}
