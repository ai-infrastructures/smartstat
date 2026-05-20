import type { ConfigContext, ExpoConfig } from "expo/config";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Per-tenant build configuration shape (mirrors tenants/schema.json).
 */
interface TenantBuildConfig {
  slug: string;
  tenantId: string;
  appName: string;
  appShortName?: string;
  scheme: string;
  bundleId: string;
  androidPackage: string;
  version: string;
  primaryColor: string;
  secondaryColor?: string;
  splashBackgroundColor?: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
  easProjectId?: string | null;
}

const DIRECTORY_DEFAULTS = {
  name: "SmartStat AI",
  slug: "smartstat-mobile",
  scheme: "smartstat",
  bundleId: "ai.smartstat.mobile",
  androidPackage: "ai.smartstat.mobile",
  version: "0.1.0",
  primaryColor: "#0066CC",
  splashBackgroundColor: "#FFFFFF",
};

function loadTenantConfig(slug: string): TenantBuildConfig {
  const file = path.join(__dirname, "..", "..", "tenants", slug, "config.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      `[app.config] Tenant config not found at ${file}. ` +
        `Create tenants/${slug}/config.json or unset SMARTSTAT_TENANT_SLUG.`
    );
  }
  const raw = fs.readFileSync(file, "utf8");
  const cfg = JSON.parse(raw) as TenantBuildConfig;
  if (cfg.slug !== slug) {
    throw new Error(
      `[app.config] tenants/${slug}/config.json has slug="${cfg.slug}", expected "${slug}".`
    );
  }
  return cfg;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const rawSlug = (process.env.SMARTSTAT_TENANT_SLUG ?? "").trim();
  const tenantSlug = rawSlug && rawSlug !== "directory" ? rawSlug : null;
  const tenant = tenantSlug ? loadTenantConfig(tenantSlug) : null;

  const name = tenant?.appName ?? DIRECTORY_DEFAULTS.name;
  const expoSlug = tenant ? `smartstat-${tenant.slug}` : DIRECTORY_DEFAULTS.slug;
  const scheme = tenant?.scheme ?? DIRECTORY_DEFAULTS.scheme;
  const bundleId = tenant?.bundleId ?? DIRECTORY_DEFAULTS.bundleId;
  const androidPackage = tenant?.androidPackage ?? DIRECTORY_DEFAULTS.androidPackage;
  const version = tenant?.version ?? DIRECTORY_DEFAULTS.version;
  const primaryColor = tenant?.primaryColor ?? DIRECTORY_DEFAULTS.primaryColor;
  const splashBg =
    tenant?.splashBackgroundColor ?? DIRECTORY_DEFAULTS.splashBackgroundColor;

  // If the tenant has its own asset set, prefer it; otherwise fall back to defaults.
  const tenantAssetDir = tenant
    ? path.join(__dirname, "..", "..", "tenants", tenant.slug, "assets")
    : null;
  const asset = (filename: string, fallback: string): string => {
    if (tenantAssetDir) {
      const candidate = path.join(tenantAssetDir, filename);
      if (fs.existsSync(candidate)) return candidate;
    }
    return fallback;
  };

  return {
    ...config,
    name,
    slug: expoSlug,
    scheme,
    version,
    orientation: "portrait",
    icon: asset("icon.png", "./assets/icon.png"),
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: asset("splash.png", "./assets/splash-icon.png"),
      resizeMode: "contain",
      backgroundColor: splashBg,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: bundleId,
      infoPlist: {
        NSCameraUsageDescription: `Used to scan ${name} QR anchors inside the facility to locate your current position. Nothing is recorded.`,
      },
    },
    android: {
      package: androidPackage,
      adaptiveIcon: {
        foregroundImage: asset(
          "adaptive-icon.png",
          "./assets/adaptive-icon.png"
        ),
        backgroundColor: splashBg,
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ["android.permission.CAMERA"],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-camera",
        {
          cameraPermission: `Used to scan ${name} QR anchors to locate your position.`,
        },
      ],
    ],
    extra: {
      // Baked-in tenant info — the app uses this to decide whether to
      // show the hospital selector or lock to a single tenant.
      tenantSlug: tenant?.slug ?? null,
      tenantId: tenant?.tenantId ?? null,
      tenantPrimaryColor: primaryColor,
      tenantSecondaryColor: tenant?.secondaryColor ?? null,
      tenantSupportEmail: tenant?.supportEmail ?? null,
      tenantSupportPhone: tenant?.supportPhone ?? null,
      eas: tenant?.easProjectId
        ? { projectId: tenant.easProjectId }
        : { projectId: "" },
    },
  };
};
