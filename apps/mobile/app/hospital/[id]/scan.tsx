/**
 * Hospital-scoped scan tab.
 *
 * Reuses the global Scan screen — it already handles the case where the
 * scanned QR belongs to a different hospital by router.replace()-ing into
 * the correct one. When the QR belongs to the current hospital, the user
 * lands on the Search tab with their position pinned.
 */
export { default } from "../../scan/index";
