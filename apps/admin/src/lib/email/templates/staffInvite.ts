import { baseLayout, button } from "./layout";

export interface StaffInviteEmailOptions {
  /** Person receiving the invite */
  recipientEmail: string;
  /** Optional first name shown in the greeting */
  recipientName?: string | null;
  /** Hospital they're being invited to */
  tenantName: string;
  /** Brand color of the hospital (used as the CTA color) */
  primaryColor?: string;
  /** Friendly role label, e.g. "Scanner operator" or "Tenant admin" */
  roleLabel: string;
  /** Magic-link URL the recipient should click to accept */
  acceptUrl: string;
  /** Person who sent the invite (for the "from" line in the body) */
  inviterEmail: string;
}

/**
 * Renders the staff-invite email (HTML + plain text).
 */
export function renderStaffInvite(opts: StaffInviteEmailOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const greeting = opts.recipientName ? `Hi ${opts.recipientName},` : "Hi,";
  const subject = `You're invited to ${opts.tenantName} on SmartStat AI`;

  const html = baseLayout({
    preheader: `${opts.inviterEmail} invited you as ${opts.roleLabel}`,
    brand: {
      name: opts.tenantName,
      primaryColor: opts.primaryColor ?? "#0EA5E9",
    },
    body: `
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;">${greeting}</p>
      <p style="margin:0 0 12px;">
        <strong>${escapeHtml(opts.inviterEmail)}</strong> invited you to join
        <strong>${escapeHtml(opts.tenantName)}</strong> on SmartStat AI as
        <strong>${escapeHtml(opts.roleLabel)}</strong>.
      </p>
      <p style="margin:0 0 16px;">
        Click the button below to accept. The link logs you in directly —
        no password to remember.
      </p>
      ${button(opts.acceptUrl, "Accept invite", opts.primaryColor ?? "#0EA5E9")}
      <p style="margin:24px 0 0;font-size:13px;color:#64748b;">
        Or copy and paste this link into your browser:<br />
        <a href="${escapeAttr(
          opts.acceptUrl
        )}" style="color:#0EA5E9;word-break:break-all;">${escapeHtml(
      opts.acceptUrl
    )}</a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">
        Link valid for 24 hours. If it expires, ask
        ${escapeHtml(opts.inviterEmail)} to invite you again.
      </p>
    `,
  });

  const text = [
    `You're invited to ${opts.tenantName} on SmartStat AI`,
    "",
    `${opts.inviterEmail} invited you as ${opts.roleLabel}.`,
    "",
    "Accept the invite here:",
    opts.acceptUrl,
    "",
    "Link valid for 24 hours.",
    "",
    "— SmartStat AI",
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
