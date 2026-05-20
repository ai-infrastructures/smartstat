import { supabase } from "../supabase/client";
import type {
  Tenant,
  Building,
  Floor,
  Poi,
  NavNode,
  NavEdge,
} from "@smartstat/shared";

function mapTenant(r: Record<string, unknown>): Tenant {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    plan: r.plan as Tenant["plan"],
    branding: (r.branding as Tenant["branding"]) ?? {
      appDisplayName: r.name as string,
      logoUrl: "",
      primaryColor: "#0066CC",
      secondaryColor: "#10B981",
    },
    locale: (r.locale as string) ?? "en",
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapBuilding(r: Record<string, unknown>): Building {
  return {
    id: r.id as string,
    tenantId: r.tenant_id as string,
    name: r.name as string,
    address: r.address as Building["address"],
    floorCount: (r.floor_count as number) ?? 0,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapFloor(r: Record<string, unknown>): Floor {
  return {
    id: r.id as string,
    buildingId: r.building_id as string,
    level: r.level as number,
    name: r.name as string,
    meshUrl: (r.mesh_url as string | null) ?? null,
    floorplan2dUrl: (r.floorplan_2d_url as string | null) ?? null,
    bbox: (r.bbox as Floor["bbox"]) ?? null,
    scanStatus: r.scan_status as Floor["scanStatus"],
    scannedAt: (r.scanned_at as string | null) ?? null,
    publishedAt: (r.published_at as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapPoi(r: Record<string, unknown>): Poi {
  return {
    id: r.id as string,
    floorId: r.floor_id as string,
    name: r.name as string,
    displayName: r.display_name as string,
    searchKeywords: (r.search_keywords as string[]) ?? [],
    category: r.category as Poi["category"],
    position: {
      x: r.position_x as number,
      y: r.position_y as number,
      z: (r.position_z as number) ?? 0,
    },
    accessibility: (r.accessibility as Poi["accessibility"]) ?? {
      wheelchairAccessible: true,
    },
    openingHours: (r.opening_hours as Poi["openingHours"]) ?? [],
    description: (r.description as string | undefined) ?? undefined,
    isActive: (r.is_active as boolean) ?? true,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapNavNode(r: Record<string, unknown>): NavNode {
  return {
    id: r.id as string,
    floorId: r.floor_id as string,
    type: r.type as NavNode["type"],
    position: {
      x: r.position_x as number,
      y: r.position_y as number,
      z: (r.position_z as number) ?? 0,
    },
    poiId: (r.poi_id as string | undefined) ?? undefined,
    qrCode: (r.qr_code as string | undefined) ?? undefined,
    interFloorLinkId:
      (r.inter_floor_link_id as string | undefined) ?? undefined,
  };
}

function mapNavEdge(r: Record<string, unknown>): NavEdge {
  return {
    id: r.id as string,
    fromNodeId: r.from_node_id as string,
    toNodeId: r.to_node_id as string,
    distance: r.distance_meters as number,
    wheelchairAccessible: (r.wheelchair_accessible as boolean) ?? true,
    oneWay: (r.one_way as boolean) ?? false,
  };
}

export async function listTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapTenant);
}

export async function getTenant(id: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTenant(data) : null;
}

export async function listBuildingsForTenant(
  tenantId: string
): Promise<Building[]> {
  const { data, error } = await supabase
    .from("buildings")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapBuilding);
}

export async function getBuilding(id: string): Promise<Building | null> {
  const { data, error } = await supabase
    .from("buildings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBuilding(data) : null;
}

export async function listPublishedFloors(buildingId: string): Promise<Floor[]> {
  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .eq("building_id", buildingId)
    .eq("scan_status", "published")
    .order("level");
  if (error) throw error;
  return (data ?? []).map(mapFloor);
}

export async function getFloor(id: string): Promise<Floor | null> {
  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapFloor(data) : null;
}

export async function searchPois(opts: {
  tenantId: string;
  query: string;
  buildingId?: string;
}): Promise<Poi[]> {
  let q = supabase
    .from("pois")
    .select("*")
    .eq("tenant_id", opts.tenantId)
    .eq("is_active", true)
    .limit(20);

  if (opts.query.trim().length > 0) {
    const safe = opts.query.replace(/[%_,]/g, "");
    q = q.or(`display_name.ilike.%${safe}%,name.ilike.%${safe}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapPoi);
}

export async function listPoisForFloor(floorId: string): Promise<Poi[]> {
  const { data, error } = await supabase
    .from("pois")
    .select("*")
    .eq("floor_id", floorId)
    .eq("is_active", true)
    .order("display_name");
  if (error) throw error;
  return (data ?? []).map(mapPoi);
}

export async function getPoi(id: string): Promise<Poi | null> {
  const { data, error } = await supabase
    .from("pois")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPoi(data) : null;
}

export async function getFloorGraph(
  floorId: string
): Promise<{ nodes: NavNode[]; edges: NavEdge[] }> {
  const { data: nodeRows, error: nodeErr } = await supabase
    .from("nav_nodes")
    .select("*")
    .eq("floor_id", floorId);
  if (nodeErr) throw nodeErr;
  const nodes = (nodeRows ?? []).map(mapNavNode);

  if (nodes.length === 0) return { nodes: [], edges: [] };

  const { data: edgeRows, error: edgeErr } = await supabase
    .from("nav_edges")
    .select("*")
    .in(
      "from_node_id",
      nodes.map((n) => n.id)
    );
  if (edgeErr) throw edgeErr;
  const edges = (edgeRows ?? []).map(mapNavEdge);

  return { nodes, edges };
}

export async function logSearchEvent(opts: {
  tenantId: string;
  query: string;
  buildingId?: string;
  floorId?: string;
  resultPoiId?: string;
}): Promise<void> {
  // Fire and forget - never block UI on analytics
  await supabase.from("search_events").insert({
    tenant_id: opts.tenantId,
    building_id: opts.buildingId ?? null,
    floor_id: opts.floorId ?? null,
    query: opts.query,
    result_poi_id: opts.resultPoiId ?? null,
  });
}
