import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditEntry {
  id: string;
  tenantId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
}

export async function listAuditEntries(
  supabase: SupabaseClient,
  opts: {
    tenantId?: string;
    resourceType?: string;
    action?: string;
    limit?: number;
  } = {}
): Promise<AuditEntry[]> {
  let q = supabase
    .from("audit_log")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.tenantId) q = q.eq("tenant_id", opts.tenantId);
  if (opts.resourceType) q = q.eq("resource_type", opts.resourceType);
  if (opts.action) q = q.eq("action", opts.action);

  const { data, error } = await q;
  if (error) throw new Error(`listAuditEntries: ${error.message}`);

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    tenantId: (r.tenant_id as string | null) ?? null,
    actorId: (r.actor_id as string | null) ?? null,
    actorEmail: (r.actor_email as string | null) ?? null,
    action: r.action as string,
    resourceType: r.resource_type as string,
    resourceId: (r.resource_id as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    ipAddress: (r.ip_address as string | null) ?? null,
    userAgent: (r.user_agent as string | null) ?? null,
    occurredAt: r.occurred_at as string,
  }));
}
