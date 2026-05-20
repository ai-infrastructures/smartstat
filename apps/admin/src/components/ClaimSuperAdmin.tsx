"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ClaimSuperAdmin() {
  const router = useRouter();
  const [state, setState] = useState<
    "checking" | "anonymous" | "already_super" | "can_claim" | "claiming" | "error"
  >("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) setState("anonymous");
        return;
      }
      const { data: profile } = await supabase.rpc("me");
      const row = Array.isArray(profile) ? profile[0] : profile;
      if (active) {
        if (row?.role === "super_admin") setState("already_super");
        else setState("can_claim");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function claim() {
    setState("claiming");
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("claim_super_admin");
      if (error) throw error;
      if (data === true) {
        setState("already_super");
        router.refresh();
      } else {
        setState("error");
        setError("Cannot claim — a super_admin already exists.");
      }
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Unexpected error");
    }
  }

  if (state === "checking" || state === "anonymous" || state === "already_super") {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-violet-900 dark:text-violet-200">
            You are signed in as a default end-user.
          </div>
          <div className="mt-0.5 text-xs text-violet-700 dark:text-violet-300">
            No super_admin exists yet. Click to claim the role and unlock write
            access across all tenants.
          </div>
          {error && (
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              {error}
            </div>
          )}
        </div>
        <button
          onClick={claim}
          disabled={state === "claiming"}
          className="shrink-0 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {state === "claiming" ? "Claiming…" : "Claim super_admin"}
        </button>
      </div>
    </div>
  );
}
