/**
 * Server-only Resend client + sendEmail helper.
 *
 * Env vars (set in Netlify / Vercel / .env.local — NEVER in NEXT_PUBLIC_*):
 *   RESEND_API_KEY            secret API key from resend.com
 *   RESEND_FROM_NAME          display name in the From header
 *                              (default: "SmartStat AI")
 *   RESEND_FROM_ADDRESS       full from address
 *                              (default: "noreply@testsmartstat.com")
 *   RESEND_REPLY_TO           optional default reply-to
 *
 * In dev, if RESEND_API_KEY is missing the helper logs the email body
 * to stderr instead of sending — that way mailing flows still work
 * locally without secrets.
 */
import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromName = process.env.RESEND_FROM_NAME ?? "SmartStat AI";
const fromAddress = process.env.RESEND_FROM_ADDRESS ?? "noreply@testsmartstat.com";
const replyTo = process.env.RESEND_REPLY_TO;

const resend = apiKey ? new Resend(apiKey) : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Override the configured from address for this single email */
  from?: string;
  /** Override the configured reply-to */
  replyTo?: string;
  /** Tags shown in the Resend dashboard for filtering / analytics */
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  delivery: "resend" | "dev-stub";
}

export async function sendEmail(
  opts: SendEmailOptions
): Promise<SendEmailResult> {
  const from = opts.from ?? `${fromName} <${fromAddress}>`;
  const reply = opts.replyTo ?? replyTo;

  if (!resend) {
    // Dev / no-key fallback — visible in the console so we don't lose info
    console.warn(
      "[email] RESEND_API_KEY missing — email NOT sent.\n",
      JSON.stringify(
        {
          from,
          to: opts.to,
          subject: opts.subject,
          replyTo: reply,
          textPreview: opts.text?.slice(0, 200),
        },
        null,
        2
      )
    );
    return { ok: true, delivery: "dev-stub" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: reply,
      tags: opts.tags,
    });
    if (error) {
      return { ok: false, error: error.message, delivery: "resend" };
    }
    return { ok: true, id: data?.id, delivery: "resend" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown send error",
      delivery: "resend",
    };
  }
}
