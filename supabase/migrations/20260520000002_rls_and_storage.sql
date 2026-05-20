-- ================================================================
-- SmartStat AI — Row Level Security + Storage buckets
-- ================================================================
-- Multi-tenant isolation: every read/write checks the caller's
-- profile.tenant_id matches the row's tenant_id.
-- super_admin can do anything.
-- end_user (guest mode) can read published floors/POIs but cannot write.
-- ================================================================

-- ---------- Helper: get current profile ----------
create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false);
$$;

-- ---------- Enable RLS on every table ----------
alter table public.tenants        enable row level security;
alter table public.profiles       enable row level security;
alter table public.buildings      enable row level security;
alter table public.floors         enable row level security;
alter table public.pois           enable row level security;
alter table public.nav_nodes      enable row level security;
alter table public.nav_edges      enable row level security;
alter table public.search_events  enable row level security;
alter table public.audit_log      enable row level security;

-- ---------- TENANTS ----------
-- Super admin: full access
create policy "tenants_super_admin_all" on public.tenants
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Members of a tenant can read their own tenant
create policy "tenants_member_read" on public.tenants
  for select using (id = public.current_tenant_id());

-- Tenant admins can update their own tenant (branding etc)
create policy "tenants_admin_update" on public.tenants
  for update using (
    id = public.current_tenant_id() and public.current_role() = 'tenant_admin'
  );

-- ---------- PROFILES ----------
-- Anyone authenticated can read their own profile
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid());

-- Super admin: full access
create policy "profiles_super_admin_all" on public.profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Tenant admins can manage profiles within their tenant
create policy "profiles_tenant_admin_manage" on public.profiles
  for all using (
    public.current_role() = 'tenant_admin' and tenant_id = public.current_tenant_id()
  ) with check (
    public.current_role() = 'tenant_admin' and tenant_id = public.current_tenant_id()
  );

-- Users can update their own profile (limited fields enforced by app)
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------- BUILDINGS ----------
-- Super admin
create policy "buildings_super_admin_all" on public.buildings
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Tenant members read
create policy "buildings_tenant_read" on public.buildings
  for select using (tenant_id = public.current_tenant_id());

-- Anonymous / end users: read buildings of any tenant (so users can pick a hospital)
-- Note: app filters to "published" buildings only via floor status
create policy "buildings_public_read" on public.buildings
  for select to anon using (true);

-- Tenant admin/editor write
create policy "buildings_tenant_write" on public.buildings
  for all using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor')
  ) with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor')
  );

-- ---------- FLOORS ----------
create policy "floors_super_admin_all" on public.floors
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy "floors_tenant_read" on public.floors
  for select using (tenant_id = public.current_tenant_id());

-- Anonymous: read only published floors
create policy "floors_public_read_published" on public.floors
  for select to anon using (scan_status = 'published');

create policy "floors_tenant_write" on public.floors
  for all using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor', 'scanner_operator')
  ) with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor', 'scanner_operator')
  );

-- ---------- POIS ----------
create policy "pois_super_admin_all" on public.pois
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy "pois_tenant_read" on public.pois
  for select using (tenant_id = public.current_tenant_id());

-- Anonymous can read POIs of published floors
create policy "pois_public_read_published" on public.pois
  for select to anon using (
    is_active = true
    and exists (
      select 1 from public.floors f
      where f.id = pois.floor_id and f.scan_status = 'published'
    )
  );

create policy "pois_tenant_write" on public.pois
  for all using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor')
  ) with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor')
  );

-- ---------- NAV NODES ----------
create policy "nav_nodes_super_admin_all" on public.nav_nodes
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy "nav_nodes_tenant_read" on public.nav_nodes
  for select using (tenant_id = public.current_tenant_id());

create policy "nav_nodes_public_read_published" on public.nav_nodes
  for select to anon using (
    exists (
      select 1 from public.floors f
      where f.id = nav_nodes.floor_id and f.scan_status = 'published'
    )
  );

create policy "nav_nodes_tenant_write" on public.nav_nodes
  for all using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor')
  ) with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor')
  );

-- ---------- NAV EDGES ----------
create policy "nav_edges_super_admin_all" on public.nav_edges
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy "nav_edges_tenant_read" on public.nav_edges
  for select using (tenant_id = public.current_tenant_id());

create policy "nav_edges_public_read_published" on public.nav_edges
  for select to anon using (
    exists (
      select 1
      from public.nav_nodes n
      join public.floors f on f.id = n.floor_id
      where n.id = nav_edges.from_node_id and f.scan_status = 'published'
    )
  );

create policy "nav_edges_tenant_write" on public.nav_edges
  for all using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor')
  ) with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor')
  );

-- ---------- SEARCH EVENTS ----------
-- Anyone (including anon) can INSERT a search event for analytics
create policy "search_events_anon_insert" on public.search_events
  for insert to anon with check (true);

-- Tenant members can read their own tenant's events
create policy "search_events_tenant_read" on public.search_events
  for select using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('tenant_admin', 'tenant_editor')
  );

create policy "search_events_super_admin_all" on public.search_events
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------- AUDIT LOG ----------
-- Only super admin can read audit log; writes happen via server-side service role
create policy "audit_log_super_admin_read" on public.audit_log
  for select using (public.is_super_admin());

create policy "audit_log_tenant_admin_read" on public.audit_log
  for select using (
    tenant_id = public.current_tenant_id() and public.current_role() = 'tenant_admin'
  );

-- ---------- Auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'end_user')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public)
values
  ('floor-meshes', 'floor-meshes', false),
  ('floor-plans', 'floor-plans', false),
  ('branding', 'branding', true),  -- logos/colors are public (loaded by end-user app)
  ('qr-codes', 'qr-codes', false)
on conflict (id) do nothing;

-- Storage RLS: tenant members can manage files under their tenant's prefix
create policy "storage_branding_public_read"
on storage.objects for select to anon
using (bucket_id = 'branding');

create policy "storage_tenant_read"
on storage.objects for select
using (
  bucket_id in ('floor-meshes', 'floor-plans', 'qr-codes', 'branding')
  and (
    public.is_super_admin()
    or (split_part(name, '/', 1) = public.current_tenant_id()::text)
  )
);

create policy "storage_tenant_write"
on storage.objects for all
using (
  bucket_id in ('floor-meshes', 'floor-plans', 'qr-codes', 'branding')
  and public.current_tenant_id() is not null
  and split_part(name, '/', 1) = public.current_tenant_id()::text
  and public.current_role() in ('tenant_admin', 'tenant_editor', 'scanner_operator')
) with check (
  bucket_id in ('floor-meshes', 'floor-plans', 'qr-codes', 'branding')
  and public.current_tenant_id() is not null
  and split_part(name, '/', 1) = public.current_tenant_id()::text
  and public.current_role() in ('tenant_admin', 'tenant_editor', 'scanner_operator')
);
