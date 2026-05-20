"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface MeRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenant_id: string | null;
}

export function UserMenu() {
  const router = useRouter();
  const [me, setMe] = useState<MeRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) {
          setMe(null);
          setLoading(false);
        }
        return;
      }
      const { data: profile } = await supabase.rpc("me");
      if (active) {
        const row = Array.isArray(profile) ? profile[0] : profile;
        setMe(row ?? null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="px-5 py-4 text-xs text-slate-400">Checking session…</div>
    );
  }

  if (!me) {
    return (
      <Link
        href="/login"
        className="m-3 block rounded-md bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-blue-700"
      >
        Sign in
      </Link>
    );
  }

  const initial = (me.name?.[0] ?? me.email[0])?.toUpperCase() ?? "?";

  return (
    <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-slate-900 dark:text-white">
            {me.name ?? me.email}
          </div>
          <div className="truncate text-[10px] text-slate-500">{me.role}</div>
        </div>
        <button
          onClick={signOut}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
