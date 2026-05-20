import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listTenants } from "@/lib/data/tenants";
import { listBuildings } from "@/lib/data/buildings";
import { listFloors } from "@/lib/data/floors";
import { PageHeader } from "@/components/PageHeader";
import { NewMapWizard } from "@/components/NewMapWizard";

export const dynamic = "force-dynamic";

/**
 * Guided 5-step wizard for first-time admins. Walks through tenant →
 * building → floor → upload → publish. Each step shows context (lists
 * of already-existing entities) so the user can pick instead of create.
 */
export default async function NewMapPage() {
  const supabase = await createSupabaseServerClient();
  const [tenants, buildings, floors] = await Promise.all([
    listTenants(supabase),
    listBuildings(supabase),
    listFloors(supabase),
  ]);

  return (
    <>
      <PageHeader
        title="New map"
        description="Guided setup to publish a new floor map end-to-end."
        breadcrumbs={[{ label: "New map" }]}
      />
      <div className="px-4 py-5 md:px-8 md:py-6">
        <NewMapWizard
          initialTenants={tenants}
          initialBuildings={buildings}
          initialFloors={floors}
        />
      </div>
    </>
  );
}
