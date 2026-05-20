import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listBuildings } from "@/lib/data/buildings";
import { listTenants } from "@/lib/data/tenants";
import { PageHeader } from "@/components/PageHeader";

export default async function BuildingsPage() {
  const supabase = await createSupabaseServerClient();
  const [buildings, tenants] = await Promise.all([
    listBuildings(supabase),
    listTenants(supabase),
  ]);
  const tenantById = new Map(tenants.map((t) => [t.id, t]));

  return (
    <>
      <PageHeader
        title="Buildings"
        description="All buildings across every tenant."
        action={
          <Link
            href="/buildings/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New building
          </Link>
        }
      />

      <div className="px-8 py-6">
        {buildings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500">No buildings yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buildings.map((b) => {
              const t = tenantById.get(b.tenantId);
              return (
                <Link
                  key={b.id}
                  href={`/buildings/${b.id}`}
                  className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
                >
                  <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    {t && (
                      <>
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: t.branding.primaryColor }}
                        />
                        <span>{t.name}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {b.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {b.address.city}
                    {b.address.state ? `, ${b.address.state}` : ""},{" "}
                    {b.address.country}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {b.floorCount} {b.floorCount === 1 ? "floor" : "floors"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-400 transition group-hover:gap-1.5 group-hover:text-blue-500">
                      View
                      <ArrowRight className="h-3 w-3" strokeWidth={2} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
