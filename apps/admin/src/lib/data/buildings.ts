import type { SupabaseClient } from "@supabase/supabase-js";
import type { Building } from "@smartstat/shared";

function mapRow(row: Record<string, unknown>): Building {
  const addr = (row.address as Building["address"]) ?? {
    street: "",
    city: "",
    postalCode: "",
    country: "",
    latitude: 0,
    longitude: 0,
  };
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    address: addr,
    floorCount: (row.floor_count as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listBuildings(
  supabase: SupabaseClient,
  opts?: { tenantId?: string }
): Promise<Building[]> {
  let q = supabase.from("buildings").select("*").order("name");
  if (opts?.tenantId) q = q.eq("tenant_id", opts.tenantId);

  const { data, error } = await q;
  if (error) throw new Error(`listBuildings: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function getBuilding(
  supabase: SupabaseClient,
  id: string
): Promise<Building | null> {
  const { data, error } = await supabase
    .from("buildings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getBuilding: ${error.message}`);
  return data ? mapRow(data) : null;
}
