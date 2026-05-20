import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listAuditEntries, type AuditEntry } from "@/lib/data/audit";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

const RESOURCE_TYPES = [
  "all",
  "tenants",
  "buildings",
  "floors",
  "pois",
] as const;

const ACTION_COLOR: Record<string, string> = {
  insert:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  delete: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ resource?: string }>;
}) {
  const sp = await searchParams;
  const resource = sp.resource && sp.resource !== "all" ? sp.resource : undefined;

  const supabase = await createSupabaseServerClient();
  const entries = await listAuditEntries(supabase, {
    resourceType: resource,
    limit: 200,
  }).catch(() => [] as AuditEntry[]);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Last 200 write operations across the platform. Required for HIPAA accountability."
      />

      <div className="px-4 py-5 md:px-8 md:py-6">
        {/* Resource filter chips */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {RESOURCE_TYPES.map((r) => {
            const active = (resource ?? "all") === r;
            return (
              <Link
                key={r}
                href={r === "all" ? "/audit" : `/audit?resource=${r}`}
                className={
                  active
                    ? "rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-900"
                    : "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                }
              >
                {r}
              </Link>
            );
          })}
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500">
              No audit entries yet. Make a write in the admin UI to see it
              recorded here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">When</th>
                  <th className="px-4 py-2.5 text-left font-medium">Actor</th>
                  <th className="px-4 py-2.5 text-left font-medium">Action</th>
                  <th className="px-4 py-2.5 text-left font-medium">Resource</th>
                  <th className="px-4 py-2.5 text-left font-medium">Resource id</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map((e) => {
                  const verb = e.action.split(".").pop() ?? e.action;
                  const cls = ACTION_COLOR[verb] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                  return (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-2.5 text-xs text-slate-500 tabular-nums">
                        {new Date(e.occurredAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        {e.actorEmail ? (
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {e.actorEmail}
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400">
                            anonymous / system
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
                        >
                          {verb}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                        {e.resourceType}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                        {e.resourceId ? e.resourceId.slice(0, 8) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
