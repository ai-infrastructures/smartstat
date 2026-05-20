import { useSyncExternalStore } from "react";

/**
 * Tiny module-level store for the user's current indoor position.
 * Set when the user scans a QR anchor; consumed by hospital + navigate screens.
 *
 * Lives in memory only (cleared on app cold start). For V1 this is enough —
 * the user re-scans a QR when they re-enter. We can promote to SecureStore
 * persistence later if needed.
 */

export interface UserPosition {
  tenantId: string;
  buildingId: string;
  floorId: string;
  /** Coordinates of the scanned QR anchor */
  x: number;
  y: number;
  /** ID of the nav_node corresponding to the scanned QR anchor */
  anchorNodeId: string;
  /** Anchor code printed on the QR sticker (for display only) */
  anchorCode: string;
  /** Epoch millis when the QR was scanned */
  scannedAt: number;
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
export function isPositionFresh(pos: UserPosition | null, ttlMs = 10 * 60_000): boolean {
  if (!pos) return false;
  return Date.now() - pos.scannedAt < ttlMs;
}
