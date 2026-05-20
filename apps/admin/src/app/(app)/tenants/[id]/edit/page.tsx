import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/data/tenants";
import { updateTenantAction } from "@/lib/actions/tenants";
import { PageHeader } from "@/components/PageHeader";
import { FormField, TextInput, ColorInput } from "@/components/forms";

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const tenant = await getTenant(supabase, id);
  if (!tenant) notFound();

  return (
    <>
      <PageHeader
        title={`Edit · ${tenant.name}`}
        description="Update branding, support contacts, and display name."
        breadcrumbs={[
          { label: "Tenants", href: "/tenants" },
          { label: tenant.name, href: `/tenants/${tenant.id}` },
          { label: "Edit" },
        ]}
      />

      <div className="px-4 py-5 md:px-8 md:py-6">
        <form
          action={updateTenantAction}
          className="max-w-2xl space-y-5 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <input type="hidden" name="id" value={tenant.id} />

          <FormField label="Hospital name" required>
            <TextInput
              name="name"
              defaultValue={tenant.name}
              required
            />
          </FormField>

          <FormField label="App display name">
            <TextInput
              name="appDisplayName"
              defaultValue={tenant.branding.appDisplayName}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Primary color">
              <ColorInput
                name="primaryColor"
                defaultValue={tenant.branding.primaryColor}
              />
            </FormField>
            <FormField label="Secondary color">
              <ColorInput
                name="secondaryColor"
                defaultValue={tenant.branding.secondaryColor}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Support email">
              <TextInput
                name="supportEmail"
                type="email"
                defaultValue={tenant.branding.supportEmail ?? ""}
              />
            </FormField>
            <FormField label="Support phone">
              <TextInput
                name="supportPhone"
                defaultValue={tenant.branding.supportPhone ?? ""}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Link
              href={`/tenants/${tenant.id}`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
