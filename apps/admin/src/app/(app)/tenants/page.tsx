import Link from "next/link";
import { Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listTenants, getTenantStats } from "@/lib/data/tenants";
import { PageHeader } from "@/components/PageHeader";

export default async function TenantsPage() {
  const supabase = await createSupabaseServerClient();
  const tenants = await listTenants(supabase);

  const stats = await Promise.all(
    tenants.map(async (t) => ({
      tenant: t,
      stats: await getTenantStats(supabase, t.id),
    }))
  );

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Each tenant is one hospital (or facility) using SmartStat AI."
        action={
          <Link
            href="/tenants/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New tenant
          </Link>
        }
      />

      <div className="px-4 py-5 md:px-8 md:py-6">
        {tenants.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <Th>Name</Th>
                  <Th>Slug</Th>
                  <Th>Plan</Th>
                  <Th align="right">Buildings</Th>
                  <Th align="right">Floors</Th>
                  <Th align="right">POIs</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.map(({ tenant, stats }) => (
                  <tr
                    key={tenant.id}
                    className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <Td>
                      <Link
                        href={`/tenants/${tenant.id}`}
                        className="flex items-center gap-3 font-medium text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
                          style={{ backgroundColor: tenant.branding.primaryColor }}
                        >
                          {tenant.name.charAt(0)}
                        </span>
                        {tenant.name}
                      </Link>
                    </Td>
                    <Td>
                      <code className="text-xs text-slate-500">{tenant.slug}</code>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {tenant.plan}
                      </span>
                    </Td>
                    <Td align="right" mono>
                      {stats.buildings}
                    </Td>
                    <Td align="right" mono>
                      {stats.floors}
                    </Td>
                    <Td align="right" mono>
                      {stats.pois}
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-2.5 ${
        align === "right" ? "text-right" : "text-left"
      } font-medium`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  mono = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  mono?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"} ${
        mono ? "tabular-nums" : ""
      } text-slate-700 dark:text-slate-300`}
    >
      {children}
    </td>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        No tenants yet
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Apply the seed migration in Supabase SQL Editor to create the Demo
        Hospital.
      </p>
    </div>
  );
}
