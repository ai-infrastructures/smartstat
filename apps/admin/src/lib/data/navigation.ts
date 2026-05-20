import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavNode, NavEdge } from "@smartstat/shared";

function mapNode(row: Record<string, unknown>): NavNode {
  return {
    id: row.id as string,
    floorId: row.floor_id as string,
    type: row.type as NavNode["type"],
    position: {
      x: row.position_x as number,
      y: row.position_y as number,
      z: (row.position_z as number) ?? 0,
    },
    poiId: (row.poi_id as string | undefined) ?? undefined,
    qrCode: (row.qr_code as string | undefined) ?? undefined,
    interFloorLinkId:
      (row.inter_floor_link_id as string | undefined) ?? undefined,
  };
}

function mapEdge(row: Record<string, unknown>): NavEdge {
  return {
    id: row.id as string,
    fromNodeId: row.from_node_id as string,
    toNodeId: row.to_node_id as string,
    distance: row.distance_meters as number,
    wheelchairAccessible: (row.wheelchair_accessible as boolean) ?? true,
    oneWay: (row.one_way as boolean) ?? false,
    source: (row.source as NavEdge["source"]) ?? "auto",
  };
}

export async function listNavNodes(
  supabase: SupabaseClient,
  opts: { floorId: string }
): Promise<NavNode[]> {
  const { data, error } = await supabase
    .from("nav_nodes")
    .select("*")
    .eq("floor_id", opts.floorId);

  if (error) throw new Error(`listNavNodes: ${error.message}`);
  return (data ?? []).map(mapNode);
}

export async function listNavEdges(
  supabase: SupabaseClient,
  opts: { nodeIds: string[] }
): Promise<NavEdge[]> {
  if (opts.nodeIds.length === 0) return [];
  const { data, error } = await supabase
    .from("nav_edges")
    .select("*")
    .in("from_node_id", opts.nodeIds);

  if (error) throw new Error(`listNavEdges: ${error.message}`);
  return (data ?? []).map(mapEdge);
}
