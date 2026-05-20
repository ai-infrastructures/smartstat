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
