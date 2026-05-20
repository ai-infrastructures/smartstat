import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBuilding } from "@/lib/data/buildings";
import { updateBuildingAction } from "@/lib/actions/buildings";
import { PageHeader } from "@/components/PageHeader";
import { FormField, TextInput, NumberInput } from "@/components/forms";

export default async function EditBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const building = await getBuilding(supabase, id);
  if (!building) notFound();
  const a = building.address;

  return (
    <>
      <PageHeader
        title={`Edit · ${building.name}`}
        description="Update name and address."
        breadcrumbs={[
          { label: "Buildings", href: "/buildings" },
          { label: building.name, href: `/buildings/${building.id}` },
          { label: "Edit" },
        ]}
      />

      <div className="px-8 py-6">
        <form
          action={updateBuildingAction}
          className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <input type="hidden" name="id" value={building.id} />

          <FormField label="Building name" required>
            <TextInput name="name" defaultValue={building.name} required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Street">
              <TextInput name="street" defaultValue={a.street} />
            </FormField>
            <FormField label="City">
              <TextInput name="city" defaultValue={a.city} />
            </FormField>
            <FormField label="State / Region">
              <TextInput name="state" defaultValue={a.state ?? ""} />
            </FormField>
            <FormField label="Postal code">
              <TextInput name="postalCode" defaultValue={a.postalCode} />
            </FormField>
            <FormField label="Country">
              <TextInput name="country" defaultValue={a.country} />
            </FormField>
            <div />
            <FormField label="Latitude" hint="WGS84">
              <NumberInput
                name="latitude"
                step="0.0001"
                defaultValue={a.latitude}
              />
            </FormField>
            <FormField label="Longitude" hint="WGS84">
              <NumberInput
                name="longitude"
                step="0.0001"
                defaultValue={a.longitude}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Link
              href={`/buildings/${building.id}`}
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
