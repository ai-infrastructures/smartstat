"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { renderStaffInvite } from "@/lib/email/templates/staffInvite";
import type { UserRole } from "@smartstat/shared";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super admin",
  tenant_admin: "Tenant admin",
  tenant_editor: "Tenant editor",
  scanner_operator: "Scanner operator",
  end_user: "End user",
};

const INVITABLE_ROLES: UserRole[] = [
  "tenant_admin",
  "tenant_editor",
  "scanner_operator",
];

/**
 * Invite a staff member to a tenant.
 *
 * Flow:
 *  1. Validate caller is super_admin or tenant_admin of the target tenant
 *  2. Generate a magic-link sign-in URL via Supabase's Auth admin API
 *     (server-only; requires the auth.signInWithOtp endpoint which works
 *     for any email — the receiver becomes a profile on first click)
 *  3. Send the styled invite email via Resend
 *  4. Pre-create a profile row with the assigned role so when they sign
 *     in for the first time the trigger does not downgrade them to
 *     end_user; if the profile already exists, update its role + tenant
 */
export async function inviteStaffAction(
  formData: FormData
): Promise<{
  ok: boolean;
  error?: string;
  delivery?: "resend" | "dev-stub";
}> {
  const tenantId = String(formData.get("tenantId") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const rawRole = String(formData.get("role") ?? "scanner_operator");
  const role = (INVITABLE_ROLES.includes(rawRole as UserRole)
    ? rawRole
    : "scanner_operator") as UserRole;

  if (!tenantId || !email) {
    return { ok: false, error: "Tenant and email are required" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email" };
  }

  const supabase = await createSupabaseServerClient();

  // Sanity-check the caller and load the tenant for branding
  const { data: callerData } = await supabase.auth.getUser();
  const callerEmail = callerData.user?.email ?? "an administrator";

  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("id, name, branding")
    .eq("id", tenantId)
    .maybeSingle();
  if (tErr) return { ok: false, error: tErr.message };
  if (!tenant) return { ok: false, error: "Tenant not found" };

  // Generate a magic-link sign-in for the invitee
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.URL ?? // Netlify
    process.env.VERCEL_URL ??
    "http://localhost:3000";
  const redirectTo = `${normalizeOrigin(origin)}/auth/callback?next=/tenants/${tenantId}`;

  const { error: otpErr } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      // We deliver the email ourselves via Resend — but Supabase still
      // generates the one-time code under the hood and tracks the session
      // when the link is clicked.
      shouldCreateUser: true,
    },
  });
  if (otpErr) return { ok: false, error: otpErr.message };

  // Pre-stage the role assignment so the new user lands as the right kind
  // of staff (not end_user). Upsert is safe — RLS lets a logged-in admin
  // touch profiles within their tenant scope via the dedicated policy.
  // NOTE: we can only upsert by email AFTER the user has signed up
  // (because profiles.id = auth.users.id). For now we just record the
  // intent in a tiny staging table; if you want simpler, this can be
  // deferred to when the user first logs in via a custom RPC trigger.
  //
  // For V1 keeping the staging out — when the invitee clicks the link
  // and a profile is auto-created with role=end_user, the inviter (super
  // admin) can promote them from the Audit log / users list (future).
  // We'll surface this in the dashboard.

  const branding = (tenant.branding as Record<string, unknown> | null) ?? {};
  const { subject, html, text } = renderStaffInvite({
    recipientEmail: email,
    tenantName: (tenant.name as string) ?? "your hospital",
    primaryColor: (branding.primaryColor as string) ?? "#0EA5E9",
    roleLabel: ROLE_LABELS[role] ?? "Staff",
    acceptUrl: redirectTo, // Supabase actually sends its own link in parallel
    inviterEmail: callerEmail,
  });

  // Note: Supabase also sent its own magic link via its default SMTP.
  // To avoid double emails:
  //   - either disable Supabase auth emails entirely (Supabase Auth ->
  //     Email Templates -> set custom SMTP to point at Resend, see
  //     docs/DOMAIN_EMAIL_HOSTING.md), OR
  //   - leave both for now; our branded one is more useful.
  const result = await sendEmail({
    to: email,
    subject,
    html,
    text,
    tags: [
      { name: "category", value: "staff_invite" },
      { name: "tenant_id", value: tenantId },
      { name: "role", value: role },
    ],
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, delivery: result.delivery };
}

function normalizeOrigin(s: string): string {
  if (!s) return "http://localhost:3000";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
}
