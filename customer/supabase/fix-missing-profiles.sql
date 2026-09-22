-- Drinkly Supabase repair for: Could not find table public.profiles
-- Run this in Supabase SQL Editor.
-- For the complete backend, run 001_initial_schema.sql first instead.

do $$
begin
  create type public.user_role as enum ('CUSTOMER', 'SHOP_OWNER', 'ADMIN');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'CUSTOMER',
  full_name text,
  phone text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  logo_url text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  postal_code text,
  is_open boolean not null default false,
  opening_hours jsonb not null default '{}'::jsonb,
  delivery_radius text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.shops add column if not exists opening_hours jsonb not null default '{}'::jsonb;
alter table public.shops add column if not exists delivery_radius text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.phone,
    new.email,
    case
      when new.raw_user_meta_data ->> 'role' = 'SHOP_OWNER' then 'SHOP_OWNER'::public.user_role
      when new.raw_user_meta_data ->> 'role' = 'ADMIN' then 'ADMIN'::public.user_role
      else 'CUSTOMER'::public.user_role
    end
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and new.role is distinct from old.role
    and auth.uid() is not null then
    raise exception 'Profile role cannot be changed by the account owner';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute function public.protect_profile_role();

-- Repair users that were created before the trigger existed.
insert into public.profiles (id, full_name, phone, email, role)
select
  u.id,
  u.raw_user_meta_data ->> 'full_name',
  u.phone,
  u.email,
  case
    when u.raw_user_meta_data ->> 'role' = 'SHOP_OWNER' then 'SHOP_OWNER'::public.user_role
    else 'CUSTOMER'::public.user_role
  end
from auth.users u
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  email = excluded.email,
  role = case
    when excluded.role = 'SHOP_OWNER'::public.user_role then excluded.role
    else public.profiles.role
  end;

alter table public.profiles enable row level security;
alter table public.shops enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists shops_read_public on public.shops;
create policy shops_read_public
on public.shops for select
using (owner_id = auth.uid() or not exists (select 1 from public.profiles where id = auth.uid() and role = 'SHOP_OWNER'));

drop policy if exists shops_owner_insert on public.shops;
create policy shops_owner_insert
on public.shops for insert
with check (owner_id = auth.uid());

drop policy if exists shops_owner_update on public.shops;
create policy shops_owner_update
on public.shops for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Create a shop row for existing SHOP_OWNER users that do not have one.
insert into public.shops (owner_id, name, email)
select p.id, coalesce(nullif(p.full_name, ''), 'Drinkly Shop'), u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'SHOP_OWNER'
  and not exists (select 1 from public.shops s where s.owner_id = p.id);
