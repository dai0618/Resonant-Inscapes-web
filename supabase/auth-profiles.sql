-- Auto-create public.profiles rows from Supabase auth.users
-- Run this once in Supabase SQL Editor after schema.sql.

create extension if not exists pgcrypto;

create or replace function public.make_profile_handle(email text, user_id uuid)
returns text
language plpgsql
as $$
declare
  base text;
begin
  base := lower(regexp_replace(split_part(coalesce(email, ''), '@', 1), '[^a-z0-9_]', '', 'g'));
  if base is null or length(base) = 0 then
    base := 'user';
  end if;
  return left(base, 20) || '_' || left(replace(user_id::text, '-', ''), 8);
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'New User'),
    public.make_profile_handle(new.email, new.id)
  )
  on conflict (id) do update
    set
      name = coalesce(public.profiles.name, excluded.name),
      handle = coalesce(public.profiles.handle, excluded.handle);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Backfill existing users that do not have a profile yet.
insert into public.profiles (id, name, handle)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'name', split_part(coalesce(u.email, ''), '@', 1), 'New User') as name,
  public.make_profile_handle(u.email, u.id) as handle
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
