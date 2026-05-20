"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PoiCategory } from "@smartstat/shared";

const VALID_CATEGORIES: PoiCategory[] = [
  "department",
  "clinic",
  "room",
  "counter",
  "elevator",
  "stairs",
  "restroom",
  "pharmacy",
  "emergency",
  "cafeteria",
  "parking_entry",
  "entrance",
  "exit",
  "other",
];

function parseCategory(raw: string): PoiCategory {
  return (VALID_CATEGORIES as string[]).includes(raw)
    ? (raw as PoiCategory)
    : "other";
}

export async function createPoiAction(formData: FormData) {
  const floorId = String(formData.get("floorId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || displayName;
  const category = parseCategory(String(formData.get("category") ?? "other"));
  const x = parseFloat(String(formData.get("x") ?? "0"));
  const y = parseFloat(String(formData.get("y") ?? "0"));
  const keywordsRaw = String(formData.get("keywords") ?? "");
  const wheelchair = String(formData.get("wheelchair") ?? "true") === "true";
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!floorId || !displayName) {
    return { ok: false, error: "Floor and name are required" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: floor, error: fErr } = await supabase
    .from("floors")
    .select("tenant_id")
    .eq("id", floorId)
    .single();
  if (fErr) return { ok: false, error: fErr.message };

  const keywords = keywordsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { data, error } = await supabase
    .from("pois")
    .insert({
      floor_id: floorId,
      tenant_id: floor.tenant_id,
      name,
      display_name: displayName,
      search_keywords: keywords,
      category,
      position_x: Number.isFinite(x) ? x : 0,
      position_y: Number.isFinite(y) ? y : 0,
      position_z: 0,
      accessibility: { wheelchairAccessible: wheelchair },
      opening_hours: [],
      description,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  // Create the attached nav_node for pathfinding
  const { data: nodeRow } = await supabase
    .from("nav_nodes")
    .insert({
      floor_id: floorId,
      tenant_id: floor.tenant_id,
      type: "poi",
      position_x: Number.isFinite(x) ? x : 0,
      position_y: Number.isFinite(y) ? y : 0,
      position_z: 0,
      poi_id: data.id,
    })
    .select("id")
    .single();

  // Auto-connect the new node to its nearest neighbors so the POI is reachable
  if (nodeRow?.id) {
    await supabase.rpc("connect_node_to_nearest", {
      p_node_id: nodeRow.id,
      k: 2,
      max_distance_m: 20.0,
    });
  }

  revalidatePath(`/floors/${floorId}`);
  revalidatePath("/pois");
  return { ok: true, id: data.id };
}

export async function movePoiAction(formData: FormData) {
  const poiId = String(formData.get("poiId") ?? "");
  const x = parseFloat(String(formData.get("x") ?? "0"));
  const y = parseFloat(String(formData.get("y") ?? "0"));
  if (!poiId || !Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, error: "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: poi, error: pErr } = await supabase
    .from("pois")
    .update({ position_x: x, position_y: y })
    .eq("id", poiId)
    .select("floor_id")
    .single();
  if (pErr) return { ok: false, error: pErr.message };

  // Move the attached nav node too
  await supabase
    .from("nav_nodes")
    .update({ position_x: x, position_y: y })
    .eq("poi_id", poiId);

  revalidatePath(`/floors/${poi.floor_id}`);
  return { ok: true };
}

export async function deletePoiAction(formData: FormData) {
  const poiId = String(formData.get("poiId") ?? "");
  if (!poiId) return { ok: false, error: "POI id required" };

  const supabase = await createSupabaseServerClient();
  const { data: poi } = await supabase
    .from("pois")
    .select("floor_id")
    .eq("id", poiId)
    .single();

  const { error } = await supabase.from("pois").delete().eq("id", poiId);
  if (error) return { ok: false, error: error.message };

  if (poi?.floor_id) {
    revalidatePath(`/floors/${poi.floor_id}`);
  }
  revalidatePath("/pois");
  return { ok: true };
}

export async function updatePoiAction(formData: FormData) {
  const poiId = String(formData.get("poiId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const category = parseCategory(String(formData.get("category") ?? "other"));
  const keywordsRaw = String(formData.get("keywords") ?? "");
  const wheelchair = String(formData.get("wheelchair") ?? "true") === "true";
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!poiId || !displayName) {
    return { ok: false, error: "Name is required" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pois")
    .update({
      display_name: displayName,
      name: displayName,
      category,
      search_keywords: keywordsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      accessibility: { wheelchairAccessible: wheelchair },
      description,
    })
    .eq("id", poiId)
    .select("floor_id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/floors/${data.floor_id}`);
  revalidatePath("/pois");
  return { ok: true };
}
