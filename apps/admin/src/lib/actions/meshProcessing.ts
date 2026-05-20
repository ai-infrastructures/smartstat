"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateFloorPlanFromGlb } from "@/lib/meshProcessor";

/**
 * Trigger the server-side mesh → 2D floor plan pipeline for a given floor.
 *
 * Flow:
 *  1. Read floor row (and verify it has a mesh_url)
 *  2. Download the GLB from `floor-meshes/<tenant>/<floor>.glb`
 *  3. Pipe through meshProcessor.generateFloorPlanFromGlb()
 *  4. Upload the resulting PNG to `floor-plans/<tenant>/<floor>.png`
 *  5. Update floors.floorplan_2d_url + bbox (so the Floor Editor scales
 *     correctly to the building's real dimensions)
 *
 * Caller must be authenticated as a tenant_admin (of the floor's tenant)
 * or super_admin. RLS already enforces this on the floors row read.
 */
export async function processMeshAction(
  formData: FormData
): Promise<{
  ok: boolean;
  error?: string;
  edges?: number;
  widthMeters?: number;
  depthMeters?: number;
}> {
  const floorId = String(formData.get("floorId") ?? "");
  if (!floorId) return { ok: false, error: "floorId required" };

  const supabase = await createSupabaseServerClient();

  // Fetch the floor + its mesh path
  const { data: floor, error: fErr } = await supabase
    .from("floors")
    .select("id, mesh_url, tenant_id")
    .eq("id", floorId)
    .maybeSingle();
  if (fErr) return { ok: false, error: fErr.message };
  if (!floor) return { ok: false, error: "Floor not found" };
  if (!floor.mesh_url) {
    return {
      ok: false,
      error: "This floor has no uploaded mesh yet. Upload a .glb first.",
    };
  }

  // Download the mesh from storage
  const { data: meshBlob, error: dlErr } = await supabase.storage
    .from("floor-meshes")
    .download(floor.mesh_url);
  if (dlErr) return { ok: false, error: `Mesh download: ${dlErr.message}` };

  const meshBytes = Buffer.from(await meshBlob.arrayBuffer());
  let plan;
  try {
    plan = await generateFloorPlanFromGlb(meshBytes);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Mesh processing failed",
    };
  }

  // Upload the PNG
  const planPath = `${floor.tenant_id}/${floor.id}.png`;
  const { error: upErr } = await supabase.storage
    .from("floor-plans")
    .upload(planPath, plan.pngBuffer, {
      contentType: "image/png",
      upsert: true,
    });
  if (upErr) return { ok: false, error: `PNG upload: ${upErr.message}` };

  // Update the floor row with the plan url + real-world dimensions
  const { error: updErr } = await supabase
    .from("floors")
    .update({
      floorplan_2d_url: planPath,
      bbox: [0, 0, plan.widthMeters, plan.depthMeters],
    })
    .eq("id", floorId);
  if (updErr) return { ok: false, error: `Floor update: ${updErr.message}` };

  revalidatePath(`/floors/${floorId}`);
  revalidatePath("/floors");

  return {
    ok: true,
    edges: plan.edgeCount,
    widthMeters: plan.widthMeters,
    depthMeters: plan.depthMeters,
  };
}
