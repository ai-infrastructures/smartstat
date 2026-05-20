-- ================================================================
-- SmartStat AI — Expo push tokens + tenant-targeted RPC
-- ================================================================
-- Adds a column to public.profiles so each user can register their
-- Expo push token, plus an RPC that returns the active tokens for
-- a tenant (used by the admin "Send notification" feature).
--
-- HIPAA note: push tokens are not PHI. Notification body sent over
-- Expo Push Service must NEVER contain PHI (e.g., diagnosis info).
-- The admin UI should constrain to generic messages.
-- ================================================================

alter table public.profiles
  add column if not exists expo_push_token text,
  add column if not exists push_platform text,
  add column if not exists push_updated_at timestamptz;

create index if not exists idx_profiles_push_token
  on public.profiles (expo_push_token)
  where expo_push_token is not null;

create index if not exists idx_profiles_tenant_push
  on public.profiles (tenant_id, expo_push_token)
  where expo_push_token is not null;

-- ---------- RPC: list active tokens for a tenant ----------
-- Returns the Expo push tokens of end_user / tenant_admin / tenant_editor /
-- scanner_operator profiles registered to a tenant. Used by the admin
-- "Send notification" server action. Callable only by authenticated users
-- whose role is super_admin or tenant_admin of that tenant.
create or replace function public.tenant_push_tokens(
  p_tenant_id uuid
)
returns table (
  user_id uuid,
  expo_push_token text,
  push_platform text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  -- super_admin can target any tenant; tenant_admin only their own
  if not (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'tenant_admin'
        and tenant_id = p_tenant_id
    )
  ) then
    raise exception 'not authorized for tenant %', p_tenant_id;
  end if;

  return query
    select p.id, p.expo_push_token, p.push_platform
    from public.profiles p
    where p.tenant_id = p_tenant_id
      and p.expo_push_token is not null
      and p.is_active = true;
end;
$$;

grant execute on function public.tenant_push_tokens(uuid) to authenticated;

-- ---------- RPC: upsert my own push token ----------
-- Called by the mobile app on every cold start after auth so the token
-- stays fresh. Only writes the caller's own row.
create or replace function public.upsert_my_push_token(
  p_token text,
  p_platform text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  update public.profiles
  set expo_push_token = p_token,
      push_platform = p_platform,
      push_updated_at = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.upsert_my_push_token(text, text) to authenticated;

-- ---------- Add an RLS policy so users can clear their own token ----------
-- (read/update self is already allowed by existing profiles policies)
