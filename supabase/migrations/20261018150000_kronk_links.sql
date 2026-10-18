-- Kronk links (Oct 18): a YOU account connected to a Kronk (kronk.info,
-- Mastodon) account. Made by the `kronk` Edge Function after the Seeker
-- approves YOU on Kronk; used to show their Kronk feed in CommYOUnity, post
-- for them, and let them sign in to YOU with Kronk.
--
-- The access token never leaves the server: Seekers can read every column
-- of their own row except access_token, and only the service role writes.

create table if not exists public.kronk_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kronk_account_id text not null,
  handle text not null check (handle ~* '^@[a-z0-9_]{1,30}@[a-z0-9.-]+\.[a-z]{2,}$'),
  display_name text not null default '' check (char_length(display_name) <= 120),
  avatar_url text check (avatar_url is null or avatar_url ~* '^https://'),
  profile_url text check (profile_url is null or profile_url ~* '^https://'),
  access_token text not null,
  scopes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- One YOU account per Kronk account, so "Continue with Kronk" is never ambiguous.
create unique index if not exists kronk_links_account_key on public.kronk_links (kronk_account_id);

alter table public.kronk_links enable row level security;

revoke all on public.kronk_links from anon, authenticated;
grant select (user_id, kronk_account_id, handle, display_name, avatar_url, profile_url, scopes, created_at, updated_at)
  on public.kronk_links to authenticated;

drop policy if exists "kronk_links_select_own" on public.kronk_links;
create policy "kronk_links_select_own" on public.kronk_links
  for select to authenticated using ((select auth.uid()) = user_id);
