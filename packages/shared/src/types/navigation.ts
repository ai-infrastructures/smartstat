/**
 * Navigation graph types.
 *
 * The graph is computed per floor during admin map preparation.
 * Nodes are corridor waypoints and POIs; edges are walkable connections.
 * Pathfinding (A*) runs client-side on the downloaded graph for offline navigation.
 */

export type NavNodeType =
  | "waypoint"     // corridor junction
  | "poi"          // anchored to a POI
  | "elevator"     // links to elevator nodes on other floors
  | "stairs"       // links to stairs nodes on other floors
  | "entrance"     // building entrance (often QR-anchored)
  | "qr_anchor";   // physical QR sticker for positioning calibration

export interface NavNode {
  id: string;
  floorId: string;
  type: NavNodeType;
  /** Coordinates in floor space, meters */
  position: { x: number; y: number; z: number };
  /** If type === "poi", reference to POI id */
  poiId?: string;
  /** If type === "qr_anchor", the QR code payload */
  qrCode?: string;
  /** If type === "elevator" or "stairs", the inter-floor link group id */
  interFloorLinkId?: string;
}

export interface NavEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  /** Distance in meters (used as A* edge weight) */
  distance: number;
  /** Walkable without stairs */
  wheelchairAccessible: boolean;
  /** Bi-directional by default */
  oneWay?: boolean;
}

/**
 * A computed route from a start point to a destination POI.
 */
export interface Route {
  /** Ordered list of node ids */
  nodeIds: string[];
  /** Total distance in meters */
  totalDistanceMeters: number;
  /** Estimated walking duration in seconds */
  estimatedDurationSeconds: number;
  /** Number of floor changes (elevator/stairs uses) */
  floorChanges: number;
  /** Step-by-step turn instructions for UI */
  steps: RouteStep[];
}

export interface RouteStep {
  /** Display order */
  index: number;
  /** Human-readable instruction, e.g., "In 10 meters, turn right" */
  instruction: string;
  /** Distance to next step in meters */
  distanceMeters: number;
  /** Direction relative to user */
  direction: "straight" | "left" | "right" | "slight_left" | "slight_right" | "u_turn" | "elevator" | "stairs_up" | "stairs_down" | "arrive";
  /** Coordinates where this step takes place */
  position: { x: number; y: number; z: number };
}
