import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listBuildings } from "@/lib/data/buildings";
import { createFloorAction } from "@/lib/actions/floors";
import { FormField, TextInput, NumberInput, Select } from "@/components/forms";

export default async function NewFloorPage({
  searchParams,
}: {
  searchParams: Promise<{ building?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const buildings = await listBuildings(supabase);
  if (buildings.length === 0) redirect("/buildings/new");

  const selectedBuildingId = sp.building ?? buildings[0]?.id;

  return (
    <>
      <PageHeader
        title="New floor"
        description="Add a floor to a building. Set its physical size in meters."
        breadcrumbs={[
          { label: "Floors", href: "/floors" },
          { label: "New" },
        ]}
      />

      <div className="px-8 py-6">
        <form
          action={createFloorAction}
          className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <FormField label="Building" required>
            <Select
              name="buildingId"
              defaultValue={selectedBuildingId}
              required
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Level" hint="0 = ground, -1 = basement, 1+ = upper" required>
              <NumberInput name="level" defaultValue={0} step={1} required />
            </FormField>
            <FormField label="Display name" required>
              <TextInput
                name="name"
                placeholder="Ground Floor"
                required
              />
            </FormField>

            <FormField label="Width (meters)" required>
              <NumberInput name="width" defaultValue={60} step={1} min={1} required />
            </FormField>
            <FormField label="Height / depth (meters)" required>
              <NumberInput
                name="height"
                defaultValue={40}
                step={1}
                min={1}
                required
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Link
              href="/floors"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create floor
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
