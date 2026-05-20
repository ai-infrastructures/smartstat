"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createFloorAction(formData: FormData): Promise<void> {
  const buildingId = String(formData.get("buildingId") ?? "");
  const level = parseInt(String(formData.get("level") ?? "0"), 10);
  const name = String(formData.get("name") ?? "").trim();
  const width = parseFloat(String(formData.get("width") ?? "60"));
  const height = parseFloat(String(formData.get("height") ?? "40"));

  if (!buildingId || !name) {
    throw new Error("Building and name are required");
  }

  const supabase = await createSupabaseServerClient();

  const { data: building, error: bErr } = await supabase
    .from("buildings")
    .select("tenant_id")
    .eq("id", buildingId)
    .single();
  if (bErr) throw new Error(`createFloor: ${bErr.message}`);

  const safeW = Number.isFinite(width) && width > 0 ? width : 60;
  const safeH = Number.isFinite(height) && height > 0 ? height : 40;

  const { data, error } = await supabase
    .from("floors")
    .insert({
      building_id: buildingId,
      tenant_id: building.tenant_id,
      level: Number.isFinite(level) ? level : 0,
      name,
      bbox: [0, 0, safeW, safeH],
      scan_status: "draft",
    })
    .select("id")
    .single();

  if (error) throw new Error(`createFloor: ${error.message}`);

  // Bump floor_count on the building
  const { count } = await supabase
    .from("floors")
    .select("id", { count: "exact", head: true })
    .eq("building_id", buildingId);

  await supabase
    .from("buildings")
    .update({ floor_count: count ?? 1 })
    .eq("id", buildingId);

  revalidatePath(`/buildings/${buildingId}`);
  revalidatePath("/floors");
  redirect(`/floors/${data.id}`);
}

export async function publishFloorAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const floorId = String(formData.get("floorId") ?? "");
  if (!floorId) return { ok: false, error: "Floor id required" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("floors")
    .update({
      scan_status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", floorId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/floors/${floorId}`);
  revalidatePath("/floors");
  return { ok: true };
}

export async function unpublishFloorAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const floorId = String(formData.get("floorId") ?? "");
  if (!floorId) return { ok: false, error: "Floor id required" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("floors")
    .update({ scan_status: "draft", published_at: null })
    .eq("id", floorId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/floors/${floorId}`);
  revalidatePath("/floors");
  return { ok: true };
}
