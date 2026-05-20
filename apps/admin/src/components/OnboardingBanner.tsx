import Link from "next/link";

export function OnboardingBanner() {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-900 dark:from-blue-950/50 dark:to-indigo-950/50">
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Get started in 4 steps
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Welcome to SmartStat AI
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Your database is set up and your account has super_admin access.
            To see the mobile app come to life, create your first hospital,
            building, floor and a few POIs.
          </p>

          <ol className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <Step n={1} done={false}>
              Create your first <strong>tenant</strong> (hospital)
            </Step>
            <Step n={2} done={false}>
              Add a <strong>building</strong> with its address
            </Step>
            <Step n={3} done={false}>
              Add a <strong>floor</strong> with its physical size
            </Step>
            <Step n={4} done={false}>
              Open the floor editor and drop a few <strong>POIs</strong> on the
              map
            </Step>
          </ol>
        </div>

        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <Link
            href="/tenants/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Create first tenant
          </Link>
          <span className="text-center text-[11px] text-slate-500">
            takes ~30 seconds
          </span>
        </div>
      </div>
    </section>
  );
}

function Step({
  n,
  done,
  children,
}: {
  n: number;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={
          done
            ? "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
            : "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500 dark:border-slate-700"
        }
      >
        {done ? "✓" : n}
      </span>
      <span className="leading-tight">{children}</span>
    </li>
  );
}
