/**
 * Thin wrapper around expo-haptics so callers can fire-and-forget.
 *
 * Patterns we use:
 *  - success: QR scan recognized, route computed, downloaded for offline
 *  - light:   destination tapped, mode switched
 *  - warning: no route found, position lost
 *  - error:   network failure, permission denied
 *
 * All calls are no-ops on web and swallow errors so they never break flow.
 */
import * as Haptics from "expo-haptics";

export function hapticSuccess(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
}

export function hapticWarning(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
    () => {}
  );
}

export function hapticError(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
    () => {}
  );
}

export function hapticLight(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticMedium(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticSelection(): void {
  Haptics.selectionAsync().catch(() => {});
}
