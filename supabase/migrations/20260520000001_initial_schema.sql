-- ================================================================
-- SmartStat AI — Initial database schema
-- ================================================================
-- Multi-tenant design: every domain table has tenant_id.
-- RLS policies enforce isolation between tenants.
-- HIPAA strategy: NO PHI stored. Search events anonymized.
-- ================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- fuzzy search on POI names

-- ---------- ENUMS ----------
create type tenant_plan as enum ('starter', 'pro', 'enterprise');

create type user_role as enum (
  'super_admin',
  'tenant_admin',
  'tenant_editor',
  'scanner_operator',
  'end_user'
);

create type floor_scan_status as enum (
  'draft',
  'scanning',
  'uploaded',
  'in_review',
  'published',
  'archived'
);

create type poi_category as enum (
  'department',
  'clinic',
  'room',
  'counter',
  'elevator',
  'stairs',
  'restroom',
  'pharmacy',
  'emergency',
  'cafeteria',
  'parking_entry',
  'entrance',
  'exit',
  'other'
);

create type nav_node_type as enum (
  'waypoint',
  'poi',
  'elevator',
  'stairs',
  'entrance',
  'qr_anchor'
);

-- ---------- Tenants ----------
create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  plan tenant_plan not null default 'starter',
  branding jsonb not null default '{}'::jsonb,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tenants is 'A hospital (or facility) using SmartStat AI. One tenant = one branded experience.';

-- ---------- User profiles (extends auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role user_role not null default 'end_user',
  tenant_id uuid references public.tenants(id) on delete set null,
  mfa_enabled boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index idx_profiles_tenant on public.profiles(tenant_id);
create index idx_profiles_role on public.profiles(role);

-- ---------- Buildings ----------
create table public.buildings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  address jsonb not null,
  -- precomputed columns from address for queries
  latitude double precision,
  longitude double precision,
  floor_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_buildings_tenant on public.buildings(tenant_id);

-- ---------- Floors ----------
create table public.floors (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  level int not null,
  name text not null,
  mesh_url text,
  floorplan_2d_url text,
  bbox double precision[],  -- [x_min, y_min, x_max, y_max] in meters
  scan_status floor_scan_status not null default 'draft',
  scanned_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, level)
);

create index idx_floors_building on public.floors(building_id);
create index idx_floors_tenant on public.floors(tenant_id);
create index idx_floors_status on public.floors(scan_status);

-- ---------- POIs (Points of Interest) ----------
create table public.pois (
  id uuid primary key default uuid_generate_v4(),
  floor_id uuid not null references public.floors(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  display_name text not null,
  search_keywords text[] not null default array[]::text[],
  category poi_category not null,
  position_x double precision not null,
  position_y double precision not null,
  position_z double precision not null default 0,
  accessibility jsonb not null default '{"wheelchairAccessible": true}'::jsonb,
  opening_hours jsonb not null default '[]'::jsonb,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pois_floor on public.pois(floor_id);
create index idx_pois_tenant on public.pois(tenant_id);
create index idx_pois_category on public.pois(category);
create index idx_pois_active on public.pois(is_active);
-- Fuzzy search on display_name (uses pg_trgm)
create index idx_pois_display_name_trgm on public.pois using gin (display_name gin_trgm_ops);
create index idx_pois_keywords_gin on public.pois using gin (search_keywords);

-- ---------- Navigation graph: nodes ----------
create table public.nav_nodes (
  id uuid primary key default uuid_generate_v4(),
  floor_id uuid not null references public.floors(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  type nav_node_type not null,
  position_x double precision not null,
  position_y double precision not null,
  position_z double precision not null default 0,
  poi_id uuid references public.pois(id) on delete set null,
  qr_code text,
  inter_floor_link_id text,
  created_at timestamptz not null default now()
);

create index idx_nav_nodes_floor on public.nav_nodes(floor_id);
create index idx_nav_nodes_tenant on public.nav_nodes(tenant_id);
create index idx_nav_nodes_type on public.nav_nodes(type);
create index idx_nav_nodes_qr on public.nav_nodes(qr_code) where qr_code is not null;
create index idx_nav_nodes_interfloor on public.nav_nodes(inter_floor_link_id) where inter_floor_link_id is not null;

-- ---------- Navigation graph: edges ----------
create table public.nav_edges (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  from_node_id uuid not null references public.nav_nodes(id) on delete cascade,
  to_node_id uuid not null references public.nav_nodes(id) on delete cascade,
  distance_meters double precision not null check (distance_meters >= 0),
  wheelchair_accessible boolean not null default true,
  one_way boolean not null default false,
  created_at timestamptz not null default now(),
  unique (from_node_id, to_node_id)
);

create index idx_nav_edges_from on public.nav_edges(from_node_id);
create index idx_nav_edges_to on public.nav_edges(to_node_id);
create index idx_nav_edges_tenant on public.nav_edges(tenant_id);

-- ---------- Anonymous search analytics (NO user link) ----------
create table public.search_events (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  building_id uuid references public.buildings(id) on delete set null,
  floor_id uuid references public.floors(id) on delete set null,
  -- The raw query (e.g., "cardiology"). NOT linked to user identity.
  query text not null,
  result_poi_id uuid references public.pois(id) on delete set null,
  -- Coarse-grained context only
  occurred_at_hour timestamptz not null default date_trunc('hour', now()),
  created_at timestamptz not null default now()
);

create index idx_search_events_tenant on public.search_events(tenant_id);
create index idx_search_events_hour on public.search_events(occurred_at_hour desc);

-- ---------- Admin audit log (HIPAA requirement) ----------
create table public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text, -- denormalized in case profile is later deleted
  action text not null, -- e.g., "poi.create", "floor.publish", "branding.update"
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  occurred_at timestamptz not null default now()
);

create index idx_audit_tenant on public.audit_log(tenant_id);
create index idx_audit_actor on public.audit_log(actor_id);
create index idx_audit_occurred_at on public.audit_log(occurred_at desc);

-- ---------- updated_at trigger function ----------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_tenants_updated_at before update on public.tenants
  for each row execute function public.set_updated_at();

create trigger trg_buildings_updated_at before update on public.buildings
  for each row execute function public.set_updated_at();

create trigger trg_floors_updated_at before update on public.floors
  for each row execute function public.set_updated_at();

create trigger trg_pois_updated_at before update on public.pois
  for each row execute function public.set_updated_at();
