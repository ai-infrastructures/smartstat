import { useEffect, useState } from "react";
import { supabase } from "./supabase/client";
import type { UserRole } from "@smartstat/shared";

export interface MeProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  tenantId: string | null;
}

/**
 * Subscribes to the Supabase auth session and returns the current user's
 * profile (from the `me` RPC) — or null when signed out.
 */
export function useMe(): {
  loading: boolean;
  me: MeProfile | null;
} {
  const [me, setMe] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        if (active) {
          setMe(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase.rpc("me");
      const row = Array.isArray(data) ? data[0] : data;
      if (active) {
        setMe(
          row
            ? {
                id: row.id as string,
                email: row.email as string,
                name: (row.name as string | null) ?? null,
                role: row.role as UserRole,
                tenantId: (row.tenant_id as string | null) ?? null,
              }
            : null
        );
        setLoading(false);
      }
    }

    load();

    const sub = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => {
      active = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  return { me, loading };
}

export async function signInWithMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // smartstat://auth/callback handled by the mobile app via expo-linking
      emailRedirectTo: "smartstat://auth/callback",
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
