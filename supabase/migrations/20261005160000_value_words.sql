-- Values in a Seeker's own words, and Codex requests for Cassidy (Oct 5).
--
-- A Seeker can name a value the Codex doesn't hold yet: as one of their own
-- values (YOU tab), or as a word a challenge honoured (a course). Each such
-- word is noted here so Cassidy can see which values people reach for, and
-- write them into the Codex.
--
--   1. admins            — who may see Codex requests. A Seeker can only see
--                          whether they themselves are one.
--   2. value_words       — one row per Seeker per word (lower-cased), owner-
--                          only. Never shown to anyone else as-is.
--   3. codex_word_reviews — Cassidy's status for each word: new, planned,
--                          added, declined. Admins only.
--   4. codex_word_requests() — admins only: each word with HOW MANY people
--                          used it and when; never who, and never the
--                          reflection or challenge it came with.
--      set_codex_word_status(word, status) — admins only.
--
-- Additive; safe to re-run.
-- Run in the Supabase SQL editor for project yikoymzktspamahrsuje.

-- ── 1. admins ────────────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admins_select_self" on public.admins;
create policy "admins_select_self" on public.admins
  for select using (auth.uid() = user_id);

insert into public.admins (user_id)
select id from auth.users where email = 'kasiahrd@proton.me'
on conflict do nothing;

-- ── 2. value_words ───────────────────────────────────────────────────────
create table if not exists public.value_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null check (char_length(word) between 1 and 40),
  normalized text not null check (char_length(normalized) between 1 and 40),
  source text not null default 'course' check (source in ('course','values')),
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  unique (user_id, normalized)
);
alter table public.value_words enable row level security;
drop policy if exists "value_words_select_own" on public.value_words;
create policy "value_words_select_own" on public.value_words
  for select using (auth.uid() = user_id);
drop policy if exists "value_words_insert_own" on public.value_words;
create policy "value_words_insert_own" on public.value_words
  for insert with check (auth.uid() = user_id);
drop policy if exists "value_words_update_own" on public.value_words;
create policy "value_words_update_own" on public.value_words
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "value_words_delete_own" on public.value_words;
create policy "value_words_delete_own" on public.value_words
  for delete using (auth.uid() = user_id);

-- ── 3. codex_word_reviews ────────────────────────────────────────────────
create table if not exists public.codex_word_reviews (
  normalized text primary key,
  status text not null default 'new' check (status in ('new','planned','added','declined')),
  updated_at timestamptz not null default now()
);
alter table public.codex_word_reviews enable row level security;
-- No policies: reached only through the admin functions below.

-- ── 4. admin functions ───────────────────────────────────────────────────
create or replace function public.codex_word_requests()
returns table (normalized text, word text, people bigint, first_seen timestamptz, last_seen timestamptz, status text)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed';
  end if;
  return query
    select w.normalized,
           (array_agg(w.word order by w.created_at))[1] as word,
           count(distinct w.user_id) as people,
           min(w.created_at) as first_seen,
           max(w.last_used_at) as last_seen,
           coalesce(r.status, 'new') as status
    from public.value_words w
    left join public.codex_word_reviews r on r.normalized = w.normalized
    group by w.normalized, r.status
    order by (coalesce(r.status, 'new') = 'new') desc, count(distinct w.user_id) desc, max(w.last_used_at) desc;
end $$;

create or replace function public.set_codex_word_status(p_normalized text, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed';
  end if;
  insert into public.codex_word_reviews (normalized, status, updated_at)
  values (p_normalized, p_status, now())
  on conflict (normalized) do update set status = excluded.status, updated_at = now();
end $$;

revoke all on function public.codex_word_requests() from public, anon;
revoke all on function public.set_codex_word_status(text, text) from public, anon;
grant execute on function public.codex_word_requests() to authenticated;
grant execute on function public.set_codex_word_status(text, text) to authenticated;

notify pgrst, 'reload schema';
