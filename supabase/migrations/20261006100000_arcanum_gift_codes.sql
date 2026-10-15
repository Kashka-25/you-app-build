-- Gift codes for paid Arcana (Oct 6).
--
-- Cassidy can give a code (e.g. to a beta tester) that unlocks a paid
-- Arcanum for free. Redeeming happens only through redeem_arcanum_code(),
-- which checks the code server-side and grants user_arcana as a 'gift', so
-- the client can never grant itself a paid Arcanum.
--
--   arcanum_codes             — the codes: which Arcanum, how many uses,
--                               an optional end date. Never readable from
--                               the app (no policies), so codes can't be
--                               listed or guessed from it.
--   arcanum_code_redemptions  — who redeemed which code, once each.
--   redeem_arcanum_code(code) — returns the slug unlocked, or raises a
--                               plain-language error.
--
-- Additive; safe to re-run.
-- Run in the Supabase SQL editor for project yikoymzktspamahrsuje.

create table if not exists public.arcanum_codes (
  code text primary key check (code = upper(code) and char_length(code) between 6 and 40),
  slug text not null references public.arcana(slug) on delete cascade,
  max_uses integer not null default 1 check (max_uses >= 1),
  uses integer not null default 0 check (uses >= 0),
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
alter table public.arcanum_codes enable row level security;
-- No policies: reached only through redeem_arcanum_code().

create table if not exists public.arcanum_code_redemptions (
  code text not null references public.arcanum_codes(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (code, user_id)
);
alter table public.arcanum_code_redemptions enable row level security;
drop policy if exists "arcanum_code_redemptions_select_own" on public.arcanum_code_redemptions;
create policy "arcanum_code_redemptions_select_own" on public.arcanum_code_redemptions
  for select using (auth.uid() = user_id);

create or replace function public.redeem_arcanum_code(p_code text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  c public.arcanum_codes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in to use a gift code.';
  end if;

  select * into c from public.arcanum_codes where code = v_code for update;
  if not found then
    raise exception 'That code wasn''t recognised. Check it and try again.';
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    raise exception 'That code has expired.';
  end if;
  if exists (select 1 from public.user_arcana ua where ua.user_id = auth.uid() and ua.slug = c.slug) then
    raise exception 'This Arcanum is already in your Library.';
  end if;
  if c.uses >= c.max_uses then
    raise exception 'That code has already been used.';
  end if;

  insert into public.user_arcana (user_id, slug, source) values (auth.uid(), c.slug, 'gift');
  insert into public.arcanum_code_redemptions (code, user_id) values (c.code, auth.uid());
  update public.arcanum_codes set uses = uses + 1 where code = c.code;
  return c.slug;
end $$;

revoke all on function public.redeem_arcanum_code(text) from public, anon;
grant execute on function public.redeem_arcanum_code(text) to authenticated;

notify pgrst, 'reload schema';
