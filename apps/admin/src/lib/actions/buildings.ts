"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createBuildingAction(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const street = String(formData.get("street") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim() || undefined;
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const country = String(formData.get("country") ?? "USA").trim();
  const lat = parseFloat(String(formData.get("latitude") ?? "0"));
  const lng = parseFloat(String(formData.get("longitude") ?? "0"));

  if (!tenantId || !name) {
    throw new Error("Tenant and name are required");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("buildings")
    .insert({
      tenant_id: tenantId,
      name,
      address: {
        street,
        city,
        state,
        postalCode,
        country,
        latitude: Number.isFinite(lat) ? lat : 0,
        longitude: Number.isFinite(lng) ? lng : 0,
      },
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      floor_count: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(`createBuilding: ${error.message}`);

  revalidatePath("/buildings");
  revalidatePath(`/tenants/${tenantId}`);
  redirect(`/buildings/${data.id}`);
}

export async function updateBuildingAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const street = String(formData.get("street") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim() || undefined;
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const country = String(formData.get("country") ?? "USA").trim();
  const lat = parseFloat(String(formData.get("latitude") ?? "0"));
  const lng = parseFloat(String(formData.get("longitude") ?? "0"));

  if (!id || !name) throw new Error("Id and name are required");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("buildings")
    .update({
      name,
      address: {
        street,
        city,
        state,
        postalCode,
        country,
        latitude: Number.isFinite(lat) ? lat : 0,
        longitude: Number.isFinite(lng) ? lng : 0,
      },
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
    })
    .eq("id", id);

  if (error) throw new Error(`updateBuilding: ${error.message}`);

  revalidatePath("/buildings");
  revalidatePath(`/buildings/${id}`);
  redirect(`/buildings/${id}`);
}
