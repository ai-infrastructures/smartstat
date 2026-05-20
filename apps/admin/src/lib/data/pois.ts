import type { SupabaseClient } from "@supabase/supabase-js";
import type { Poi } from "@smartstat/shared";

function mapRow(row: Record<string, unknown>): Poi {
  return {
    id: row.id as string,
    floorId: row.floor_id as string,
    name: row.name as string,
    displayName: row.display_name as string,
    searchKeywords: (row.search_keywords as string[]) ?? [],
    category: row.category as Poi["category"],
    position: {
      x: row.position_x as number,
      y: row.position_y as number,
      z: (row.position_z as number) ?? 0,
    },
    accessibility: (row.accessibility as Poi["accessibility"]) ?? {
      wheelchairAccessible: true,
    },
    openingHours: (row.opening_hours as Poi["openingHours"]) ?? [],
    description: (row.description as string | undefined) ?? undefined,
    isActive: (row.is_active as boolean) ?? true,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listPois(
  supabase: SupabaseClient,
  opts?: { floorId?: string; tenantId?: string; activeOnly?: boolean }
): Promise<Poi[]> {
  let q = supabase.from("pois").select("*").order("display_name");
  if (opts?.floorId) q = q.eq("floor_id", opts.floorId);
  if (opts?.tenantId) q = q.eq("tenant_id", opts.tenantId);
  if (opts?.activeOnly) q = q.eq("is_active", true);

  const { data, error } = await q;
  if (error) throw new Error(`listPois: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function getPoi(
  supabase: SupabaseClient,
  id: string
): Promise<Poi | null> {
  const { data, error } = await supabase
    .from("pois")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getPoi: ${error.message}`);
  return data ? mapRow(data) : null;
}

export async function searchPois(
  supabase: SupabaseClient,
  opts: { tenantId: string; query: string; floorId?: string }
): Promise<Poi[]> {
  const { tenantId, query, floorId } = opts;
  // Use ilike on display_name and search_keywords array
  // Future improvement: leverage pg_trgm via RPC for fuzzy ranking
  let q = supabase
    .from("pois")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .or(
      `display_name.ilike.%${query}%,name.ilike.%${query}%,search_keywords.cs.{${query}}`
    )
    .limit(20);

  if (floorId) q = q.eq("floor_id", floorId);

  const { data, error } = await q;
  if (error) throw new Error(`searchPois: ${error.message}`);
  return (data ?? []).map(mapRow);
}
