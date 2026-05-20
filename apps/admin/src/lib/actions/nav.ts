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
