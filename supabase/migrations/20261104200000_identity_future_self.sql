-- Meet your future self (Nov 4 2026): what the Identity journey keeps with
-- each vision, and the pursuits that grow it.
--
-- journey: { horizon, day, voices: [{ who, says }], already, letter,
--            obstacle, plan }, every part optional. Written by the
--            "Meet your future self" experience; editable afterwards.
-- item_ids: the habits, goals and dreams that are votes for this self.
--            Ids of a pursuit later deleted are ignored by the app.
--
-- Additive only: two new columns with empty defaults, so existing visions
-- and the app already in people's hands keep working unchanged. Row-level
-- security already limits identity_visions to their owner.
-- Approved by Cassidy, Nov 4 ("Yes, build it"). Backup taken first.

alter table public.identity_visions
  add column if not exists journey jsonb not null default '{}'::jsonb,
  add column if not exists item_ids uuid[] not null default '{}'::uuid[];
