import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenant, getTenantStats } from "@/lib/data/tenants";
import { listBuildings } from "@/lib/data/buildings";
import { PageHeader } from "@/components/PageHeader";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const tenant = await getTenant(supabase, id);
  if (!tenant) notFound();

  const [stats, buildings] = await Promise.all([
    getTenantStats(supabase, tenant.id),
    listBuildings(supabase, { tenantId: tenant.id }),
  ]);

  return (
    <>
      <PageHeader
        title={tenant.name}
        description={`Tenant · ${tenant.plan} plan · ${tenant.locale}`}
        breadcrumbs={[
          { label: "Tenants", href: "/tenants" },
          { label: tenant.name },
        ]}
      />

      <div className="space-y-6 px-8 py-6">
        {/* Branding preview */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Branding
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <BrandSwatch
              label="Primary"
              color={tenant.branding.primaryColor}
            />
            <BrandSwatch
              label="Secondary"
              color={tenant.branding.secondaryColor}
            />
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                App display name
              </div>
              <div className="mt-1.5 text-sm text-slate-900 dark:text-white">
                {tenant.branding.appDisplayName}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatTile label="Buildings" value={stats.buildings} />
          <StatTile label="Floors" value={stats.floors} />
          <StatTile label="POIs" value={stats.pois} />
        </div>

        {/* Buildings list */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Buildings
            </h2>
          </header>
          {buildings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No buildings yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {buildings.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/buildings/${b.id}`}
                    className="flex items-center justify-between px-5 py-4 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {b.name}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {b.address.street}, {b.address.city}
                        {b.address.state ? `, ${b.address.state}` : ""}{" "}
                        {b.address.postalCode}, {b.address.country}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {b.floorCount} {b.floorCount === 1 ? "floor" : "floors"} →
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

function BrandSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span
          className="h-8 w-8 rounded-md ring-1 ring-inset ring-black/10"
          style={{ backgroundColor: color }}
        />
        <code className="text-xs text-slate-700 dark:text-slate-300">
          {color}
        </code>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}
