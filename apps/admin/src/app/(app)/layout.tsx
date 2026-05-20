import { Sidebar } from "@/components/Sidebar";
import { MobileNavBar } from "@/components/MobileNavBar";

// Every authenticated admin page reads from Supabase at request time
// (cookies + RLS-scoped queries) — there's nothing meaningful to prerender,
// and prerendering would 1) leak nothing useful, 2) crash the build if env
// vars aren't available at compile time on the host (Netlify, Vercel, ...).
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileNavBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
