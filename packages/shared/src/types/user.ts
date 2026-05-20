/**
 * App users (admin staff, scanner operators, end users).
 *
 * V1 PHI strategy: end users are mostly guests. Optional accounts only store
 * email + name + password hash; NO health data, NO appointment data.
 */

export type UserRole =
  | "super_admin"       // SmartStat AI internal
  | "tenant_admin"      // hospital admin (manages mappings, branding, POIs)
  | "tenant_editor"     // hospital staff (edits POIs)
  | "scanner_operator"  // authorized to scan + upload floors
  | "end_user";         // optional registered patient/visitor

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  /** null for super_admin and end_user; required for tenant roles */
  tenantId: string | null;
  /** ISO */
  createdAt: string;
  /** ISO */
  lastLoginAt: string | null;
  /** MFA enabled (required for tenant_admin in production) */
  mfaEnabled: boolean;
  isActive: boolean;
}
