/**
 * A floor (level) of a building.
 *
 * Floor level convention:
 *   0 = ground floor
 *   negative = underground (-1, -2)
 *   positive = upper floors (1, 2, 3...)
 */

export type FloorScanStatus =
  | "draft"        // floor created, no scan yet
  | "scanning"     // operator is scanning
  | "uploaded"     // scan uploaded, awaiting POI placement
  | "in_review"    // admin reviewing
  | "published"    // available to end users
  | "archived";    // replaced by newer version

export interface Floor {
  id: string;
  buildingId: string;
  /** Floor level, see convention above */
  level: number;
  /** Display name, e.g., "Ground Floor", "Cardiology Wing - 3rd Floor" */
  name: string;
  /** Storage key of the 3D mesh file (.glb), null if not yet uploaded */
  meshUrl: string | null;
  /** Storage key of the 2D floor plan (PNG/SVG), used by V1 navigation */
  floorplan2dUrl: string | null;
  /** Bounding box for the floor in meters (x_min, y_min, x_max, y_max). Used for map rendering. */
  bbox: [number, number, number, number] | null;
  scanStatus: FloorScanStatus;
  /** ISO */
  scannedAt: string | null;
  /** ISO */
  publishedAt: string | null;
  /** ISO */
  createdAt: string;
  /** ISO */
  updatedAt: string;
}
