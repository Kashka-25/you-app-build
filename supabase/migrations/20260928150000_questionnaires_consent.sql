-- Questionnaires + AI consent (Sep 28).
--
--   1. ai_consent   — explicit, revocable consent before any reflection text
--                     (journal entries, photographed pages, memories,
--                     questionnaire answers) reaches the Claude API. Checked
--                     by the app AND by every Edge Function that sends such
--                     text. No row, or granted = false, means no.
--   2. reflections  — extended for the two questionnaires:
--                     Light & Shadow of a Value (light/shadow/void/integration)
--                     Freeing the Dream, per Pillar (longing/vision/weight/seed
--                     + an outcome: planted / held / released).
--                     session_id groups one sitting's answers so a Seeker can
--                     stop and return.
--
-- Reflections stay owner-only (RLS from 20260928140000_values_system.sql)
-- and are never read by analytics.
--
-- Additive; safe to re-run.
-- Run in the Supabase SQL editor for project yikoymzktspamahrsuje.

-- ── 1. ai_consent ────────────────────────────────────────────────────────
create table if not exists public.ai_consent (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted boolean not null default false,
  granted_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.ai_consent enable row level security;

drop policy if exists "ai_consent_select_own" on public.ai_consent;
create policy "ai_consent_select_own" on public.ai_consent
  for select using (auth.uid() = user_id);

drop policy if exists "ai_consent_insert_own" on public.ai_consent;
create policy "ai_consent_insert_own" on public.ai_consent
  for insert with check (auth.uid() = user_id);

drop policy if exists "ai_consent_update_own" on public.ai_consent;
create policy "ai_consent_update_own" on public.ai_consent
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 2. reflections ───────────────────────────────────────────────────────
alter table public.reflections
  add column if not exists questionnaire text,
  add column if not exists session_id uuid,
  add column if not exists pillar text;

alter table public.reflections drop constraint if exists reflections_kind_check;
alter table public.reflections add constraint reflections_kind_check check (kind in (
  'light','shadow','void','integration',         -- Light & Shadow of a Value
  'longing','vision','weight','seed','outcome',   -- Freeing the Dream
  'definition','freeform'
));

alter table public.reflections drop constraint if exists reflections_questionnaire_check;
alter table public.reflections add constraint reflections_questionnaire_check
  check (questionnaire is null or questionnaire in ('light_shadow','freeing_dream'));

create index if not exists reflections_session_idx
  on public.reflections (user_id, session_id);

-- One answer per step per sitting, so saving a step again updates it.
create unique index if not exists reflections_session_kind_uniq
  on public.reflections (session_id, kind) where session_id is not null;

notify pgrst, 'reload schema';
