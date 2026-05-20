import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFloor } from "@/lib/data/floors";
import { getBuilding } from "@/lib/data/buildings";
import { getTenant } from "@/lib/data/tenants";
import { listPois } from "@/lib/data/pois";
import { listNavNodes, listNavEdges } from "@/lib/data/navigation";
import { PageHeader } from "@/components/PageHeader";
import { FloorEditor } from "@/components/FloorEditor";
import { PublishToggle } from "@/components/PublishToggle";

export const dynamic = "force-dynamic";

export default async function FloorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const floor = await getFloor(supabase, id);
  if (!floor) notFound();

  const building = await getBuilding(supabase, floor.buildingId);
  const tenant = building
    ? await getTenant(supabase, building.tenantId)
    : null;

  const [pois, navNodes] = await Promise.all([
    listPois(supabase, { floorId: floor.id, activeOnly: true }),
    listNavNodes(supabase, { floorId: floor.id }),
  ]);
  const navEdges = await listNavEdges(supabase, {
    nodeIds: navNodes.map((n) => n.id),
  });

  return (
    <>
      <PageHeader
        title={floor.name}
        description={`Level ${floor.level} · ${pois.length} POIs · ${navNodes.length} graph nodes · ${navEdges.length} edges`}
        breadcrumbs={[
          ...(tenant
            ? [{ label: tenant.name, href: `/tenants/${tenant.id}` }]
            : []),
          ...(building
            ? [{ label: building.name, href: `/buildings/${building.id}` }]
            : []),
          { label: floor.name },
        ]}
        action={<PublishToggle floorId={floor.id} status={floor.scanStatus} />}
      />

      <div className="px-8 py-6">
        <FloorEditor
          floor={floor}
          pois={pois}
          navNodes={navNodes}
          navEdges={navEdges}
        />
      </div>
    </>
  );
}
