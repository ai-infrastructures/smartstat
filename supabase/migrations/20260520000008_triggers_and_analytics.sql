-- ================================================================
-- SmartStat AI — Triggers + analytics RPCs
-- ================================================================
-- Auto-maintain buildings.floor_count, auto-log writes to audit_log,
-- and provide aggregated analytics RPCs for the tenant dashboard.
-- ================================================================

-- ---------- floor_count maintenance ----------
create or replace function public.recalc_building_floor_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_building uuid;
begin
  if (tg_op = 'DELETE') then
    target_building := old.building_id;
  else
    target_building := new.building_id;
  end if;

  update public.buildings b
  set floor_count = (
    select count(*) from public.floors where building_id = target_building
  )
  where b.id = target_building;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_floors_recalc_count on public.floors;
create trigger trg_floors_recalc_count
  after insert or delete on public.floors
  for each row execute function public.recalc_building_floor_count();

-- One-shot reconcile (in case existing data is out of sync)
update public.buildings b
set floor_count = (
  select count(*) from public.floors f where f.building_id = b.id
);

-- ---------- Audit log for write events ----------
-- Generic trigger that records inserts/updates/deletes on key tables.
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resource_type text := tg_table_name;
  v_resource_id uuid;
  v_tenant_id uuid;
  v_actor uuid := auth.uid();
  v_actor_email text;
  v_action text := tg_table_name || '.' || lower(tg_op);
begin
  if (tg_op = 'DELETE') then
    v_resource_id := (old.id)::uuid;
    v_tenant_id := case
      when v_resource_type = 'tenants' then (old.id)::uuid
      else (old.tenant_id)::uuid
    end;
  else
    v_resource_id := (new.id)::uuid;
    v_tenant_id := case
      when v_resource_type = 'tenants' then (new.id)::uuid
      else (new.tenant_id)::uuid
    end;
  end if;

  if v_actor is not null then
    select email into v_actor_email from public.profiles where id = v_actor;
  end if;

  insert into public.audit_log (
    tenant_id, actor_id, actor_email, action, resource_type, resource_id, metadata
  ) values (
    v_tenant_id,
    v_actor,
    v_actor_email,
    v_action,
    v_resource_type,
    v_resource_id,
    '{}'::jsonb
  );

  return coalesce(new, old);
end;
$$;

-- Attach to write-heavy tables
drop trigger if exists trg_audit_tenants on public.tenants;
create trigger trg_audit_tenants
  after insert or update or delete on public.tenants
  for each row execute function public.log_audit_event();

drop trigger if exists trg_audit_buildings on public.buildings;
create trigger trg_audit_buildings
  after insert or update or delete on public.buildings
  for each row execute function public.log_audit_event();

drop trigger if exists trg_audit_floors on public.floors;
create trigger trg_audit_floors
  after insert or update or delete on public.floors
  for each row execute function public.log_audit_event();

drop trigger if exists trg_audit_pois on public.pois;
create trigger trg_audit_pois
  after insert or update or delete on public.pois
  for each row execute function public.log_audit_event();

-- ---------- Tenant analytics RPCs ----------
-- All RPCs use security invoker so RLS filters by the caller's tenant.

-- Top search queries in the last N days
create or replace function public.tenant_top_queries(
  p_tenant_id uuid,
  p_days int default 30,
  p_limit int default 10
)
returns table (
  query text,
  count bigint,
  last_seen timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    lower(trim(query)) as query,
    count(*)::bigint as count,
    max(occurred_at_hour) as last_seen
  from public.search_events
  where tenant_id = p_tenant_id
    and occurred_at_hour >= now() - (p_days || ' days')::interval
    and length(trim(query)) > 0
  group by lower(trim(query))
  order by count desc, last_seen desc
  limit p_limit;
$$;

grant execute on function public.tenant_top_queries(uuid, int, int)
  to anon, authenticated;

-- Top POIs that were the result of a search
create or replace function public.tenant_top_pois(
  p_tenant_id uuid,
  p_days int default 30,
  p_limit int default 10
)
returns table (
  poi_id uuid,
  display_name text,
  category poi_category,
  hits bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    se.result_poi_id as poi_id,
    p.display_name,
    p.category,
    count(*)::bigint as hits
  from public.search_events se
  join public.pois p on p.id = se.result_poi_id
  where se.tenant_id = p_tenant_id
    and se.occurred_at_hour >= now() - (p_days || ' days')::interval
    and se.result_poi_id is not null
  group by se.result_poi_id, p.display_name, p.category
  order by hits desc
  limit p_limit;
$$;

grant execute on function public.tenant_top_pois(uuid, int, int)
  to anon, authenticated;

-- Daily search volume (last N days)
create or replace function public.tenant_search_daily(
  p_tenant_id uuid,
  p_days int default 30
)
returns table (
  day date,
  searches bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with days as (
    select generate_series(
      (now() at time zone 'utc')::date - (p_days - 1),
      (now() at time zone 'utc')::date,
      '1 day'::interval
    )::date as day
  )
  select
    d.day,
    coalesce(count(se.id), 0)::bigint as searches
  from days d
  left join public.search_events se
    on se.tenant_id = p_tenant_id
    and date_trunc('day', se.occurred_at_hour at time zone 'utc')::date = d.day
  group by d.day
  order by d.day asc;
$$;

grant execute on function public.tenant_search_daily(uuid, int)
  to anon, authenticated;
