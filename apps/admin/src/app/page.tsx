import { APP_NAME_DEFAULT } from "@smartstat/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface DatabaseCheckResult {
  ok: boolean;
  tenantCount: number | null;
  buildingCount: number | null;
  floorCount: number | null;
  poiCount: number | null;
  errorMessage: string | null;
  latencyMs: number | null;
}

async function checkDatabase(): Promise<DatabaseCheckResult> {
  const t0 = Date.now();
  try {
    const supabase = await createSupabaseServerClient();

    const [tenants, buildings, floors, pois] = await Promise.all([
      supabase.from("tenants").select("*", { count: "exact", head: true }),
      supabase.from("buildings").select("*", { count: "exact", head: true }),
      supabase.from("floors").select("*", { count: "exact", head: true }),
      supabase.from("pois").select("*", { count: "exact", head: true }),
    ]);

    const firstError =
      tenants.error || buildings.error || floors.error || pois.error;
    if (firstError) {
      return {
        ok: false,
        tenantCount: null,
        buildingCount: null,
        floorCount: null,
        poiCount: null,
        errorMessage: firstError.message,
        latencyMs: Date.now() - t0,
      };
    }

    return {
      ok: true,
      tenantCount: tenants.count ?? 0,
      buildingCount: buildings.count ?? 0,
      floorCount: floors.count ?? 0,
      poiCount: pois.count ?? 0,
      errorMessage: null,
      latencyMs: Date.now() - t0,
    };
  } catch (err) {
    return {
      ok: false,
      tenantCount: null,
      buildingCount: null,
      floorCount: null,
      poiCount: null,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
      latencyMs: Date.now() - t0,
    };
  }
}

export default async function Home() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const dbCheck = supabaseConfigured
    ? await checkDatabase()
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
        <header className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            V0 · Project bootstrap
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {APP_NAME_DEFAULT}
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            Admin dashboard · white-label indoor navigation for hospitals
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            System status
          </h2>
          <ul className="space-y-3 text-sm">
            <StatusRow label="Next.js runtime" ok={true} value="OK" />
            <StatusRow label="@smartstat/shared package" ok={true} value="Linked" />
            <StatusRow
              label="Supabase env vars"
              ok={supabaseConfigured}
              value={supabaseConfigured ? "Configured" : "Missing"}
            />
            <StatusRow
              label="Supabase database connection"
              ok={dbCheck?.ok ?? false}
              value={
                !supabaseConfigured
                  ? "Skipped"
                  : dbCheck?.ok
                  ? `Connected · ${dbCheck.latencyMs}ms`
                  : `Error: ${dbCheck?.errorMessage ?? "unknown"}`
              }
            />
          </ul>
        </section>

        {dbCheck?.ok && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Live data from Supabase
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Tenants" value={dbCheck.tenantCount} />
              <Metric label="Buildings" value={dbCheck.buildingCount} />
              <Metric label="Floors" value={dbCheck.floorCount} />
              <Metric label="POIs" value={dbCheck.poiCount} />
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
              These counts are queried server-side at every page load. Empty is expected — we have not seeded any tenant yet.
            </p>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
            Next steps
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-400">
            <li>Seed a first tenant (Demo Hospital) for development</li>
            <li>Build authentication flow (sign in for tenant admins)</li>
            <li>Build building / floor / POI management UI</li>
            <li>Wire scanner workflow (Polycam import → floor publish)</li>
          </ol>
        </section>

        <footer className="mt-auto pt-12 text-xs text-slate-400">
          © {new Date().getFullYear()} SmartStat AI · build {new Date().toISOString().slice(0, 10)}
        </footer>
      </div>
    </main>
  );
}

function StatusRow({
  label,
  ok,
  value,
}: {
  label: string;
  ok: boolean;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span
        className={
          ok
            ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        }
      >
        <span
          className={
            ok
              ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
              : "h-1.5 w-1.5 rounded-full bg-amber-500"
          }
        />
        {value}
      </span>
    </li>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
        {value ?? "—"}
      </div>
    </div>
  );
}
