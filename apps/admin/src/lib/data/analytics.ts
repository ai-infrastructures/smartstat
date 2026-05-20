import type { SupabaseClient } from "@supabase/supabase-js";

export interface TopQuery {
  query: string;
  count: number;
  lastSeen: string;
}

export interface TopPoi {
  poiId: string;
  displayName: string;
  category: string;
  hits: number;
}

export interface DailySearch {
  day: string; // ISO date
  searches: number;
}

export async function getTopQueries(
  supabase: SupabaseClient,
  tenantId: string,
  days = 30,
  limit = 10
): Promise<TopQuery[]> {
  const { data, error } = await supabase.rpc("tenant_top_queries", {
    p_tenant_id: tenantId,
    p_days: days,
    p_limit: limit,
  });
  if (error) throw new Error(`getTopQueries: ${error.message}`);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    query: r.query as string,
    count: Number(r.count),
    lastSeen: r.last_seen as string,
  }));
}

export async function getTopPois(
  supabase: SupabaseClient,
  tenantId: string,
  days = 30,
  limit = 10
): Promise<TopPoi[]> {
  const { data, error } = await supabase.rpc("tenant_top_pois", {
    p_tenant_id: tenantId,
    p_days: days,
    p_limit: limit,
  });
  if (error) throw new Error(`getTopPois: ${error.message}`);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    poiId: r.poi_id as string,
    displayName: r.display_name as string,
    category: r.category as string,
    hits: Number(r.hits),
  }));
}

export async function getDailySearches(
  supabase: SupabaseClient,
  tenantId: string,
  days = 30
): Promise<DailySearch[]> {
  const { data, error } = await supabase.rpc("tenant_search_daily", {
    p_tenant_id: tenantId,
    p_days: days,
  });
  if (error) throw new Error(`getDailySearches: ${error.message}`);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    day: r.day as string,
    searches: Number(r.searches),
  }));
}
