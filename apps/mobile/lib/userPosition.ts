import { useSyncExternalStore } from "react";

/**
 * In-memory store for the user's current indoor position.
 *
 * Position has two sources:
 *   - a QR anchor scan → exact (uncertaintyM = 0)
 *   - dead-reckoning (pedometer + compass) → growing uncertainty
 *
 * Consumers (hospital + navigate screens) read this hook to render the
 * "You are here" pin and to seed the pathfinder's start node.
 */

export interface UserPosition {
  tenantId: string;
  buildingId: string;
  floorId: string;
  /** Current best estimate of position in floor coordinates (meters) */
  x: number;
  y: number;
  /** The nav_node id of the LAST scanned QR — used by the pathfinder
   *  as the canonical start when uncertainty is acceptable */
  anchorNodeId: string;
  /** Anchor code that was scanned (for display) */
  anchorCode: string;
  /** Epoch millis when the QR was scanned */
  scannedAt: number;
  /** 1-sigma uncertainty radius in meters. Starts at 0 right after a scan
   *  and grows with each PDR step. */
  uncertaintyM: number;
  /** Number of dead-reckoning steps applied since last scan */
  stepsSinceScan: number;
}

let current: UserPosition | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setUserPosition(pos: UserPosition | null) {
  current = pos;
  emit();
}

/** Mutate the position from dead reckoning. Does NOT replace anchorNodeId. */
export function applyDeadReckoning(
  dx: number,
  dy: number,
  uncertaintyAdd: number
) {
  if (!current) return;
  current = {
    ...current,
    x: current.x + dx,
    y: current.y + dy,
    uncertaintyM: current.uncertaintyM + uncertaintyAdd,
    stepsSinceScan: current.stepsSinceScan + 1,
  };
  emit();
}

export function getUserPosition(): UserPosition | null {
  return current;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useUserPosition(): UserPosition | null {
  return useSyncExternalStore(subscribe, getUserPosition, getUserPosition);
}

/** Returns true if a position is fresh enough to trust (default 10 minutes) */
export function isPositionFresh(
  pos: UserPosition | null,
  ttlMs = 10 * 60_000
): boolean {
  if (!pos) return false;
  return Date.now() - pos.scannedAt < ttlMs;
}

/** Returns true if uncertainty has grown past the soft warning threshold */
export function shouldRescan(pos: UserPosition | null): boolean {
  if (!pos) return false;
  return pos.uncertaintyM > 5 || pos.stepsSinceScan > 25;
}
