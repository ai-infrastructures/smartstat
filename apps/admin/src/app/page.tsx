import { APP_NAME_DEFAULT } from "@smartstat/shared";

export default function Home() {
  const supabaseConnected = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-16">
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
            Environment status
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Next.js runtime
              </span>
              <StatusBadge ok label="OK" />
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                @smartstat/shared package
              </span>
              <StatusBadge ok label="Linked" />
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Supabase environment variables
              </span>
              <StatusBadge
                ok={supabaseConnected}
                label={supabaseConnected ? "Configured" : "Missing"}
              />
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
            Next steps
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-400">
            <li>Create Supabase project and add env vars</li>
            <li>Connect this repo to Vercel for automatic deploys</li>
            <li>Build the building / floor / POI management UI</li>
            <li>Wire up multi-tenant authentication</li>
          </ol>
        </section>

        <footer className="mt-auto pt-12 text-xs text-slate-400">
          © {new Date().getFullYear()} SmartStat AI · build {new Date().toISOString().slice(0, 10)}
        </footer>
      </div>
    </main>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300"
      }
    >
      <span
        className={
          ok ? "h-1.5 w-1.5 rounded-full bg-emerald-500" : "h-1.5 w-1.5 rounded-full bg-amber-500"
        }
      />
      {label}
    </span>
  );
}
