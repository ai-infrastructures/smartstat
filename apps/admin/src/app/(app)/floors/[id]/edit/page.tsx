import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFloor } from "@/lib/data/floors";
import { updateFloorAction } from "@/lib/actions/floors";
import { PageHeader } from "@/components/PageHeader";
import { FormField, TextInput, NumberInput } from "@/components/forms";

export default async function EditFloorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const floor = await getFloor(supabase, id);
  if (!floor) notFound();

  const w = floor.bbox ? floor.bbox[2] - floor.bbox[0] : 60;
  const h = floor.bbox ? floor.bbox[3] - floor.bbox[1] : 40;

  return (
    <>
      <PageHeader
        title={`Edit · ${floor.name}`}
        description="Update level, name and physical dimensions."
        breadcrumbs={[
          { label: "Floors", href: "/floors" },
          { label: floor.name, href: `/floors/${floor.id}` },
          { label: "Edit" },
        ]}
      />

      <div className="px-8 py-6">
        <form
          action={updateFloorAction}
          className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <input type="hidden" name="id" value={floor.id} />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Level"
              hint="0 = ground, -1 = basement, 1+ = upper"
              required
            >
              <NumberInput
                name="level"
                defaultValue={floor.level}
                step={1}
                required
              />
            </FormField>
            <FormField label="Display name" required>
              <TextInput name="name" defaultValue={floor.name} required />
            </FormField>
            <FormField label="Width (meters)" required>
              <NumberInput
                name="width"
                defaultValue={w}
                step={1}
                min={1}
                required
              />
            </FormField>
            <FormField label="Height / depth (meters)" required>
              <NumberInput
                name="height"
                defaultValue={h}
                step={1}
                min={1}
                required
              />
            </FormField>
          </div>

          <p className="text-xs text-slate-500">
            Changing the dimensions does not move existing POIs. Verify
            positions after resizing.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <a
              href={`/floors/${floor.id}`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </a>
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
