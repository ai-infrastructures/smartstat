"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function generateAnchorCode(prefix = "SS"): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function createWaypointAction(
  formData: FormData
): Promise<ActionResult> {
  const floorId = String(formData.get("floorId") ?? "");
  const x = parseFloat(String(formData.get("x") ?? ""));
  const y = parseFloat(String(formData.get("y") ?? ""));
  if (!floorId || !Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, error: "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_nav_node", {
    p_floor_id: floorId,
    p_type: "waypoint",
    p_x: x,
    p_y: y,
    p_qr_code: null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/floors/${floorId}`);
  return { ok: true, id: data as string };
}

export async function createQrAnchorAction(
  formData: FormData
): Promise<ActionResult> {
  const floorId = String(formData.get("floorId") ?? "");
  const x = parseFloat(String(formData.get("x") ?? ""));
  const y = parseFloat(String(formData.get("y") ?? ""));
  if (!floorId || !Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, error: "Invalid input" };
  }

  const code = generateAnchorCode();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_nav_node", {
    p_floor_id: floorId,
    p_type: "qr_anchor",
    p_x: x,
    p_y: y,
    p_qr_code: code,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/floors/${floorId}`);
  return { ok: true, id: data as string };
}

export async function deleteNavNodeAction(
  formData: FormData
): Promise<ActionResult> {
  const nodeId = String(formData.get("nodeId") ?? "");
  const floorId = String(formData.get("floorId") ?? "");
  if (!nodeId) return { ok: false, error: "nodeId required" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_nav_node", {
    p_node_id: nodeId,
  });
  if (error) return { ok: false, error: error.message };

  if (floorId) revalidatePath(`/floors/${floorId}`);
  return { ok: true };
}

export async function moveNavNodeAction(
  formData: FormData
): Promise<ActionResult> {
  const nodeId = String(formData.get("nodeId") ?? "");
  const floorId = String(formData.get("floorId") ?? "");
  const x = parseFloat(String(formData.get("x") ?? ""));
  const y = parseFloat(String(formData.get("y") ?? ""));
  if (!nodeId || !Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, error: "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("nav_nodes")
    .update({ position_x: x, position_y: y })
    .eq("id", nodeId);
  if (error) return { ok: false, error: error.message };

  if (floorId) revalidatePath(`/floors/${floorId}`);
  return { ok: true };
}

export async function regenerateFloorGraphAction(
  formData: FormData
): Promise<ActionResult> {
  const floorId = String(formData.get("floorId") ?? "");
  if (!floorId) return { ok: false, error: "floorId required" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("regenerate_floor_graph", {
    p_floor_id: floorId,
    k: 3,
    max_distance_m: 15.0,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/floors/${floorId}`);
  return { ok: true };
}

export async function createEdgeAction(
  formData: FormData
): Promise<ActionResult> {
  const fromNodeId = String(formData.get("fromNodeId") ?? "");
  const toNodeId = String(formData.get("toNodeId") ?? "");
  const floorId = String(formData.get("floorId") ?? "");
  const wheelchair = String(formData.get("wheelchair") ?? "true") === "true";
  if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) {
    return { ok: false, error: "Two different node ids required" };
  }

  const supabase = await createSupabaseServerClient();

  // Look up tenant_id and coordinates to compute distance
  const { data: nodes, error: nErr } = await supabase
    .from("nav_nodes")
    .select("id, tenant_id, position_x, position_y, position_z")
    .in("id", [fromNodeId, toNodeId]);
  if (nErr) return { ok: false, error: nErr.message };
  if (!nodes || nodes.length !== 2) {
    return { ok: false, error: "Nodes not found" };
  }
  const a = nodes.find((n) => n.id === fromNodeId)!;
  const b = nodes.find((n) => n.id === toNodeId)!;
  const dx = a.position_x - b.position_x;
  const dy = a.position_y - b.position_y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Insert both directions to keep graph symmetric (cheaper than relying on bidir flag)
  const rows = [
    {
      tenant_id: a.tenant_id,
      from_node_id: fromNodeId,
      to_node_id: toNodeId,
      distance_meters: distance,
      wheelchair_accessible: wheelchair,
      one_way: false,
      source: "manual",
    },
    {
      tenant_id: a.tenant_id,
      from_node_id: toNodeId,
      to_node_id: fromNodeId,
      distance_meters: distance,
      wheelchair_accessible: wheelchair,
      one_way: false,
      source: "manual",
    },
  ];

  const { error: eErr } = await supabase
    .from("nav_edges")
    .upsert(rows, { onConflict: "from_node_id,to_node_id", ignoreDuplicates: true });
  if (eErr) return { ok: false, error: eErr.message };

  if (floorId) revalidatePath(`/floors/${floorId}`);
  return { ok: true };
}

export async function deleteEdgeAction(
  formData: FormData
): Promise<ActionResult> {
  const fromNodeId = String(formData.get("fromNodeId") ?? "");
  const toNodeId = String(formData.get("toNodeId") ?? "");
  const floorId = String(formData.get("floorId") ?? "");
  if (!fromNodeId || !toNodeId) {
    return { ok: false, error: "Two node ids required" };
  }

  const supabase = await createSupabaseServerClient();
  // Delete both directions
  const { error } = await supabase
    .from("nav_edges")
    .delete()
    .or(
      `and(from_node_id.eq.${fromNodeId},to_node_id.eq.${toNodeId}),and(from_node_id.eq.${toNodeId},to_node_id.eq.${fromNodeId})`
    );
  if (error) return { ok: false, error: error.message };

  if (floorId) revalidatePath(`/floors/${floorId}`);
  return { ok: true };
}
