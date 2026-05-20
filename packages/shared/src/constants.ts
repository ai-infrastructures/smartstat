/**
 * Project-wide constants.
 */

export const APP_NAME_DEFAULT = "SmartStat AI";

/** V1 target indoor positioning accuracy, meters */
export const POSITIONING_TARGET_ACCURACY_M = 5;

/** Maximum allowed map mesh size per floor in MB (after compression) */
export const MAX_FLOOR_MESH_SIZE_MB = 10;

/** Walking speed assumed for ETA, meters per second (~3 km/h, typical hospital pace) */
export const AVG_WALKING_SPEED_MPS = 0.85;

/** Maximum recommended distance between QR calibration anchors, meters */
export const QR_ANCHOR_MAX_SPACING_M = 25;

/** Supported locales (V1: English only) */
export const SUPPORTED_LOCALES = ["en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Default tenant plan for new signups (changeable in admin) */
export const DEFAULT_TENANT_PLAN = "starter" as const;

/** Storage bucket names */
export const STORAGE_BUCKETS = {
  meshes: "floor-meshes",
  floorplans: "floor-plans",
  branding: "branding",
  qrCodes: "qr-codes",
} as const;
