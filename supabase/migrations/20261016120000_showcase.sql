-- Showcase (Oct 16): artists share pieces from YOUrigin to be displayed on
-- YOU, credited, with links for how to support them.
--
--   1. artist_profiles  — one per artist: name, a line, support links, and
--                         an optional Kronk handle. Seen by others once the
--                         artist has a live piece.
--   2. showcase_works   — one per shared piece (image or words). Waits for
--                         an admin before anyone else sees it. Editing a
--                         piece sends it back to waiting. Only admins move a
--                         piece to live / declined / removed.
--   3. showcase_credits — "Offered by" lines. A credit whose Kronk handle
--                         matches an artist profile is linked to that artist
--                         automatically (the start of a credit chain Kronk
--                         can follow later).
--   4. showcase_saves   — a viewer's personal collection. A piece that asks
--                         for a contribution first can only be saved with
--                         "I've contributed" ticked (honour-based in V1).
--   5. showcase_reports — anyone signed in can report a live piece; admins
--                         read them.
--   6. storage bucket "showcase" — display-sized copies only, private;
--                         readable by the owner, admins, or anyone signed in
--                         once the piece is live.
--   7. review_showcase_work(), showcase_save_counts() — admin review and an
--                         artist's own save counts.
--
-- Uses public.admins (20261005160000_value_words.sql).
-- Additive; safe to re-run.
-- Run in the Supabase SQL editor for project yikoymzktspamahrsuje.

create or replace function public.showcase_is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.showcase_is_admin() from public, anon;
grant execute on function public.showcase_is_admin() to authenticated;

-- ── 1. artist_profiles ───────────────────────────────────────────────────
create table if not exists public.artist_profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 280),
  -- [{ "kind": "kofi" | "paypal" | "patreon" | "instagram" | "website" | "other", "label": text, "url": "https://…" }]
  links jsonb not null default '[]'::jsonb
    check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 8),
  kronk_handle text check (kronk_handle is null or kronk_handle ~* '^@[a-z0-9_]{1,30}@[a-z0-9.-]+\.[a-z]{2,}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists artist_profiles_kronk_handle_key
  on public.artist_profiles (lower(kronk_handle)) where kronk_handle is not null;
alter table public.artist_profiles enable row level security;

-- ── 2. showcase_works ────────────────────────────────────────────────────
create table if not exists public.showcase_works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- The YOUrigin piece it came from, so sharing the same piece again updates it.
  source_id text check (source_id is null or char_length(source_id) <= 64),
  kind text not null check (kind in ('image', 'words')),
  title text not null default '' check (char_length(title) <= 120),
  -- The words themselves, or an image's caption.
  body text not null default '' check (char_length(body) <= 4000),
  image_path text check (image_path is null or char_length(image_path) <= 200),
  image_width int check (image_width is null or image_width between 1 and 4000),
  image_height int check (image_height is null or image_height between 1 and 4000),
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  placements text[] not null
    check (cardinality(placements) >= 1
           and placements <@ array['home_background', 'featured_words', 'gallery']::text[]),
  save_mode text not null default 'free' check (save_mode in ('free', 'contribution')),
  suggested_amount text check (suggested_amount is null or char_length(suggested_amount) <= 40),
  rights_confirmed_at timestamptz not null,
  -- Set by YOUrigin on every Share; a new submission always waits for review.
  submitted_at timestamptz not null default now(),
  status text not null default 'waiting' check (status in ('waiting', 'live', 'declined', 'removed')),
  review_note text check (review_note is null or char_length(review_note) <= 500),
  reviewed_at timestamptz,
  live_at timestamptz,
  featured_at timestamptz,
  kronk_post_url text check (kronk_post_url is null or kronk_post_url ~* '^https://[^\s]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint showcase_image_has_file check (kind <> 'image' or image_path is not null),
  constraint showcase_words_has_text check (kind <> 'words' or char_length(btrim(body)) > 0),
  constraint showcase_background_is_image check (kind = 'image' or not ('home_background' = any (placements))),
  constraint showcase_featured_words_is_words check (kind = 'words' or not ('featured_words' = any (placements))),
  unique (user_id, source_id)
);
create index if not exists showcase_works_status_idx on public.showcase_works (status, featured_at desc);
alter table public.showcase_works enable row level security;

-- Artists can't review their own work: status and review fields only move
-- for admins, and changing what a piece shows sends it back to waiting.
create or replace function public.showcase_works_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if not public.showcase_is_admin() then
      new.user_id := auth.uid();
      new.status := 'waiting';
      new.review_note := null;
      new.reviewed_at := null;
      new.live_at := null;
      new.featured_at := null;
    end if;
    return new;
  end if;

  new.user_id := old.user_id;
  new.created_at := old.created_at;
  if public.showcase_is_admin() then
    return new;
  end if;

  new.status := old.status;
  new.review_note := old.review_note;
  new.reviewed_at := old.reviewed_at;
  new.live_at := old.live_at;
  new.featured_at := old.featured_at;
  if (new.kind, new.title, new.body, new.image_path, new.alt_text, new.placements, new.save_mode, new.suggested_amount, new.submitted_at)
     is distinct from
     (old.kind, old.title, old.body, old.image_path, old.alt_text, old.placements, old.save_mode, old.suggested_amount, old.submitted_at)
  then
    new.status := 'waiting';
    new.review_note := null;
  end if;
  return new;
end $$;
drop trigger if exists showcase_works_guard on public.showcase_works;
create trigger showcase_works_guard before insert or update on public.showcase_works
  for each row execute function public.showcase_works_guard();

drop policy if exists "showcase_works_select" on public.showcase_works;
create policy "showcase_works_select" on public.showcase_works
  for select to authenticated
  using (status = 'live' or user_id = (select auth.uid()) or (select public.showcase_is_admin()));
drop policy if exists "showcase_works_insert_own" on public.showcase_works;
create policy "showcase_works_insert_own" on public.showcase_works
  for insert to authenticated
  with check (user_id = (select auth.uid()) and rights_confirmed_at is not null);
drop policy if exists "showcase_works_update_own" on public.showcase_works;
create policy "showcase_works_update_own" on public.showcase_works
  for update to authenticated
  using (user_id = (select auth.uid()) or (select public.showcase_is_admin()))
  with check (user_id = (select auth.uid()) or (select public.showcase_is_admin()));
drop policy if exists "showcase_works_delete_own" on public.showcase_works;
create policy "showcase_works_delete_own" on public.showcase_works
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.showcase_is_admin()));

-- artist_profiles policies (need showcase_works to exist).
drop policy if exists "artist_profiles_select" on public.artist_profiles;
create policy "artist_profiles_select" on public.artist_profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.showcase_is_admin())
    or exists (select 1 from public.showcase_works w where w.user_id = artist_profiles.user_id and w.status = 'live')
  );
drop policy if exists "artist_profiles_insert_own" on public.artist_profiles;
create policy "artist_profiles_insert_own" on public.artist_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "artist_profiles_update_own" on public.artist_profiles;
create policy "artist_profiles_update_own" on public.artist_profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "artist_profiles_delete_own" on public.artist_profiles;
create policy "artist_profiles_delete_own" on public.artist_profiles
  for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.artist_profiles_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists artist_profiles_touch on public.artist_profiles;
create trigger artist_profiles_touch before update on public.artist_profiles
  for each row execute function public.artist_profiles_touch();

-- ── 3. showcase_credits ──────────────────────────────────────────────────
create table if not exists public.showcase_credits (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.showcase_works(id) on delete cascade,
  role text not null default 'offered_by' check (role in ('offered_by')),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  url text check (url is null or url ~* '^https://[^\s]+$'),
  kronk_handle text check (kronk_handle is null or kronk_handle ~* '^@[a-z0-9_]{1,30}@[a-z0-9.-]+\.[a-z]{2,}$'),
  -- Set by the server when kronk_handle matches an artist profile.
  artist_user_id uuid references auth.users(id) on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists showcase_credits_work_idx on public.showcase_credits (work_id, position);
create index if not exists showcase_credits_artist_idx on public.showcase_credits (artist_user_id) where artist_user_id is not null;
alter table public.showcase_credits enable row level security;

create or replace function public.showcase_credits_link()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.artist_user_id := null;
  if new.kronk_handle is not null then
    select p.user_id into new.artist_user_id
    from public.artist_profiles p
    where lower(p.kronk_handle) = lower(new.kronk_handle);
  end if;
  return new;
end $$;
drop trigger if exists showcase_credits_link on public.showcase_credits;
create trigger showcase_credits_link before insert or update on public.showcase_credits
  for each row execute function public.showcase_credits_link();

drop policy if exists "showcase_credits_select" on public.showcase_credits;
create policy "showcase_credits_select" on public.showcase_credits
  for select to authenticated
  using (exists (select 1 from public.showcase_works w where w.id = work_id));
-- Credits change only while the piece is waiting or declined, so nothing on a
-- live piece changes without a review.
drop policy if exists "showcase_credits_insert_own" on public.showcase_credits;
create policy "showcase_credits_insert_own" on public.showcase_credits
  for insert to authenticated
  with check (exists (select 1 from public.showcase_works w
                      where w.id = work_id and w.user_id = (select auth.uid()) and w.status in ('waiting', 'declined')));
drop policy if exists "showcase_credits_update_own" on public.showcase_credits;
create policy "showcase_credits_update_own" on public.showcase_credits
  for update to authenticated
  using (exists (select 1 from public.showcase_works w
                 where w.id = work_id and w.user_id = (select auth.uid()) and w.status in ('waiting', 'declined')))
  with check (exists (select 1 from public.showcase_works w
                      where w.id = work_id and w.user_id = (select auth.uid()) and w.status in ('waiting', 'declined')));
drop policy if exists "showcase_credits_delete_own" on public.showcase_credits;
create policy "showcase_credits_delete_own" on public.showcase_credits
  for delete to authenticated
  using (exists (select 1 from public.showcase_works w
                 where w.id = work_id and w.user_id = (select auth.uid()) and w.status in ('waiting', 'declined')));

-- ── 4. showcase_saves ────────────────────────────────────────────────────
create table if not exists public.showcase_saves (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  work_id uuid not null references public.showcase_works(id) on delete cascade,
  contributed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, work_id)
);
alter table public.showcase_saves enable row level security;
drop policy if exists "showcase_saves_select_own" on public.showcase_saves;
create policy "showcase_saves_select_own" on public.showcase_saves
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "showcase_saves_insert_own" on public.showcase_saves;
create policy "showcase_saves_insert_own" on public.showcase_saves
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.showcase_works w
                where w.id = work_id and w.status = 'live'
                  and (w.save_mode = 'free' or contributed))
  );
drop policy if exists "showcase_saves_delete_own" on public.showcase_saves;
create policy "showcase_saves_delete_own" on public.showcase_saves
  for delete to authenticated using (user_id = (select auth.uid()));

-- ── 5. showcase_reports ──────────────────────────────────────────────────
create table if not exists public.showcase_reports (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.showcase_works(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  unique (work_id, user_id)
);
alter table public.showcase_reports enable row level security;
drop policy if exists "showcase_reports_insert" on public.showcase_reports;
create policy "showcase_reports_insert" on public.showcase_reports
  for insert to authenticated
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.showcase_works w where w.id = work_id and w.status = 'live'));
drop policy if exists "showcase_reports_admin_select" on public.showcase_reports;
create policy "showcase_reports_admin_select" on public.showcase_reports
  for select to authenticated using ((select public.showcase_is_admin()));
drop policy if exists "showcase_reports_admin_delete" on public.showcase_reports;
create policy "showcase_reports_admin_delete" on public.showcase_reports
  for delete to authenticated using ((select public.showcase_is_admin()));

-- ── 6. storage ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('showcase', 'showcase', false, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "showcase_storage_select" on storage.objects;
create policy "showcase_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'showcase'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.showcase_is_admin())
      or exists (select 1 from public.showcase_works w where w.image_path = name and w.status = 'live')
    )
  );
drop policy if exists "showcase_storage_insert_own" on storage.objects;
create policy "showcase_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'showcase' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "showcase_storage_update_own" on storage.objects;
create policy "showcase_storage_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'showcase' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'showcase' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "showcase_storage_delete" on storage.objects;
create policy "showcase_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'showcase'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.showcase_is_admin())));

-- ── 7. functions ─────────────────────────────────────────────────────────
-- approve: live and featured now. feature: featured again now (live only).
-- decline / remove: with an optional note the artist sees in YOUrigin.
create or replace function public.review_showcase_work(p_id uuid, p_decision text, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.showcase_is_admin() then
    raise exception 'not allowed';
  end if;
  if p_decision = 'approve' then
    update public.showcase_works
       set status = 'live', review_note = null, reviewed_at = now(),
           live_at = coalesce(live_at, now()), featured_at = now()
     where id = p_id;
  elsif p_decision = 'feature' then
    update public.showcase_works set featured_at = now() where id = p_id and status = 'live';
  elsif p_decision in ('decline', 'remove') then
    update public.showcase_works
       set status = case when p_decision = 'decline' then 'declined' else 'removed' end,
           review_note = nullif(btrim(coalesce(p_note, '')), ''), reviewed_at = now()
     where id = p_id;
  else
    raise exception 'unknown decision %', p_decision;
  end if;
  if not found then
    raise exception 'no such piece';
  end if;
end $$;
revoke all on function public.review_showcase_work(uuid, text, text) from public, anon;
grant execute on function public.review_showcase_work(uuid, text, text) to authenticated;

-- How many people saved each of the caller's own pieces (never who).
create or replace function public.showcase_save_counts()
returns table (work_id uuid, saves bigint)
language sql stable security definer set search_path = public as $$
  select s.work_id, count(*)::bigint
  from public.showcase_saves s
  join public.showcase_works w on w.id = s.work_id
  where w.user_id = auth.uid()
  group by s.work_id;
$$;
revoke all on function public.showcase_save_counts() from public, anon;
grant execute on function public.showcase_save_counts() to authenticated;

notify pgrst, 'reload schema';
