import type { SupabaseClient } from "@supabase/supabase-js";
import type { Floor } from "@smartstat/shared";

function mapRow(row: Record<string, unknown>): Floor {
  return {
    id: row.id as string,
    buildingId: row.building_id as string,
    level: row.level as number,
    name: row.name as string,
    meshUrl: (row.mesh_url as string | null) ?? null,
    floorplan2dUrl: (row.floorplan_2d_url as string | null) ?? null,
    bbox: (row.bbox as Floor["bbox"]) ?? null,
    scanStatus: row.scan_status as Floor["scanStatus"],
    scannedAt: (row.scanned_at as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listFloors(
  supabase: SupabaseClient,
  opts?: { buildingId?: string; tenantId?: string }
): Promise<Floor[]> {
  let q = supabase.from("floors").select("*").order("level", { ascending: true });
  if (opts?.buildingId) q = q.eq("building_id", opts.buildingId);
  if (opts?.tenantId) q = q.eq("tenant_id", opts.tenantId);

  const { data, error } = await q;
  if (error) throw new Error(`listFloors: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function getFloor(
  supabase: SupabaseClient,
  id: string
): Promise<Floor | null> {
  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getFloor: ${error.message}`);
  return data ? mapRow(data) : null;
}
