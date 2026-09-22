-- Drinkly shop-owner role repair. Safe to run multiple times (idempotent).
-- Run this in the Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- Why this exists:
--   profiles.role is protected on purpose: the account itself can never change
--   its own role (anti privilege-escalation trigger protect_profile_role), so
--   role fixes must be run from here as SQL (auth.uid() is null in the SQL
--   editor, which the trigger allows).
--   Accounts get stuck as CUSTOMER when their profile row was created before
--   the on_auth_user_created trigger existed, or when signup raced it.

-- 1) Users who signed up through "Create Shop Account": trust their auth metadata.
update public.profiles p
set role = (u.raw_user_meta_data ->> 'role')::public.user_role
from auth.users u
where u.id = p.id
  and u.raw_user_meta_data ->> 'role' in ('SHOP_OWNER', 'ADMIN')
  and p.role = 'CUSTOMER';

-- 2) Anyone who already owns a shop row is an owner, whatever the metadata says.
update public.profiles p
set role = 'SHOP_OWNER'
where p.role = 'CUSTOMER'
  and exists (select 1 from public.shops s where s.owner_id = p.id);

-- 3) Force-grant shop-owner to one specific account (uncomment and set the email):
-- update public.profiles set role = 'SHOP_OWNER' where email = 'you@example.com';

-- Verify: this should list every shop-owner account with its role.
-- select p.email, p.role from public.profiles p where p.role in ('SHOP_OWNER', 'ADMIN') order by p.created_at;
