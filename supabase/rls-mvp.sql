-- MVP policies so the anon key can read public lists and insert drafts from the Next.js API.
-- Run in Supabase SQL Editor after schema.sql. Tighten before production (auth-only writes, etc.).

alter table prompt_lists enable row level security;
alter table prompt_points enable row level security;

drop policy if exists "prompt_lists_select_public" on prompt_lists;
create policy "prompt_lists_select_public"
  on prompt_lists for select
  using (visibility = 'public');

drop policy if exists "prompt_lists_select_own_drafts" on prompt_lists;
-- Optional: allow reading own drafts when you add auth (placeholder)
create policy "prompt_lists_select_own_drafts"
  on prompt_lists for select
  using (visibility in ('draft', 'private'));

drop policy if exists "prompt_lists_insert_anon" on prompt_lists;
create policy "prompt_lists_insert_anon"
  on prompt_lists for insert
  with check (true);

drop policy if exists "prompt_lists_update_anon" on prompt_lists;
create policy "prompt_lists_update_anon"
  on prompt_lists for update
  using (true)
  with check (true);

drop policy if exists "prompt_points_select_anon" on prompt_points;
create policy "prompt_points_select_anon"
  on prompt_points for select
  using (true);

drop policy if exists "prompt_points_insert_anon" on prompt_points;
create policy "prompt_points_insert_anon"
  on prompt_points for insert
  with check (true);
