import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFloor } from "@/lib/data/floors";
import { getBuilding } from "@/lib/data/buildings";
import { getTenant } from "@/lib/data/tenants";
import { listNavNodes } from "@/lib/data/navigation";
import { PageHeader } from "@/components/PageHeader";
import { QRPrintList } from "@/components/QRPrintList";

export const dynamic = "force-dynamic";

export default async function FloorQRPage({
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
  const nodes = await listNavNodes(supabase, { floorId: floor.id });
  const anchors = nodes.filter((n) => n.qrCode);

  return (
    <>
      <PageHeader
        title="QR calibration anchors"
        description={`${anchors.length} anchor${anchors.length === 1 ? "" : "s"} for ${floor.name}. Print at A5 and stick at the exact coordinates.`}
        breadcrumbs={[
          ...(tenant
            ? [{ label: tenant.name, href: `/tenants/${tenant.id}` }]
            : []),
          ...(building
            ? [{ label: building.name, href: `/buildings/${building.id}` }]
            : []),
          { label: floor.name, href: `/floors/${floor.id}` },
          { label: "QR codes" },
        ]}
      />

      <div className="px-4 py-5 md:px-8 md:py-6">
        <QRPrintList floor={floor} anchors={anchors} tenantName={tenant?.name} />
      </div>
    </>
  );
}
