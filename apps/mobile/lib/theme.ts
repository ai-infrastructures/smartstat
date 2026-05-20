/**
 * Design tokens for SmartStat AI mobile app.
 * Default palette; per-tenant branding overrides primary/secondary at runtime.
 */
export const colors = {
  primary: "#0066CC",
  secondary: "#10B981",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#0f172a",
  textMuted: "#64748b",
  textSubtle: "#94a3b8",
  border: "#e2e8f0",
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

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
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
