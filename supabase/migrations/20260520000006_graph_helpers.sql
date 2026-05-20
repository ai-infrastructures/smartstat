-- ================================================================
-- SmartStat AI — Graph helpers
-- ================================================================
-- Server-side functions for the navigation graph: auto-connecting
-- new nodes to nearest neighbors, regenerating edges on demand,
-- creating waypoint/QR nodes.
-- ================================================================

-- ---------- Helper: 2D distance between two nodes ----------
create or replace function public.nav_distance(a_x double precision, a_y double precision, b_x double precision, b_y double precision)
returns double precision
language sql
immutable
as $$
  select sqrt(power(a_x - b_x, 2) + power(a_y - b_y, 2));
$$;

-- ---------- Connect a single node to its K nearest neighbors on the same floor ----------
-- Connects only if the candidate is within max_distance_m meters.
-- Creates bidirectional edges (one row per direction).
create or replace function public.connect_node_to_nearest(
  p_node_id uuid,
  k int default 2,
  max_distance_m double precision default 20.0
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_floor_id uuid;
  v_tenant_id uuid;
  v_x double precision;
  v_y double precision;
  v_connected int := 0;
  rec record;
begin
  select floor_id, tenant_id, position_x, position_y
  into v_floor_id, v_tenant_id, v_x, v_y
  from public.nav_nodes
  where id = p_node_id;

  if v_floor_id is null then
    return 0;
  end if;

  for rec in
    select id, position_x, position_y,
           public.nav_distance(v_x, v_y, position_x, position_y) as dist
    from public.nav_nodes
    where floor_id = v_floor_id
      and id <> p_node_id
    order by dist asc
    limit k
  loop
    if rec.dist > max_distance_m then
      continue;
    end if;

    insert into public.nav_edges (tenant_id, from_node_id, to_node_id, distance_meters, wheelchair_accessible)
    values (v_tenant_id, p_node_id, rec.id, rec.dist, true)
    on conflict (from_node_id, to_node_id) do nothing;

    insert into public.nav_edges (tenant_id, from_node_id, to_node_id, distance_meters, wheelchair_accessible)
    values (v_tenant_id, rec.id, p_node_id, rec.dist, true)
    on conflict (from_node_id, to_node_id) do nothing;

    v_connected := v_connected + 1;
  end loop;

  return v_connected;
end;
$$;

grant execute on function public.connect_node_to_nearest(uuid, int, double precision) to authenticated;

-- ---------- Regenerate all edges on a floor (clears + reconnects every node) ----------
create or replace function public.regenerate_floor_graph(
  p_floor_id uuid,
  k int default 3,
  max_distance_m double precision default 15.0
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_node record;
  v_total int := 0;
  v_added int;
begin
  -- Authorization: caller must be super_admin or member of the tenant owning this floor
  if not (
    public.is_super_admin()
    or exists (
      select 1 from public.floors f
      where f.id = p_floor_id
        and f.tenant_id = public.current_tenant_id()
        and public.current_role() in ('tenant_admin', 'tenant_editor', 'scanner_operator')
    )
  ) then
    raise exception 'permission denied';
  end if;

  -- Wipe all edges on this floor
  delete from public.nav_edges
  where from_node_id in (select id from public.nav_nodes where floor_id = p_floor_id);

  -- Reconnect each node
  for v_node in select id from public.nav_nodes where floor_id = p_floor_id loop
    v_added := public.connect_node_to_nearest(v_node.id, k, max_distance_m);
    v_total := v_total + v_added;
  end loop;

  return v_total;
end;
$$;

grant execute on function public.regenerate_floor_graph(uuid, int, double precision) to authenticated;

-- ---------- Create a standalone waypoint or QR anchor node ----------
-- Returns the new node id. Auto-connects to nearest neighbors.
create or replace function public.create_nav_node(
  p_floor_id uuid,
  p_type text,
  p_x double precision,
  p_y double precision,
  p_qr_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_node_id uuid;
begin
  select tenant_id into v_tenant_id from public.floors where id = p_floor_id;
  if v_tenant_id is null then
    raise exception 'floor not found';
  end if;

  if not (
    public.is_super_admin()
    or (v_tenant_id = public.current_tenant_id()
        and public.current_role() in ('tenant_admin', 'tenant_editor', 'scanner_operator'))
  ) then
    raise exception 'permission denied';
  end if;

  if p_type not in ('waypoint', 'qr_anchor', 'elevator', 'stairs', 'entrance') then
    raise exception 'invalid node type: %', p_type;
  end if;

  insert into public.nav_nodes (floor_id, tenant_id, type, position_x, position_y, qr_code)
  values (p_floor_id, v_tenant_id, p_type::nav_node_type, p_x, p_y, p_qr_code)
  returning id into v_node_id;

  -- Auto-connect new node
  perform public.connect_node_to_nearest(v_node_id, 3, 15.0);

  return v_node_id;
end;
$$;

grant execute on function public.create_nav_node(uuid, text, double precision, double precision, text) to authenticated;

-- ---------- Delete a nav node (with edge cleanup) ----------
create or replace function public.delete_nav_node(p_node_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_floor_id uuid;
  v_tenant_id uuid;
begin
  select floor_id, tenant_id into v_floor_id, v_tenant_id
  from public.nav_nodes where id = p_node_id;
  if v_floor_id is null then
    return false;
  end if;

  if not (
    public.is_super_admin()
    or (v_tenant_id = public.current_tenant_id()
        and public.current_role() in ('tenant_admin', 'tenant_editor', 'scanner_operator'))
  ) then
    raise exception 'permission denied';
  end if;

  delete from public.nav_edges
  where from_node_id = p_node_id or to_node_id = p_node_id;

  delete from public.nav_nodes where id = p_node_id;
  return true;
end;
$$;

grant execute on function public.delete_nav_node(uuid) to authenticated;
