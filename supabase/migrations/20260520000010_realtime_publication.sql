-- ================================================================
-- SmartStat AI — Enable Realtime on the floor-data tables
-- ================================================================
-- Supabase Realtime exposes Postgres logical replication via the
-- `supabase_realtime` publication. To let the mobile app subscribe to
-- live changes on POIs and the navigation graph, we add those tables
-- to the publication.
--
-- RLS still applies to realtime payloads — only changes the caller is
-- entitled to see (via the existing policies) are delivered.
-- ================================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pois'
  ) then
    execute 'alter publication supabase_realtime add table public.pois';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'nav_nodes'
  ) then
    execute 'alter publication supabase_realtime add table public.nav_nodes';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'nav_edges'
  ) then
    execute 'alter publication supabase_realtime add table public.nav_edges';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'floors'
  ) then
    execute 'alter publication supabase_realtime add table public.floors';
  end if;
end$$;

-- Set REPLICA IDENTITY FULL on tables we want to receive UPDATE old/new values for
-- (otherwise UPDATE events only contain the primary key)
alter table public.pois replica identity full;
alter table public.nav_nodes replica identity full;
alter table public.nav_edges replica identity full;
alter table public.floors replica identity full;
