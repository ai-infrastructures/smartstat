-- ================================================================
-- SmartStat AI — Bootstrap super_admin (dev/initial-setup convenience)
-- ================================================================
-- The first authenticated user can call this RPC to elevate themselves
-- to super_admin. Once at least one super_admin exists, the function
-- refuses further calls (returns false).
--
-- For production: remove or restrict this function once team is set up.
-- ================================================================

create or replace function public.claim_super_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count int;
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'must be authenticated';
  end if;

  -- Check if any super_admin already exists
  select count(*) into existing_count
  from public.profiles
  where role = 'super_admin';

  if existing_count > 0 then
    -- Already claimed by someone; only allow if THIS user is the existing one
    return exists (
      select 1 from public.profiles
      where id = caller and role = 'super_admin'
    );
  end if;

  -- No super_admin yet: elevate the caller
  update public.profiles
  set role = 'super_admin'
  where id = caller;

  return true;
end;
$$;

comment on function public.claim_super_admin() is
  'Dev convenience: the first authenticated user can claim super_admin role. '
  'Returns true if the caller is now (or already was) super_admin, false otherwise.';

-- Allow authenticated users to call it
revoke all on function public.claim_super_admin() from public;
grant execute on function public.claim_super_admin() to authenticated;

-- ---------- Helper RPC: get the calling user's profile snapshot ----------
create or replace function public.me()
returns table (
  id uuid,
  email text,
  name text,
  role user_role,
  tenant_id uuid,
  is_active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select id, email, name, role, tenant_id, is_active
  from public.profiles
  where id = auth.uid();
$$;

grant execute on function public.me() to authenticated;
