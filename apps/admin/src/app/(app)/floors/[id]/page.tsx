import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Printer } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GeneratePlanButton } from "@/components/GeneratePlanButton";
import { getFloor } from "@/lib/data/floors";
import { getBuilding } from "@/lib/data/buildings";
import { getTenant } from "@/lib/data/tenants";
import { listPois } from "@/lib/data/pois";
import { listNavNodes, listNavEdges } from "@/lib/data/navigation";
import { getFloorPlanSignedUrl } from "@/lib/actions/floor-assets";
import { PageHeader } from "@/components/PageHeader";
import { FloorEditor } from "@/components/FloorEditor";
import { PublishToggle } from "@/components/PublishToggle";
import { FloorPlanUpload } from "@/components/FloorPlanUpload";

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

  const [pois, navNodes, floorPlanUrl] = await Promise.all([
    listPois(supabase, { floorId: floor.id, activeOnly: true }),
    listNavNodes(supabase, { floorId: floor.id }),
    getFloorPlanSignedUrl(floor.id),
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
        action={
          <div className="flex flex-wrap items-center gap-2">
            <GeneratePlanButton
              floorId={floor.id}
              hasMesh={Boolean(floor.meshUrl)}
            />
            <Link
              href={`/floors/${floor.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Edit
            </Link>
            <Link
              href={`/floors/${floor.id}/qr`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={2} />
              QR codes
            </Link>
            <PublishToggle floorId={floor.id} status={floor.scanStatus} />
          </div>
        }
      />

      <div className="space-y-4 px-8 py-6">
        <FloorPlanUpload
          floorId={floor.id}
          hasFloorPlan={Boolean(floor.floorplan2dUrl)}
        />

        <FloorEditor
          floor={floor}
          pois={pois}
          navNodes={navNodes}
          navEdges={navEdges}
          floorPlanUrl={floorPlanUrl}
        />
      </div>
    </>
  );
}
