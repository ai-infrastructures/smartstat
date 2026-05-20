import Link from "next/link";
import { Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listFloors } from "@/lib/data/floors";
import { listBuildings } from "@/lib/data/buildings";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function FloorsPage() {
  const supabase = await createSupabaseServerClient();
  const [floors, buildings] = await Promise.all([
    listFloors(supabase),
    listBuildings(supabase),
  ]);
  const buildingById = new Map(buildings.map((b) => [b.id, b]));

  return (
    <>
      <PageHeader
        title="Floors"
        description="Every floor with its scan and publish status."
        action={
          <Link
            href="/floors/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New floor
          </Link>
        }
      />

      <div className="px-4 py-5 md:px-8 md:py-6">
        {floors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500">No floors yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Building</th>
                  <th className="px-4 py-2.5 text-left font-medium">Level</th>
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">Size</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {floors.map((f) => {
                  const b = buildingById.get(f.buildingId);
                  return (
                    <tr
                      key={f.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {b?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {f.level >= 0 ? `+${f.level}` : f.level}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/floors/${f.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                        >
                          {f.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {f.bbox
                          ? `${(f.bbox[2] - f.bbox[0]).toFixed(0)} × ${(
                              f.bbox[3] - f.bbox[1]
                            ).toFixed(0)} m`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={f.scanStatus} />
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

function StatusPill({ status }: { status: string }) {
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
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? styles.draft
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
