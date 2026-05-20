import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listPois } from "@/lib/data/pois";
import { listFloors } from "@/lib/data/floors";
import { listBuildings } from "@/lib/data/buildings";
import { PageHeader } from "@/components/PageHeader";
import type { PoiCategory } from "@smartstat/shared";

const CATEGORY_COLOR: Record<PoiCategory, string> = {
  department: "bg-blue-500",
  clinic: "bg-cyan-500",
  room: "bg-slate-500",
  counter: "bg-violet-500",
  elevator: "bg-yellow-500",
  stairs: "bg-yellow-600",
  restroom: "bg-emerald-500",
  pharmacy: "bg-pink-500",
  emergency: "bg-red-500",
  cafeteria: "bg-orange-500",
  parking_entry: "bg-indigo-500",
  entrance: "bg-teal-500",
  exit: "bg-teal-600",
  other: "bg-slate-400",
};

export default async function PoisPage() {
  const supabase = await createSupabaseServerClient();
  const [pois, floors, buildings] = await Promise.all([
    listPois(supabase),
    listFloors(supabase),
    listBuildings(supabase),
  ]);
  const floorById = new Map(floors.map((f) => [f.id, f]));
  const buildingById = new Map(buildings.map((b) => [b.id, b]));

  return (
    <>
      <PageHeader
        title="Points of Interest"
        description="Every searchable destination across all tenants."
      />

      <div className="px-8 py-6">
        {pois.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500">No POIs yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">Category</th>
                  <th className="px-4 py-2.5 text-left font-medium">Location</th>
                  <th className="px-4 py-2.5 text-left font-medium">Position</th>
                  <th className="px-4 py-2.5 text-left font-medium">A11y</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pois.map((p) => {
                  const f = floorById.get(p.floorId);
                  const b = f ? buildingById.get(f.buildingId) : null;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {p.displayName}
                        </div>
                        {p.searchKeywords.length > 0 && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {p.searchKeywords.slice(0, 4).join(", ")}
                            {p.searchKeywords.length > 4 && "…"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              CATEGORY_COLOR[p.category] ?? CATEGORY_COLOR.other
                            }`}
                          />
                          {p.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {b && f ? (
                          <span>
                            {b.name} ·{" "}
                            <Link
                              href={`/floors/${f.id}`}
                              className="hover:text-blue-600"
                            >
                              {f.name}
                            </Link>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {p.position.x.toFixed(1)}, {p.position.y.toFixed(1)}
                      </td>
                      <td className="px-4 py-3">
                        {p.accessibility.wheelchairAccessible ? (
                          <span
                            className="text-emerald-600 dark:text-emerald-400"
                            title="Wheelchair accessible"
                          >
                            ♿
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
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
