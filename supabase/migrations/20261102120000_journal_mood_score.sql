-- Journal entries take the same 0–100 mood scale as the Home check-in
-- (Cassidy, Oct 28 / Nov 2): the exact score is kept, and `mood` still holds
-- the band's key (rough / low / okay / good / great) so everything that reads
-- the old five moods keeps working.

alter table public.journal_entries
  add column if not exists mood_score smallint
  check (mood_score is null or mood_score between 0 and 100);

comment on column public.journal_entries.mood_score is
  'How the writer felt, 0–100 (the mood scale); mood holds its band key.';
