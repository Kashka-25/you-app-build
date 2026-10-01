-- Wanderings — travel plans that live as part of a Dream. A Wandering is a
-- dream's plan made concrete: an ordered list of stops on a map.
--
-- wanderings:       one per dream (item_id), with its own title. Dates and
--                   status (dreaming / planned / travelling / travelled) are
--                   derived from its stops, never stored twice.
-- wandering_stops:  ordered places. Coordinates come from the place search
--                   when the stop is added (only the place name is ever sent
--                   to it) and are kept here so the map needs no lookups.
--                   day_plans: { "YYYY-MM-DD": [{ text, done }] } — what each
--                   day at that stop holds, shown on the Threshold that day.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.wanderings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid references public.items(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create table if not exists public.wandering_stops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wandering_id uuid not null references public.wanderings(id) on delete cascade,
  position integer not null default 0,
  place_name text not null,
  place_detail text,
  country_code text,
  lat double precision not null,
  lng double precision not null,
  kind text not null default 'stay' check (kind in ('stay', 'visit', 'transit')),
  arrive date,
  depart date,
  note text,
  day_plans jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (depart is null or arrive is null or depart >= arrive)
);

create index if not exists wandering_stops_wandering_idx
  on public.wandering_stops (wandering_id, position);

-- Rows may only point at the Seeker's own dream / own Wandering, not just
-- carry their user_id. (items.user_id is text in this schema, hence ::text.)
alter table public.wanderings enable row level security;
alter table public.wandering_stops enable row level security;

drop policy if exists "wanderings_select_own" on public.wanderings;
create policy "wanderings_select_own" on public.wanderings for select using (auth.uid() = user_id);
drop policy if exists "wanderings_insert_own" on public.wanderings;
create policy "wanderings_insert_own" on public.wanderings for insert with check (auth.uid() = user_id and (item_id is null or exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()::text)));
drop policy if exists "wanderings_update_own" on public.wanderings;
create policy "wanderings_update_own" on public.wanderings for update using (auth.uid() = user_id) with check (auth.uid() = user_id and (item_id is null or exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()::text)));
drop policy if exists "wanderings_delete_own" on public.wanderings;
create policy "wanderings_delete_own" on public.wanderings for delete using (auth.uid() = user_id);

drop policy if exists "wandering_stops_select_own" on public.wandering_stops;
create policy "wandering_stops_select_own" on public.wandering_stops for select using (auth.uid() = user_id);
drop policy if exists "wandering_stops_insert_own" on public.wandering_stops;
create policy "wandering_stops_insert_own" on public.wandering_stops for insert with check (auth.uid() = user_id and exists (select 1 from public.wanderings y where y.id = wandering_id and y.user_id = auth.uid()));
drop policy if exists "wandering_stops_update_own" on public.wandering_stops;
create policy "wandering_stops_update_own" on public.wandering_stops for update using (auth.uid() = user_id) with check (auth.uid() = user_id and exists (select 1 from public.wanderings y where y.id = wandering_id and y.user_id = auth.uid()));
drop policy if exists "wandering_stops_delete_own" on public.wandering_stops;
create policy "wandering_stops_delete_own" on public.wandering_stops for delete using (auth.uid() = user_id);
