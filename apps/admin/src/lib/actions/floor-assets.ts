"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ActionResult {
  ok: boolean;
  error?: string;
  url?: string;
}

/**
 * Upload a 2D floor plan image (PNG/JPG) for a floor.
 * Stored in the 'floor-plans' bucket under <tenantId>/<floorId>.<ext>
 * The URL is saved into floors.floorplan_2d_url.
 */
export async function uploadFloorPlanAction(
  formData: FormData
): Promise<ActionResult> {
  const floorId = String(formData.get("floorId") ?? "");
  const file = formData.get("file");
  if (!floorId) return { ok: false, error: "floorId required" };
  if (!(file instanceof File)) return { ok: false, error: "file required" };
  if (file.size === 0) return { ok: false, error: "empty file" };
  if (file.size > 20 * 1024 * 1024) {
    return { ok: false, error: "file too large (max 20 MB)" };
  }
  const type = file.type.toLowerCase();
  if (!type.startsWith("image/")) {
    return { ok: false, error: "must be an image (PNG/JPG/SVG)" };
  }

  const supabase = await createSupabaseServerClient();

  // Find tenant for storage path
  const { data: floor, error: fErr } = await supabase
    .from("floors")
    .select("tenant_id")
    .eq("id", floorId)
    .single();
  if (fErr) return { ok: false, error: fErr.message };

  const ext = (() => {
    if (type.includes("png")) return "png";
    if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
    if (type.includes("svg")) return "svg";
    if (type.includes("webp")) return "webp";
    return "bin";
  })();

  const path = `${floor.tenant_id}/${floorId}.${ext}`;

  // Upload (upsert overwrites previous version)
  const bytes = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from("floor-plans")
    .upload(path, bytes, {
      contentType: type,
      upsert: true,
    });
  if (upErr) return { ok: false, error: upErr.message };

  // For private bucket we need a signed URL valid long enough; for V0 we use
  // the storage path and resolve via signed URLs on read where needed.
  // Save the storage key on the floor row.
  const { error: updErr } = await supabase
    .from("floors")
    .update({ floorplan_2d_url: path })
    .eq("id", floorId);
  if (updErr) return { ok: false, error: updErr.message };

  revalidatePath(`/floors/${floorId}`);
  return { ok: true, url: path };
}

export async function removeFloorPlanAction(
  formData: FormData
): Promise<ActionResult> {
  const floorId = String(formData.get("floorId") ?? "");
  if (!floorId) return { ok: false, error: "floorId required" };

  const supabase = await createSupabaseServerClient();
  const { data: floor } = await supabase
    .from("floors")
    .select("floorplan_2d_url")
    .eq("id", floorId)
    .single();

  if (floor?.floorplan_2d_url) {
    await supabase.storage.from("floor-plans").remove([floor.floorplan_2d_url]);
  }

  const { error } = await supabase
    .from("floors")
    .update({ floorplan_2d_url: null })
    .eq("id", floorId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/floors/${floorId}`);
  return { ok: true };
}

/**
 * Get a signed URL to display a floor plan image (private bucket).
 */
export async function getFloorPlanSignedUrl(
  floorId: string
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: floor } = await supabase
    .from("floors")
    .select("floorplan_2d_url")
    .eq("id", floorId)
    .single();
  if (!floor?.floorplan_2d_url) return null;

  const { data, error } = await supabase.storage
    .from("floor-plans")
    .createSignedUrl(floor.floorplan_2d_url, 60 * 60); // 1 hour
  if (error) return null;
  return data?.signedUrl ?? null;
}
