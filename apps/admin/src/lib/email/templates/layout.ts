/**
 * Shared HTML layout for every transactional email.
 *
 * Email HTML is intentionally inline-styled — most clients (Gmail, Outlook,
 * Apple Mail) strip <style> tags or don't support CSS reliably.
 */

export interface BaseLayoutOptions {
  /** Page title in <title> + preview text under the subject in inbox */
  preheader: string;
  /** Body content already rendered as HTML */
  body: string;
  /** Optional tenant branding override (logo + color). null = SmartStat brand */
  brand?: {
    name: string;
    primaryColor: string;
    logoUrl?: string;
  } | null;
}

export function baseLayout(opts: BaseLayoutOptions): string {
  const brandName = opts.brand?.name ?? "SmartStat AI";
  const primary = opts.brand?.primaryColor ?? "#0EA5E9";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(brandName)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <!-- Hidden preheader -->
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(
      opts.preheader
    )}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid rgba(148,163,184,0.25);box-shadow:0 6px 22px rgba(15,23,42,0.06);">
            <!-- Brand header -->
            <tr>
              <td style="background:linear-gradient(135deg,#1D4ED8 0%,${primary} 55%,#38BDF8 100%);padding:28px 32px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="vertical-align:middle;">
                      <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                        ${escapeHtml(brandName)}
                      </span>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:0.5px;">
                        Indoor navigation
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px;color:#0f172a;font-size:15px;line-height:1.55;">
                ${opts.body}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;padding:18px 32px;border-top:1px solid rgba(148,163,184,0.2);color:#64748b;font-size:12px;line-height:1.5;">
                You received this email because someone added you as a staff
                member on ${escapeHtml(brandName)}. If you weren't expecting it,
                ignore this email — no action will be taken.
              </td>
            </tr>
          </table>

          <p style="color:#94a3b8;font-size:11px;margin:18px 0 0;">
            © ${new Date().getFullYear()} SmartStat AI · indoor wayfinding
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function button(href: string, label: string, color = "#0EA5E9"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:${color};border-radius:10px;">
        <a href="${escapeAttr(href)}" target="_blank" rel="noopener"
           style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
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
