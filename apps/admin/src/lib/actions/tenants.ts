"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createTenantAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const primaryColor =
    String(formData.get("primaryColor") ?? "#0066CC") || "#0066CC";
  const secondaryColor =
    String(formData.get("secondaryColor") ?? "#10B981") || "#10B981";
  const appDisplayName =
    String(formData.get("appDisplayName") ?? "").trim() || name;

  if (!name || !slug) {
    throw new Error("Name and slug are required");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .insert({
      name,
      slug,
      plan: "starter",
      locale: "en",
      branding: {
        appDisplayName,
        logoUrl: "",
        primaryColor,
        secondaryColor,
      },
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`createTenant: ${error.message}`);
  }

  revalidatePath("/tenants");
  redirect(`/tenants/${data.id}`);
}

export async function updateTenantAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const appDisplayName =
    String(formData.get("appDisplayName") ?? "").trim() || name;
  const primaryColor =
    String(formData.get("primaryColor") ?? "#0066CC") || "#0066CC";
  const secondaryColor =
    String(formData.get("secondaryColor") ?? "#10B981") || "#10B981";
  const supportEmail =
    String(formData.get("supportEmail") ?? "").trim() || null;
  const supportPhone =
    String(formData.get("supportPhone") ?? "").trim() || null;

  if (!id || !name) throw new Error("Id and name are required");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      name,
      branding: {
        appDisplayName,
        logoUrl: "",
        primaryColor,
        secondaryColor,
        supportEmail,
        supportPhone,
      },
    })
    .eq("id", id);

  if (error) throw new Error(`updateTenant: ${error.message}`);

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
  redirect(`/tenants/${id}`);
}
