-- Dream analysis — a journal entry tagged #dream (a night-time dream) gets
-- a dream reading inside its reflection: the symbols, the feelings, where it
-- may touch waking life, and symbols that have come back in earlier dreams.
-- Null for every other entry.
--
-- dream: { symbols: [{ symbol, meaning }], feelings: [], waking_life: [],
--          recurring: [], question }
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje.

alter table public.journal_ai_insights
  add column if not exists dream jsonb;
