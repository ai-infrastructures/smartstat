import { supabase } from "../supabase/client";
import {
  buildingCache,
  floorCache,
  tenantsCache,
} from "../offlineCache";
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
  try {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("name");
    if (error) throw error;
    const tenants = (data ?? []).map(mapTenant);
    // Fire-and-forget cache write so the next cold-start offline still works
    tenantsCache.write(tenants).catch(() => {});
    return tenants;
  } catch (err) {
    const cached = await tenantsCache.read();
    if (cached && cached.length > 0) return cached;
    throw err;
  }
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

export async function listFloorsForBuilding(buildingId: string): Promise<Floor[]> {
  try {
    const { data, error } = await supabase
      .from("floors")
      .select("*")
      .eq("building_id", buildingId)
      .eq("scan_status", "published")
      .order("level", { ascending: false });
    if (error) throw error;
    const floors = (data ?? []).map(mapFloor);
    // Update the building cache opportunistically
    const cached = await buildingCache.read(buildingId).catch(() => null);
    if (cached) {
      buildingCache
        .write({ building: cached.building, floors })
        .catch(() => {});
    }
    return floors;
  } catch (err) {
    const cached = await buildingCache.read(buildingId);
    if (cached) return cached.floors;
    throw err;
  }
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
  // Use the trigram-scored RPC for ranked results
  const { data, error } = await supabase.rpc("search_pois_fuzzy", {
    p_tenant_id: opts.tenantId,
    p_query: opts.query,
    p_building_id: opts.buildingId ?? null,
    p_limit: 30,
  });
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => mapPoi(r));
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

/**
 * Look up a QR anchor by its code. Returns the node + the floor + the
 * building + the tenant so the app can deep-link into navigation.
 */
export async function findQrAnchor(qrCode: string): Promise<
  | {
      node: NavNode;
      floor: Floor;
      building: Building;
      tenant: Tenant;
    }
  | null
> {
  const { data: nodeRow, error: nErr } = await supabase
    .from("nav_nodes")
    .select("*")
    .eq("qr_code", qrCode)
    .eq("type", "qr_anchor")
    .maybeSingle();
  if (nErr || !nodeRow) return null;

  const node = mapNavNode(nodeRow);
  const floor = await getFloor(node.floorId);
  if (!floor) return null;
  const building = await getBuilding(floor.buildingId);
  if (!building) return null;
  const tenant = await getTenant(building.tenantId);
  if (!tenant) return null;

  return { node, floor, building, tenant };
}

/**
 * Get a signed URL to display a floor plan image (private bucket).
 * Returns null if no floor plan uploaded.
 */
export async function getFloorPlanUrl(
  floorPlanKey: string | null
): Promise<string | null> {
  if (!floorPlanKey) return null;
  const { data, error } = await supabase.storage
    .from("floor-plans")
    .createSignedUrl(floorPlanKey, 60 * 60); // 1h
  if (error) return null;
  return data?.signedUrl ?? null;
}

/**
 * Fetch a complete navigation bundle for a floor in one call, with offline
 * cache fallback. Used by the Navigate screen so the user can still see
 * their map and route even with no connectivity.
 */
export async function getFloorBundle(floorId: string): Promise<{
  floor: Floor | null;
  pois: Poi[];
  nodes: NavNode[];
  edges: NavEdge[];
  fromCache: boolean;
}> {
  try {
    const [floor, pois, graph] = await Promise.all([
      getFloor(floorId),
      listPoisForFloor(floorId),
      getFloorGraph(floorId),
    ]);
    if (floor) {
      floorCache
        .write({ floor, pois, nodes: graph.nodes, edges: graph.edges })
        .catch(() => {});
    }
    return { floor, pois, nodes: graph.nodes, edges: graph.edges, fromCache: false };
  } catch (err) {
    const snap = await floorCache.read(floorId);
    if (snap) {
      return {
        floor: snap.floor,
        pois: snap.pois,
        nodes: snap.nodes,
        edges: snap.edges,
        fromCache: true,
      };
    }
    throw err;
  }
}

/**
 * Floors that the signed-in scanner operator is allowed to upload scans for.
 * RLS already restricts this to the operator's own tenant.
 */
export async function listFloorsForScanner(): Promise<Floor[]> {
  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .order("building_id")
    .order("level");
  if (error) throw error;
  return (data ?? []).map(mapFloor);
}

/**
 * Upload a .glb mesh to floor-meshes/<tenant_id>/<floor_id>.glb and update
 * the floor's mesh_url + scan_status='uploaded'. Caller must be auth'd and
 * have scanner_operator (or higher) on the tenant that owns the floor.
 */
export async function uploadFloorMesh(opts: {
  floorId: string;
  tenantId: string;
  file: { uri: string; name: string; mimeType?: string };
}): Promise<{ path: string }> {
  const { floorId, tenantId, file } = opts;

  const ext = (file.name.split(".").pop() ?? "glb").toLowerCase();
  const path = `${tenantId}/${floorId}.${ext}`;

  const resp = await fetch(file.uri);
  const blob = await resp.blob();

  const { error: upErr } = await supabase.storage
    .from("floor-meshes")
    .upload(path, blob, {
      contentType: file.mimeType ?? "model/gltf-binary",
      upsert: true,
    });
  if (upErr) throw upErr;

  const { error: dbErr } = await supabase
    .from("floors")
    .update({
      mesh_url: path,
      scan_status: "uploaded",
      scanned_at: new Date().toISOString(),
    })
    .eq("id", floorId);
  if (dbErr) throw dbErr;

  return { path };
}

/**
 * Upload a 2D floor plan image to floor-plans/<tenant>/<floor>.<ext>
 * and update floor.floorplan_2d_url. The image is shown as the
 * background of the admin floor editor — operators overlay POIs on top.
 */
export async function uploadFloorPlan(opts: {
  floorId: string;
  tenantId: string;
  file: { uri: string; name: string; mimeType?: string };
}): Promise<{ path: string }> {
  const { floorId, tenantId, file } = opts;
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const path = `${tenantId}/${floorId}.${ext}`;

  const resp = await fetch(file.uri);
  const blob = await resp.blob();

  const inferred =
    ext === "pdf"
      ? "application/pdf"
      : ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : "image/png";

  const { error: upErr } = await supabase.storage
    .from("floor-plans")
    .upload(path, blob, {
      contentType: file.mimeType ?? inferred,
      upsert: true,
    });
  if (upErr) throw upErr;

  const { error: dbErr } = await supabase
    .from("floors")
    .update({ floorplan_2d_url: path })
    .eq("id", floorId);
  if (dbErr) throw dbErr;

  return { path };
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
