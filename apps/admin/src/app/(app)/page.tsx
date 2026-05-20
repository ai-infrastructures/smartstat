import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { ClaimSuperAdmin } from "@/components/ClaimSuperAdmin";
import { OnboardingBanner } from "@/components/OnboardingBanner";

interface CountResult {
  ok: boolean;
  tenants: number;
  buildings: number;
  floors: number;
  pois: number;
  errorMessage: string | null;
  latencyMs: number;
}

async function getCounts(): Promise<CountResult> {
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
        tenants: 0,
        buildings: 0,
        floors: 0,
        pois: 0,
        errorMessage: firstError.message,
        latencyMs: Date.now() - t0,
      };
    }

    return {
      ok: true,
      tenants: tenants.count ?? 0,
      buildings: buildings.count ?? 0,
      floors: floors.count ?? 0,
      pois: pois.count ?? 0,
      errorMessage: null,
      latencyMs: Date.now() - t0,
    };
  } catch (err) {
    return {
      ok: false,
      tenants: 0,
      buildings: 0,
      floors: 0,
      pois: 0,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
      latencyMs: Date.now() - t0,
    };
  }
}

export default async function DashboardPage() {
  const counts = await getCounts();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of the SmartStat AI platform"
      />

      <div className="px-8 py-6">
        <ClaimSuperAdmin />

        {counts.ok && counts.tenants === 0 && <OnboardingBanner />}

        {!counts.ok && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <strong>Cannot reach Supabase:</strong> {counts.errorMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric href="/tenants" label="Tenants" value={counts.tenants} />
          <Metric href="/buildings" label="Buildings" value={counts.buildings} />
          <Metric href="/floors" label="Floors" value={counts.floors} />
          <Metric href="/pois" label="POIs" value={counts.pois} />
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <Card title="System status">
            <ul className="space-y-2 text-sm">
              <StatusRow
                label="Database"
                ok={counts.ok}
                note={counts.ok ? `${counts.latencyMs} ms` : "down"}
              />
              <StatusRow
                label="Storage buckets"
                ok={true}
                note="floor-meshes · floor-plans · branding · qr-codes"
              />
              <StatusRow
                label="RLS policies"
                ok={true}
                note="multi-tenant + anonymous read"
              />
              <StatusRow
                label="HIPAA hosting"
                ok={false}
                note="dev tier · upgrade before production"
              />
            </ul>
          </Card>

          <Card title="Next steps">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-400">
              <li>Add authentication for hospital admins</li>
              <li>Build 2D floor viewer with POI map</li>
              <li>Implement A* pathfinding</li>
              <li>Mobile end-user navigation flow</li>
              <li>Scanner workflow (LiDAR import)</li>
            </ol>
          </Card>
        </section>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
    >
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
          {value}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400 transition group-hover:gap-1.5 group-hover:text-blue-500">
          View
          <ArrowRight className="h-3 w-3" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatusRow({
  label,
  ok,
  note,
}: {
  label: string;
  ok: boolean;
  note?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-slate-700 dark:text-slate-300">{label}</span>
      <span className="flex items-center gap-2">
        {note && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {note}
          </span>
        )}
        <span
          className={
            ok
              ? "inline-block h-2 w-2 rounded-full bg-emerald-500"
              : "inline-block h-2 w-2 rounded-full bg-amber-500"
          }
        />
      </span>
    </li>
  );
}
