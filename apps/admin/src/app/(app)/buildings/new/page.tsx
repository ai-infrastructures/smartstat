import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listTenants } from "@/lib/data/tenants";
import { createBuildingAction } from "@/lib/actions/buildings";
import { FormField, TextInput, NumberInput, Select } from "@/components/forms";

export default async function NewBuildingPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const tenants = await listTenants(supabase);
  if (tenants.length === 0) redirect("/tenants/new");

  const selectedTenantId = sp.tenant ?? tenants[0]?.id;

  return (
    <>
      <PageHeader
        title="New building"
        description="Add a building to a tenant."
        breadcrumbs={[
          { label: "Buildings", href: "/buildings" },
          { label: "New" },
        ]}
      />

      <div className="px-4 py-5 md:px-8 md:py-6">
        <form
          action={createBuildingAction}
          className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <FormField label="Tenant" required>
            <Select name="tenantId" defaultValue={selectedTenantId} required>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Building name" required>
            <TextInput name="name" placeholder="Main Building" required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Street">
              <TextInput name="street" placeholder="100 Health Plaza" />
            </FormField>
            <FormField label="City">
              <TextInput name="city" placeholder="Boston" />
            </FormField>
            <FormField label="State / Region">
              <TextInput name="state" placeholder="MA" />
            </FormField>
            <FormField label="Postal code">
              <TextInput name="postalCode" placeholder="02115" />
            </FormField>
            <FormField label="Country">
              <TextInput name="country" defaultValue="USA" />
            </FormField>
            <div />
            <FormField label="Latitude" hint="WGS84">
              <NumberInput
                name="latitude"
                step="0.0001"
                placeholder="42.3360"
              />
            </FormField>
            <FormField label="Longitude" hint="WGS84">
              <NumberInput
                name="longitude"
                step="0.0001"
                placeholder="-71.1059"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Link
              href="/buildings"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create building
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
