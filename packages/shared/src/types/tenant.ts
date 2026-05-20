/**
 * Tenant = one hospital (or other facility) using SmartStat AI.
 * Each tenant has fully isolated data and its own branding.
 */

export type TenantPlan = "starter" | "pro" | "enterprise";

export interface TenantBranding {
  /** Display name shown in app (e.g., "Memorial Hospital Wayfinder") */
  appDisplayName: string;
  /** Logo URL (PNG/SVG, square, min 512x512) */
  logoUrl: string;
  /** Splash image URL (PNG, optional) */
  splashImageUrl?: string;
  /** Primary brand color, hex (e.g., "#0066CC") */
  primaryColor: string;
  /** Secondary brand color, hex */
  secondaryColor: string;
  /** Optional: support contact shown in app */
  supportEmail?: string;
  supportPhone?: string;
}

export interface Tenant {
  id: string;
  /** URL-safe slug, e.g., "memorial-hospital" */
  slug: string;
  /** Legal/display name of the hospital */
  name: string;
  plan: TenantPlan;
  branding: TenantBranding;
  /** Default locale; V1 = "en" */
  locale: string;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp */
  updatedAt: string;
}
