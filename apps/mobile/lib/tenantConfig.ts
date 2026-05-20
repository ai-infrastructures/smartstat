/**
 * Build-time tenant configuration.
 *
 * In a white-label build (SMARTSTAT_TENANT_SLUG set at build time),
 * `tenantSlug` and `tenantId` are baked into the binary via
 * app.config.ts → expo Constants.expoConfig.extra.
 *
 * In a directory build (no env var), both are null and the app
 * shows the full hospital selector list.
 */
import Constants from "expo-constants";

interface TenantBuildInfo {
  /** URL-safe slug, e.g. "memorial-hospital". null in directory builds. */
  slug: string | null;
  /** Database tenant UUID. null in directory builds. */
  id: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
}

const extra =
  ((Constants.expoConfig?.extra ??
    Constants.manifest2?.extra ??
    {}) as Record<string, unknown>) ?? {};

export const TENANT_BUILD: TenantBuildInfo = {
  slug: (extra.tenantSlug as string | null) ?? null,
  id: (extra.tenantId as string | null) ?? null,
  primaryColor: (extra.tenantPrimaryColor as string) ?? "#0066CC",
  secondaryColor: (extra.tenantSecondaryColor as string | null) ?? null,
  supportEmail: (extra.tenantSupportEmail as string | null) ?? null,
  supportPhone: (extra.tenantSupportPhone as string | null) ?? null,
};

/** True when this binary was built for a specific tenant (white-label mode). */
export const IS_TENANT_LOCKED = TENANT_BUILD.id !== null;
