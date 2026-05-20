-- ================================================================
-- SmartStat AI — Fuzzy search RPC + performance indexes
-- ================================================================
-- Server-side ranked search across POIs of a tenant using pg_trgm.
-- Also adds composite indexes that pay off for common query shapes.
-- ================================================================

-- ---------- Indexes ----------
-- Composite for "list POIs of a published floor" (used by mobile)
create index if not exists idx_pois_floor_active
  on public.pois (floor_id, is_active)
  where is_active = true;

-- Composite for tenant-scoped active POIs
create index if not exists idx_pois_tenant_active
  on public.pois (tenant_id, is_active);

-- Floor -> building lookups for joining (we filter by tenant a lot)
create index if not exists idx_floors_tenant_status
  on public.floors (tenant_id, scan_status);

-- ---------- Fuzzy search RPC ----------
-- Returns POIs ranked by trigram similarity on display_name + name +
-- exact-keyword bonus when the query matches a keyword.
--
-- For anonymous callers, we still respect the RLS on `pois` (anon can
-- only see POIs on published floors), so this function is safe to call
-- unauthenticated.
create or replace function public.search_pois_fuzzy(
  p_tenant_id uuid,
  p_query text,
  p_building_id uuid default null,
  p_limit int default 20
)
returns table (
  id uuid,
  floor_id uuid,
  tenant_id uuid,
  name text,
  display_name text,
  search_keywords text[],
  category poi_category,
  position_x double precision,
  position_y double precision,
  position_z double precision,
  accessibility jsonb,
  opening_hours jsonb,
  description text,
  is_active boolean,
  score double precision
)
language sql
stable
security invoker  -- RLS applies as the caller's role
set search_path = public
as $$
  with q as (
    select
      coalesce(nullif(trim(p_query), ''), '') as raw,
      lower(coalesce(p_query, '')) as q_lower
  )
  select
    p.id,
    p.floor_id,
    p.tenant_id,
    p.name,
    p.display_name,
    p.search_keywords,
    p.category,
    p.position_x,
    p.position_y,
    p.position_z,
    p.accessibility,
    p.opening_hours,
    p.description,
    p.is_active,
    case
      when (select raw from q) = '' then 0::double precision
      else greatest(
        similarity(lower(p.display_name), (select q_lower from q)),
        similarity(lower(p.name), (select q_lower from q))
      )
      + case
          when exists (
            select 1 from unnest(p.search_keywords) kw
            where lower(kw) = (select q_lower from q)
          ) then 0.5
          when exists (
            select 1 from unnest(p.search_keywords) kw
            where lower(kw) like '%' || (select q_lower from q) || '%'
          ) then 0.2
          else 0
        end
    end as score
  from public.pois p
  inner join public.floors f on f.id = p.floor_id and f.tenant_id = p.tenant_id
  where p.tenant_id = p_tenant_id
    and p.is_active = true
    and (p_building_id is null or f.building_id = p_building_id)
  order by score desc, p.display_name asc
  limit p_limit;
$$;

grant execute on function public.search_pois_fuzzy(uuid, text, uuid, int) to anon, authenticated;

-- ---------- Quick stats RPC for the dashboard ----------
create or replace function public.platform_counts()
returns table (
  tenants bigint,
  buildings bigint,
  floors bigint,
  pois bigint,
  qr_anchors bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.tenants),
    (select count(*) from public.buildings),
    (select count(*) from public.floors),
    (select count(*) from public.pois where is_active = true),
    (select count(*) from public.nav_nodes where type = 'qr_anchor');
$$;

grant execute on function public.platform_counts() to anon, authenticated;
