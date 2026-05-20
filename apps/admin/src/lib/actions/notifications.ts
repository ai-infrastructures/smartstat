"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Send a push notification to all registered devices of users belonging to
 * a tenant. Uses the Expo Push Service (public, no API key needed for
 * basic sends). Called from the admin tenant detail page.
 *
 * HIPAA: notifications must never contain PHI. The UI restricts to short
 * generic messages.
 */
export async function sendTenantPushAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; sent?: number }> {
  const tenantId = String(formData.get("tenantId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!tenantId || !title || !body) {
    return { ok: false, error: "Tenant, title and body are required" };
  }
  if (title.length > 80 || body.length > 240) {
    return { ok: false, error: "Title ≤ 80 and body ≤ 240 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("tenant_push_tokens", {
    p_tenant_id: tenantId,
  });
  if (error) return { ok: false, error: error.message };

  const tokens = ((data ?? []) as Array<{ expo_push_token: string }>)
    .map((r) => r.expo_push_token)
    .filter(Boolean);
  if (tokens.length === 0) {
    return { ok: true, sent: 0 };
  }

  // Expo accepts up to 100 messages per request — chunk if needed.
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    chunks.push(tokens.slice(i, i + 100));
  }

  let sent = 0;
  for (const chunk of chunks) {
    const messages = chunk.map((to) => ({
      to,
      sound: "default",
      title,
      body,
    }));
    const resp = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
    if (resp.ok) sent += chunk.length;
  }

  return { ok: true, sent };
}
