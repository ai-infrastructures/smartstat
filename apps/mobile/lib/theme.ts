/**
 * Design tokens for SmartStat AI mobile app.
 * Default palette; per-tenant branding overrides primary/secondary at runtime.
 *
 * Surface model:
 *  - `background` is a slightly tinted slate so the white `surface` cards
 *    actually feel lifted above it.
 *  - Shadows use a neutral slate tone (not pure black) so they read softer
 *    and the whole UI breathes.
 */
import { type ViewStyle } from "react-native";

export const colors = {
  primary: "#0066CC",
  secondary: "#10B981",
  // A softer, slightly cooler background — not bright white, not flat slate
  background: "#eef2f7",
  surface: "#ffffff",
  text: "#0f172a",
  textMuted: "#64748b",
  textSubtle: "#94a3b8",
  border: "#e2e8f0",
  borderSoft: "rgba(148, 163, 184, 0.25)",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  routeHighlight: "#2563eb",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * Border radius — bigger and softer than before. Cards use `lg` (16),
 * sheets/heroes use `xl` (22) for that "modern app" feel.
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 32,
};

/**
 * Pre-built shadow presets — drop into a View `style` array.
 *
 *   <View style={[styles.card, shadow.md]} />
 *
 * On Android we map to `elevation`. On iOS the soft slate tint is what
 * gives that "lifted off the page" feeling without looking heavy.
 */
export const shadow: Record<"sm" | "md" | "lg" | "xl", ViewStyle> = {
  sm: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  lg: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  xl: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
};

export const categoryColor: Record<string, string> = {
  department: "#3b82f6",
  clinic: "#06b6d4",
  room: "#64748b",
  counter: "#8b5cf6",
  elevator: "#eab308",
  stairs: "#ca8a04",
  restroom: "#10b981",
  pharmacy: "#ec4899",
  emergency: "#ef4444",
  cafeteria: "#f97316",
  parking_entry: "#6366f1",
  entrance: "#14b8a6",
  exit: "#0d9488",
  other: "#94a3b8",
};
