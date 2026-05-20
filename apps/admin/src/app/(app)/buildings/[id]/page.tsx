import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBuilding } from "@/lib/data/buildings";
import { listFloors } from "@/lib/data/floors";
import { getTenant } from "@/lib/data/tenants";
import { PageHeader } from "@/components/PageHeader";

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    scanning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    uploaded: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    in_review:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    published:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    archived:
      "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-500",
  };
  return styles[status] ?? styles.draft;
}

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const building = await getBuilding(supabase, id);
  if (!building) notFound();

  const [tenant, floors] = await Promise.all([
    getTenant(supabase, building.tenantId),
    listFloors(supabase, { buildingId: building.id }),
  ]);

  return (
    <>
      <PageHeader
        title={building.name}
        description={`${building.address.street}, ${building.address.city}${
          building.address.state ? `, ${building.address.state}` : ""
        } ${building.address.postalCode}`}
        breadcrumbs={[
          { label: "Buildings", href: "/buildings" },
          ...(tenant
            ? [{ label: tenant.name, href: `/tenants/${tenant.id}` }]
            : []),
          { label: building.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/floors/new?building=${building.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New floor
            </Link>
            <Link
              href={`/buildings/${building.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Edit
            </Link>
          </div>
        }
      />

      <div className="space-y-6 px-8 py-6">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Floors
            </h2>
          </header>

          {floors.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No floors yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {floors.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/floors/${f.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-mono font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                        {f.level >= 0 ? `+${f.level}` : f.level}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {f.name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          Level {f.level}
                          {f.bbox && (
                            <>
                              {" · "}
                              {(f.bbox[2] - f.bbox[0]).toFixed(0)}m ×{" "}
                              {(f.bbox[3] - f.bbox[1]).toFixed(0)}m
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(
                        f.scanStatus
                      )}`}
                    >
                      {f.scanStatus.replace("_", " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
