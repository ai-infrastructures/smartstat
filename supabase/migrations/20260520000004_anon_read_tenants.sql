-- ================================================================
-- SmartStat AI — Allow anonymous read of tenants (branding is public)
-- ================================================================
-- Rationale: end users (anon) need to see the list of available
-- hospitals and their branding (logo, colors, app display name)
-- when opening the mobile app. Branding is not sensitive data.
-- ================================================================

create policy "tenants_public_read"
on public.tenants for select
to anon
using (true);
