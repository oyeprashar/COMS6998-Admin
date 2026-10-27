-- Run in the same Supabase project used by COMS6998-Admin.
-- Superadmins remain privileged. Active whitelisted emails can access
-- the new Week 7 admin tables, but cannot edit the whitelist.
create or replace function public.is_admin_member()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select public.is_superadmin()), false)
    or exists (
      select 1 from auth.users u
      join public.whitelisted_email_addresses w
        on lower(trim(u.email)) = lower(trim(w.email))
      where u.id = (select auth.uid()) and w.is_active = true
    )
$$;
revoke all on function public.is_admin_member() from public, anon;
grant execute on function public.is_admin_member() to authenticated;

-- New Week 7 tables: expand access for invited administrators.
-- Whitelist management remains superadmin-only.
do $$
declare t text; p record;
begin
  foreach t in array array[
    'prompt_chains','prompt_chain_steps','prompt_chain_mix',
    'terms','llm_providers','llm_models',
    'generation_requests','llm_responses','ai_generated_media',
    'ai_generation_examples','allowed_signup_domains'
  ] loop
    for p in select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_admin_member())) with check ((select public.is_admin_member()))',
      'admin_member_access_' || t, t
    );
  end loop;
end $$;
