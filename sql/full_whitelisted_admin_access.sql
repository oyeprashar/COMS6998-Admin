-- Run in the SAME Supabase project as COMS6998-Admin, using the SQL Editor.
-- Requires sql/admin_whitelist_access.sql to have been applied first.
-- Full administrator powers are granted to all active whitelisted emails,
-- including the ability to invite and revoke other administrators.
begin;
do $$
begin
 if to_regprocedure('public.is_admin_member()') is null then
   raise exception 'Run sql/admin_whitelist_access.sql first';
 end if;
end $$;

-- Whitelisted administrators can now also manage the whitelist.
drop policy if exists admin_member_full_whitelist on public.whitelisted_email_addresses;
create policy admin_member_full_whitelist
on public.whitelisted_email_addresses
for all to authenticated
using ((select public.is_admin_member()))
with check ((select public.is_admin_member()));

-- Extend existing legacy admin RPCs without replacing their business logic.
-- Their existing bodies and return types are preserved. Only the internal
-- is_superadmin() guard changes to is_admin_member().
do $$
declare
 fn record;
 def text;
 n integer := 0;
begin
 for fn in
   select p.oid, p.proname, pg_get_functiondef(p.oid) as definition
   from pg_proc p
   join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public'
     and p.proname like 'admin\\_%' escape '\\'
     and p.prokind = 'f'
 loop
   def := regexp_replace(
     fn.definition,
     '(public\\.)?is_superadmin[[:space:]]*\\([[:space:]]*\\)',
     'public.is_admin_member()',
     'gi'
   );
   if def <> fn.definition then
     execute def;
     n := n + 1;
     raise notice 'Updated authorization in %', fn.proname;
   end if;
 end loop;
 raise notice 'Updated % legacy admin functions', n;
end $$;
commit;
