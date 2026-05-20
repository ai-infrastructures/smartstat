/**
 * Pedometer + magnetometer based dead reckoning.
 *
 * Subscribes to step events and the device heading. For every detected
 * step we advance the stored position by ~0.75 m in the current heading,
 * and grow the uncertainty halo by ~0.1 m.
 *
 * Recalibration sources:
 *   - QR fiducial scan → resets uncertainty to 0
 *   - User long-press on the map → can set position manually (V2)
 *
 * Why this is enough for V1:
 *   - In a typical building, walks between QR anchors are < 25 m
 *   - 25 m × 10 % drift = 2.5 m uncertainty, still useful
 *   - Above ~5 m uncertainty the UI prompts a re-scan
 *
 * Note on permissions:
 *   - iOS: Motion & Fitness permission. Granted via Settings on first use.
 *   - Android: ACTIVITY_RECOGNITION permission since Android 10.
 *   Expo handles the request through Pedometer.requestPermissionsAsync().
 */
import { useEffect } from "react";
import { Magnetometer, Pedometer } from "expo-sensors";
import { applyDeadReckoning, getUserPosition } from "./userPosition";

const STEP_LENGTH_M = 0.75;
/** Drift uncertainty added per step (10% of step length is a safe default). */
const PER_STEP_UNCERTAINTY_M = STEP_LENGTH_M * 0.1;

interface MagnetSample {
  /** Bearing in radians where 0 = magnetic north, positive = clockwise (east). */
  headingRad: number;
}

let lastMagnetSample: MagnetSample = { headingRad: 0 };

function magnetToHeading(x: number, y: number): number {
  // atan2 returns [-π, π]; convert to [0, 2π] clockwise from +Y (north)
  let h = Math.atan2(x, y);
  if (h < 0) h += 2 * Math.PI;
  return h;
}

/**
 * Returns a cleanup function that stops both subscriptions.
 */
async function start(): Promise<() => void> {
  // Magnetometer at 5 Hz is plenty for indoor heading
  Magnetometer.setUpdateInterval(200);
  const magSub = Magnetometer.addListener(({ x, y }) => {
    lastMagnetSample = { headingRad: magnetToHeading(x, y) };
  });

  let pedSub: { remove: () => void } | null = null;
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (isAvailable) {
      const perm = await Pedometer.getPermissionsAsync();
      if (!perm.granted && perm.canAskAgain) {
        await Pedometer.requestPermissionsAsync();
      }
      let lastStepCount = 0;
      pedSub = Pedometer.watchStepCount((result) => {
        const delta = result.steps - lastStepCount;
        lastStepCount = result.steps;
        for (let i = 0; i < delta; i++) {
          // Floor coordinate convention: x = east, y = north.
          // Heading 0 = north, π/2 = east → dx = sin(h), dy = cos(h).
          // We also need to be on a floor (have a current position).
          const pos = getUserPosition();
          if (!pos) return;
          const h = lastMagnetSample.headingRad;
          const dx = Math.sin(h) * STEP_LENGTH_M;
          const dy = Math.cos(h) * STEP_LENGTH_M;
          applyDeadReckoning(dx, dy, PER_STEP_UNCERTAINTY_M);
        }
      });
    }
  } catch {
    /* Sensors unavailable (e.g. simulator) — silently skip */
  }

  return () => {
    magSub.remove();
    pedSub?.remove();
  };
}

/**
 * React hook that owns the dead-reckoning subscription for the screen's
 * lifetime. Call once from the navigate screen.
 */
export function useDeadReckoning(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    let cleanup: (() => void) | null = null;
    let cancelled = false;
    start().then((c) => {
      if (cancelled) {
        c();
      } else {
        cleanup = c;
      }
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [enabled]);
}
