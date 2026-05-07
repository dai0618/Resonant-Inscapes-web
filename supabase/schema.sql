create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key,
  name text,
  handle text unique,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now()
);

create table if not exists prompt_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  author_id uuid references profiles(id),
  thumbnail_url text,
  target_model text,
  template text,
  visibility text default 'draft',
  like_count int default 0,
  download_count int default 0,
  forked_from_id uuid references prompt_lists(id),
  full_json jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists prompt_points (
  id uuid primary key default gen_random_uuid(),
  prompt_list_id uuid references prompt_lists(id) on delete cascade,
  valence numeric not null,
  arousal numeric not null,
  mood_label text,
  tags jsonb,
  negative_tags jsonb,
  prompt text
);

create table if not exists prompt_list_assets (
  id uuid primary key default gen_random_uuid(),
  prompt_list_id uuid references prompt_lists(id) on delete cascade,
  type text,
  url text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists prompt_list_likes (
  user_id uuid references profiles(id),
  prompt_list_id uuid references prompt_lists(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, prompt_list_id)
);

create table if not exists prompt_list_downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  prompt_list_id uuid references prompt_lists(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create index if not exists idx_prompt_lists_visibility_created_at
  on prompt_lists (visibility, created_at desc);

create index if not exists idx_prompt_points_prompt_list_id
  on prompt_points (prompt_list_id);

-- Future storage buckets (manual creation in Supabase Storage):
-- prompt-list-thumbnails
-- prompt-list-samples
-- prompt-list-audio
