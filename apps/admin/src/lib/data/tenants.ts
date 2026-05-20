/**
 * Tenant data access.
 *
 * All functions take a Supabase client (server or browser) so the same
 * functions can be called from server components, route handlers, or actions.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tenant } from "@smartstat/shared";

function mapRow(row: Record<string, unknown>): Tenant {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    plan: row.plan as Tenant["plan"],
    branding: (row.branding as Tenant["branding"]) ?? {
      appDisplayName: row.name as string,
      logoUrl: "",
      primaryColor: "#0066CC",
      secondaryColor: "#10B981",
    },
    locale: (row.locale as string) ?? "en",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listTenants(supabase: SupabaseClient): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`listTenants: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function getTenant(
  supabase: SupabaseClient,
  id: string
): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getTenant: ${error.message}`);
  return data ? mapRow(data) : null;
}

export async function getTenantStats(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ buildings: number; floors: number; pois: number }> {
  const [buildings, floors, pois] = await Promise.all([
    supabase
      .from("buildings")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("floors")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("pois")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
  ]);

  return {
    buildings: buildings.count ?? 0,
    floors: floors.count ?? 0,
    pois: pois.count ?? 0,
  };
}
