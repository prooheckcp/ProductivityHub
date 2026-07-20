-- Shiba Track — Supabase schema, RLS, triggers, and storage.
-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.
-- It is safe to re-run (idempotent).

-- ============================================================================
-- profiles: one row per user. `id` == auth.users.id == the unique per-user ID.
-- Username + avatar are meant to be public (future leaderboards).
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  avatar_url text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to run on an existing DB where the column didn't exist yet.
alter table public.profiles add column if not exists country text;

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================================
-- user_data: one row per user holding the full data snapshot (theme + all
-- tracked stats) as JSONB, plus a validated aggregate for anti-cheat.
-- ============================================================================
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  bundle jsonb not null default '{}'::jsonb,
  total_tracked_ms bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

drop policy if exists "Users can read their own data" on public.user_data;
create policy "Users can read their own data"
  on public.user_data for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own data" on public.user_data;
create policy "Users can insert their own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own data" on public.user_data;
create policy "Users can update their own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- NOTE: We intentionally do NOT create a trigger on auth.users here. Creating
-- triggers on the auth schema can fail with a permissions error on some
-- projects, and because the whole script runs as one transaction, that failure
-- would roll back EVERY table above. The app creates the profile row itself
-- (upsert on first login), so the trigger isn't needed.

-- ============================================================================
-- Anti-cheat: reject implausible jumps in total_tracked_ms on UPDATE.
-- The server sets updated_at itself, and compares the increase against real
-- elapsed wall-clock (which naturally covers offline use). CONCURRENCY_FACTOR
-- allows several trackers running at once; BASE_TOLERANCE covers clock drift.
-- Rejecting never loses data — the client keeps its copy and can retry.
-- Tune the two constants below if legitimate saves ever get rejected.
-- ============================================================================
create or replace function public.validate_user_data_update()
returns trigger
language plpgsql
as $$
declare
  concurrency_factor constant numeric := 12;
  base_tolerance_ms  constant bigint  := 7200000; -- 2 hours
  elapsed_ms         bigint;
  allowed_increase   bigint;
  actual_increase    bigint;
begin
  elapsed_ms := greatest(0, floor(extract(epoch from (now() - old.updated_at)) * 1000))::bigint;
  allowed_increase := (elapsed_ms * concurrency_factor)::bigint + base_tolerance_ms;
  actual_increase := new.total_tracked_ms - old.total_tracked_ms;

  if actual_increase > allowed_increase then
    raise exception
      'Rejected implausible tracked-time increase: % ms over % ms elapsed (max allowed %)',
      actual_increase, elapsed_ms, allowed_increase
      using errcode = 'check_violation';
  end if;

  -- Server owns updated_at so the elapsed calc can't be spoofed by the client.
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists validate_user_data on public.user_data;
create trigger validate_user_data
  before update on public.user_data
  for each row execute function public.validate_user_data_update();

-- NOTE: Storage (the `avatars` bucket + policies) lives in a SEPARATE file,
-- docs/supabase-storage-optional.sql. It's only needed for custom photo uploads
-- (the 6 built-in templates work without it). It's kept separate because a
-- storage-policy permission error would otherwise roll back this whole script.

-- ============================================================================
-- coding_leaderboard: public, cross-user aggregates of coding time per language.
-- One row per (user, language). The client keeps three windows in sync:
--   all_time_ms  — grows forever
--   today_ms + today_date  — today's total (UTC); stale rows filtered by date
--   week_ms  + week_key    — this ISO week's total (UTC), key like '2026-W29'
-- Public read (for the leaderboard); each user writes only their own rows.
-- ============================================================================
create table if not exists public.coding_leaderboard (
  user_id uuid not null references auth.users (id) on delete cascade,
  language text not null,
  all_time_ms bigint not null default 0,
  today_ms bigint not null default 0,
  today_date date,
  week_ms bigint not null default 0,
  week_key text,
  updated_at timestamptz not null default now(),
  primary key (user_id, language)
);

alter table public.coding_leaderboard enable row level security;

drop policy if exists "Leaderboard is readable by everyone" on public.coding_leaderboard;
create policy "Leaderboard is readable by everyone"
  on public.coding_leaderboard for select
  using (true);

drop policy if exists "Users can insert their own leaderboard rows" on public.coding_leaderboard;
create policy "Users can insert their own leaderboard rows"
  on public.coding_leaderboard for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own leaderboard rows" on public.coding_leaderboard;
create policy "Users can update their own leaderboard rows"
  on public.coding_leaderboard for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anti-cheat: reject implausible growth in a language's all_time_ms, same idea
-- as user_data (elapsed wall-clock * factor + tolerance). Coding is roughly
-- single-stream, so the factor is smaller here. Tune if needed.
create or replace function public.validate_leaderboard_update()
returns trigger
language plpgsql
as $$
declare
  factor        constant numeric := 4;
  tolerance_ms  constant bigint  := 7200000; -- 2 hours
  elapsed_ms       bigint;
  allowed_increase bigint;
  actual_increase  bigint;
begin
  elapsed_ms := greatest(0, floor(extract(epoch from (now() - old.updated_at)) * 1000))::bigint;
  allowed_increase := (elapsed_ms * factor)::bigint + tolerance_ms;
  actual_increase := new.all_time_ms - old.all_time_ms;
  if actual_increase > allowed_increase then
    raise exception 'Rejected implausible coding-time increase for %: % ms over % ms (max %)',
      new.language, actual_increase, elapsed_ms, allowed_increase
      using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists validate_leaderboard on public.coding_leaderboard;
create trigger validate_leaderboard
  before update on public.coding_leaderboard
  for each row execute function public.validate_leaderboard_update();

-- ---- Leaderboard read RPCs (invoker rights; RLS already allows public read) --

-- Ranked leaderboard for a language, optional country, and time window.
create or replace function public.get_coding_leaderboard(
  p_language text,
  p_country text default null,
  p_period text default 'all',
  p_limit int default 100
)
returns table (user_id uuid, username text, avatar_url text, country text, ms bigint, rank bigint)
language sql
stable
as $$
  with base as (
    select
      cl.user_id,
      p.username,
      p.avatar_url,
      p.country,
      case
        when p_period = 'daily' then cl.today_ms
        when p_period = 'weekly' then cl.week_ms
        else cl.all_time_ms
      end as ms
    from public.coding_leaderboard cl
    join public.profiles p on p.id = cl.user_id
    where cl.language = p_language
      and (p_country is null or p.country = p_country)
      and (
        p_period = 'all'
        or (p_period = 'daily' and cl.today_date = (now() at time zone 'utc')::date)
        or (p_period = 'weekly' and cl.week_key = to_char((now() at time zone 'utc'), 'IYYY"-W"IW'))
      )
  ),
  ranked as (
    select *, rank() over (order by ms desc) as rank
    from base
    where ms > 0
  )
  select user_id, username, avatar_url, country, ms, rank
  from ranked
  order by rank
  limit p_limit;
$$;

-- The caller's own rank/ms for the same filters (their "world rank").
create or replace function public.get_my_coding_rank(
  p_language text,
  p_country text default null,
  p_period text default 'all'
)
returns table (rank bigint, ms bigint)
language sql
stable
as $$
  with base as (
    select
      cl.user_id,
      case
        when p_period = 'daily' then cl.today_ms
        when p_period = 'weekly' then cl.week_ms
        else cl.all_time_ms
      end as ms
    from public.coding_leaderboard cl
    join public.profiles p on p.id = cl.user_id
    where cl.language = p_language
      and (p_country is null or p.country = p_country)
      and (
        p_period = 'all'
        or (p_period = 'daily' and cl.today_date = (now() at time zone 'utc')::date)
        or (p_period = 'weekly' and cl.week_key = to_char((now() at time zone 'utc'), 'IYYY"-W"IW'))
      )
  ),
  ranked as (
    select user_id, ms, rank() over (order by ms desc) as rank
    from base
    where ms > 0
  )
  select rank, ms from ranked where user_id = auth.uid();
$$;

-- Only the languages we actually have data for (what the UI offers to filter by).
create or replace function public.get_coding_leaderboard_languages()
returns table (language text)
language sql
stable
as $$
  select distinct language
  from public.coding_leaderboard
  where all_time_ms > 0
  order by language;
$$;

-- Countries that appear on the leaderboard (for the country filter).
create or replace function public.get_coding_leaderboard_countries()
returns table (country text)
language sql
stable
as $$
  select distinct p.country
  from public.coding_leaderboard cl
  join public.profiles p on p.id = cl.user_id
  where p.country is not null and cl.all_time_ms > 0
  order by p.country;
$$;

-- ============================================================================
-- app_leaderboard: cross-user aggregates of time spent in specific apps, split
-- by category ('devtools' | 'games') and item (canonical app name). Same
-- three-window model as coding_leaderboard.
-- ============================================================================
create table if not exists public.app_leaderboard (
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  item text not null,
  all_time_ms bigint not null default 0,
  today_ms bigint not null default 0,
  today_date date,
  week_ms bigint not null default 0,
  week_key text,
  updated_at timestamptz not null default now(),
  primary key (user_id, category, item)
);

alter table public.app_leaderboard enable row level security;

drop policy if exists "App leaderboard is readable by everyone" on public.app_leaderboard;
create policy "App leaderboard is readable by everyone"
  on public.app_leaderboard for select using (true);

drop policy if exists "Users can insert their own app rows" on public.app_leaderboard;
create policy "Users can insert their own app rows"
  on public.app_leaderboard for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own app rows" on public.app_leaderboard;
create policy "Users can update their own app rows"
  on public.app_leaderboard for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.validate_app_leaderboard_update()
returns trigger language plpgsql as $$
declare
  factor        constant numeric := 4;
  tolerance_ms  constant bigint  := 7200000;
  elapsed_ms       bigint;
  allowed_increase bigint;
  actual_increase  bigint;
begin
  elapsed_ms := greatest(0, floor(extract(epoch from (now() - old.updated_at)) * 1000))::bigint;
  allowed_increase := (elapsed_ms * factor)::bigint + tolerance_ms;
  actual_increase := new.all_time_ms - old.all_time_ms;
  if actual_increase > allowed_increase then
    raise exception 'Rejected implausible app-time increase for %/%: % ms over % ms (max %)',
      new.category, new.item, actual_increase, elapsed_ms, allowed_increase
      using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists validate_app_leaderboard on public.app_leaderboard;
create trigger validate_app_leaderboard
  before update on public.app_leaderboard
  for each row execute function public.validate_app_leaderboard_update();

-- Ranked app leaderboard for a category + item, optional country, time window.
create or replace function public.get_app_leaderboard(
  p_category text,
  p_item text,
  p_country text default null,
  p_period text default 'all',
  p_limit int default 100
)
returns table (user_id uuid, username text, avatar_url text, country text, ms bigint, rank bigint)
language sql stable as $$
  with base as (
    select al.user_id, p.username, p.avatar_url, p.country,
      case when p_period='daily' then al.today_ms when p_period='weekly' then al.week_ms else al.all_time_ms end as ms
    from public.app_leaderboard al join public.profiles p on p.id = al.user_id
    where al.category = p_category and al.item = p_item
      and (p_country is null or p.country = p_country)
      and (p_period='all'
        or (p_period='daily' and al.today_date=(now() at time zone 'utc')::date)
        or (p_period='weekly' and al.week_key=to_char((now() at time zone 'utc'),'IYYY"-W"IW')))
  ),
  ranked as (select *, rank() over (order by ms desc) as rank from base where ms > 0)
  select user_id, username, avatar_url, country, ms, rank from ranked order by rank limit p_limit;
$$;

create or replace function public.get_my_app_rank(
  p_category text, p_item text, p_country text default null, p_period text default 'all'
)
returns table (rank bigint, ms bigint) language sql stable as $$
  with base as (
    select al.user_id,
      case when p_period='daily' then al.today_ms when p_period='weekly' then al.week_ms else al.all_time_ms end as ms
    from public.app_leaderboard al join public.profiles p on p.id = al.user_id
    where al.category = p_category and al.item = p_item
      and (p_country is null or p.country = p_country)
      and (p_period='all'
        or (p_period='daily' and al.today_date=(now() at time zone 'utc')::date)
        or (p_period='weekly' and al.week_key=to_char((now() at time zone 'utc'),'IYYY"-W"IW')))
  ),
  ranked as (select user_id, ms, rank() over (order by ms desc) as rank from base where ms > 0)
  select rank, ms from ranked where user_id = auth.uid();
$$;

create or replace function public.get_app_leaderboard_items(p_category text)
returns table (item text) language sql stable as $$
  select distinct item from public.app_leaderboard where category = p_category and all_time_ms > 0 order by item;
$$;

create or replace function public.get_app_leaderboard_countries(p_category text)
returns table (country text) language sql stable as $$
  select distinct p.country from public.app_leaderboard al join public.profiles p on p.id = al.user_id
  where al.category = p_category and p.country is not null and al.all_time_ms > 0 order by p.country;
$$;

-- ============================================================================
-- CRITICAL: expose these tables/functions to the Data API roles.
-- This project was created with "Automatically expose new tables" OFF, so
-- tables you create are NOT visible to PostgREST until granted — that's what
-- causes "Could not find the table public.X in the schema cache". RLS (enabled
-- above) still restricts which ROWS each user sees, so these grants are safe.
-- ============================================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.user_data to anon, authenticated;
grant select, insert, update, delete on public.coding_leaderboard to anon, authenticated;
grant select, insert, update, delete on public.app_leaderboard to anon, authenticated;
grant execute on function public.get_coding_leaderboard(text, text, text, int) to anon, authenticated;
grant execute on function public.get_my_coding_rank(text, text, text) to anon, authenticated;
grant execute on function public.get_coding_leaderboard_languages() to anon, authenticated;
grant execute on function public.get_coding_leaderboard_countries() to anon, authenticated;
grant execute on function public.get_app_leaderboard(text, text, text, text, int) to anon, authenticated;
grant execute on function public.get_my_app_rank(text, text, text, text) to anon, authenticated;
grant execute on function public.get_app_leaderboard_items(text) to anon, authenticated;
grant execute on function public.get_app_leaderboard_countries(text) to anon, authenticated;

-- Tell PostgREST to reload its schema cache immediately.
notify pgrst, 'reload schema';
