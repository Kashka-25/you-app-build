-- YOU · live database schema (public + storage policies)
-- Generated 2026-11-04 by supabase/schema/snapshot.mjs. Do not edit by hand.
-- A record of what the database is, not a migration: never run it against
-- the live project. To rebuild a fresh project (e.g. a separate staging
-- database), run it there first, then nothing else is needed.

create table if not exists public.admins (
  user_id uuid not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.ai_consent (
  user_id uuid not null,
  granted boolean not null default false,
  granted_at timestamp with time zone,
  revoked_at timestamp with time zone,
  updated_at timestamp with time zone not null default now(),
  include_courses boolean not null default false,
  courses_asked_at timestamp with time zone,
  sources text[]
);

create table if not exists public.ai_usage (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  fn text not null,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.arcana (
  slug text not null,
  is_free boolean not null default false,
  published boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.arcanum_code_redemptions (
  code text not null,
  user_id uuid not null,
  redeemed_at timestamp with time zone not null default now()
);

create table if not exists public.arcanum_codes (
  code text not null,
  slug text not null,
  max_uses integer not null default 1,
  uses integer not null default 0,
  expires_at timestamp with time zone,
  note text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.arcanum_progress (
  user_id uuid not null,
  slug text not null,
  part_id text not null,
  data jsonb not null default '{}'::jsonb,
  value_name text,
  completed_on date not null,
  completed_at timestamp with time zone not null default now(),
  rest_skipped_at timestamp with time zone,
  walk integer not null default 1,
  summary jsonb
);

create table if not exists public.arcanum_walks (
  user_id uuid not null,
  slug text not null,
  walk integer not null,
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone
);

create table if not exists public.artist_profiles (
  user_id uuid not null default auth.uid(),
  display_name text not null,
  bio text not null default ''::text,
  links jsonb not null default '[]'::jsonb,
  kronk_handle text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.beta_feedback (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  body text not null,
  kind text not null default 'idea'::text,
  screen text,
  notion_url text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.client_errors (
  id uuid not null default gen_random_uuid(),
  user_id uuid default auth.uid(),
  message text not null,
  stack text,
  path text,
  user_agent text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.codex_word_reviews (
  normalized text not null,
  status text not null default 'new'::text,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.dream_patterns (
  user_id uuid not null,
  reading jsonb not null,
  dream_count integer not null default 0,
  first_dream date,
  last_dream date,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.entitlements (
  user_id uuid not null,
  is_premium boolean not null default false,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.focus_sessions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  item_id uuid,
  intention_id uuid,
  label text not null,
  pillar text,
  value_name text,
  planned_minutes integer,
  minutes integer not null default 0,
  outcome text not null,
  note text,
  xp integer not null default 0,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone not null default now(),
  date_key date not null,
  mementos jsonb not null default '[]'::jsonb
);

create table if not exists public.habit_logs (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  item_id uuid not null,
  day date not null,
  step text not null default 'habit'::text,
  amount numeric,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.identity_visions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  category text not null default ''::text,
  title text not null,
  statement text not null,
  reflection text,
  vision_date date not null default CURRENT_DATE,
  inserted_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.items (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  type text not null,
  cat text,
  note text,
  tags text[],
  intention text,
  milestones jsonb,
  done boolean default false,
  streak integer default 0,
  days boolean[],
  created text,
  created_date text,
  inserted_at timestamp with time zone default now(),
  last_checkin text,
  subcat text not null default ''::text,
  released_at timestamp with time zone,
  daily_target jsonb
);

create table if not exists public.journal_ai_insights (
  id uuid not null default gen_random_uuid(),
  entry_id uuid not null,
  user_id uuid not null,
  summary text,
  insights jsonb not null default '[]'::jsonb,
  connections jsonb not null default '{}'::jsonb,
  reflection_question text,
  suggested_next_step text,
  model text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  highlights jsonb not null default '[]'::jsonb,
  dream jsonb
);

create table if not exists public.journal_entries (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  content text not null,
  mood text,
  entry_date date not null default CURRENT_DATE,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  tags text[] not null default '{}'::text[],
  stop_id uuid,
  mood_score smallint
);

create table if not exists public.journal_highlights (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  entry_id uuid,
  entry_date date,
  text text not null,
  tags text[] not null default '{}'::text[],
  item_id uuid,
  as_memento boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.journal_photos (
  id uuid not null default gen_random_uuid(),
  entry_id uuid not null,
  user_id uuid not null,
  storage_path text not null,
  transcription text,
  transcription_status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.kronk_links (
  user_id uuid not null,
  kronk_account_id text not null,
  handle text not null,
  display_name text not null default ''::text,
  avatar_url text,
  profile_url text,
  access_token text not null,
  scopes text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.life_chapters (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  range_start date not null,
  range_end date not null,
  blurb text default ''::text,
  inserted_at timestamp with time zone not null default now()
);

create table if not exists public.life_moments (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text default ''::text,
  moment_date date not null,
  photo_path text,
  inserted_at timestamp with time zone not null default now(),
  stop_id uuid,
  photo_paths text[] not null default '{}'::text[]
);

create table if not exists public.memory (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  type text not null,
  xp integer,
  date text,
  date_key text,
  inserted_at timestamp with time zone default now(),
  cat text,
  tags text[]
);

create table if not exists public.mood_log (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  mood text,
  energy integer,
  date text,
  date_key text,
  inserted_at timestamp with time zone default now(),
  score smallint
);

create table if not exists public.own_tools (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  learned_from text,
  purpose text,
  how text,
  used_dates date[] not null default '{}'::date[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.profiles (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  name text,
  birthday text,
  birth_time text,
  birthplace text,
  sun_sign text,
  moon_sign text,
  rising_sign text,
  inserted_at timestamp with time zone default now(),
  bio text,
  location text,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.project_notes (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid not null,
  text text not null,
  status text not null default 'new'::text,
  entry_id uuid,
  done_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.projects (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  colour text not null default 'gold'::text,
  "position" integer not null default 0,
  archived_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.reflections (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  value_name text,
  kind text not null,
  prompt text,
  body text not null,
  inserted_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  questionnaire text,
  session_id uuid,
  pillar text
);

create table if not exists public.seasons (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  blurb text not null default ''::text,
  signals jsonb not null default '[]'::jsonb,
  based_on jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.showcase_credits (
  id uuid not null default gen_random_uuid(),
  work_id uuid not null,
  role text not null default 'offered_by'::text,
  name text not null,
  url text,
  kronk_handle text,
  artist_user_id uuid,
  "position" integer not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.showcase_reports (
  id uuid not null default gen_random_uuid(),
  work_id uuid not null,
  user_id uuid not null default auth.uid(),
  reason text not null default ''::text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.showcase_saves (
  user_id uuid not null default auth.uid(),
  work_id uuid not null,
  contributed boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.showcase_works (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  source_id text,
  kind text not null,
  title text not null default ''::text,
  body text not null default ''::text,
  image_path text,
  image_width integer,
  image_height integer,
  alt_text text not null default ''::text,
  placements text[] not null,
  save_mode text not null default 'free'::text,
  suggested_amount text,
  rights_confirmed_at timestamp with time zone not null,
  submitted_at timestamp with time zone not null default now(),
  status text not null default 'waiting'::text,
  review_note text,
  reviewed_at timestamp with time zone,
  live_at timestamp with time zone,
  featured_at timestamp with time zone,
  kronk_post_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  words_scroll boolean not null default true
);

create table if not exists public.todos (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  text text not null,
  todo_date date not null default CURRENT_DATE,
  done boolean not null default false,
  inserted_at timestamp with time zone not null default now(),
  steps jsonb not null default '[]'::jsonb
);

create table if not exists public.tool_uses (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  slug text not null,
  tool_id text not null,
  data jsonb not null default '{}'::jsonb,
  used_on date not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.user_arcana (
  user_id uuid not null,
  slug text not null,
  source text not null default 'free'::text,
  acquired_at timestamp with time zone not null default now()
);

create table if not exists public.user_values (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  rating integer default 0,
  completed jsonb default '[]'::jsonb,
  inserted_at timestamp with time zone default now(),
  prestige integer not null default 0,
  status text not null default 'active'::text,
  definition text,
  definition_history jsonb not null default '[]'::jsonb,
  highest_tier_reached integer not null default 0,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.user_xp (
  user_id uuid not null,
  total_xp integer default 0,
  updated_at timestamp with time zone default now()
);

create table if not exists public.value_challenges (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  value_name text not null,
  text text not null,
  pts integer not null default 5,
  diff text default 'bold'::text,
  completed boolean not null default false,
  inserted_at timestamp with time zone not null default now()
);

create table if not exists public.value_compass (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  ordering jsonb not null,
  compass_line text,
  hardest jsonb,
  crossings integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.value_words (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  word text not null,
  normalized text not null,
  source text not null default 'course'::text,
  created_at timestamp with time zone not null default now(),
  last_used_at timestamp with time zone not null default now()
);

create table if not exists public.values_library (
  slug text not null,
  name text not null,
  element text not null,
  essence text not null default ''::text,
  light text not null default ''::text,
  shadow text not null default ''::text,
  void text not null default ''::text,
  pillars text[] not null default '{}'::text[],
  balancing_kin text[] not null default '{}'::text[],
  nourishing_kin text[] not null default '{}'::text[],
  synonyms text[] not null default '{}'::text[],
  parent_slug text,
  inserted_at timestamp with time zone not null default now()
);

create table if not exists public.wandering_stops (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  wandering_id uuid not null,
  "position" integer not null default 0,
  place_name text not null,
  place_detail text,
  country_code text,
  lat double precision not null,
  lng double precision not null,
  kind text not null default 'stay'::text,
  arrive date,
  depart date,
  note text,
  day_plans jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  date_precision text not null default 'day'::text
);

create table if not exists public.wanderings (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  item_id uuid,
  title text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.week_harvests (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  week_start date not null,
  note text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.week_intentions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  item_id uuid not null,
  week_start date not null,
  days smallint[] not null default '{}'::smallint[],
  value_name text,
  tended_dates date[] not null default '{}'::date[],
  rested_dates date[] not null default '{}'::date[],
  inserted_at timestamp with time zone not null default now(),
  outcome text
);

create table if not exists public.weekly_reflections (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  week_start date not null,
  week_end date not null,
  sections jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.younderstandings (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  question text not null,
  answer jsonb not null,
  drew_from jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.yourigin_records (
  user_id uuid not null default auth.uid(),
  tbl text not null,
  id text not null,
  updated_at bigint not null,
  deleted boolean not null default false,
  payload text,
  iv text,
  rev bigint not null default nextval('yourigin_records_rev_seq'::regclass)
);

create table if not exists public.yourigin_sync_keys (
  user_id uuid not null default auth.uid(),
  salt text not null,
  verifier text not null,
  verifier_iv text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.admins add constraint admins_pkey PRIMARY KEY (user_id);

alter table public.admins add constraint admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.ai_consent add constraint ai_consent_pkey PRIMARY KEY (user_id);

alter table public.ai_consent add constraint ai_consent_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.ai_usage add constraint ai_usage_pkey PRIMARY KEY (id);

alter table public.ai_usage add constraint ai_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.arcana add constraint arcana_pkey PRIMARY KEY (slug);

alter table public.arcanum_code_redemptions add constraint arcanum_code_redemptions_code_fkey FOREIGN KEY (code) REFERENCES arcanum_codes(code) ON DELETE CASCADE;

alter table public.arcanum_code_redemptions add constraint arcanum_code_redemptions_pkey PRIMARY KEY (code, user_id);

alter table public.arcanum_code_redemptions add constraint arcanum_code_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.arcanum_codes add constraint arcanum_codes_code_check CHECK (((code = upper(code)) AND ((char_length(code) >= 6) AND (char_length(code) <= 40))));

alter table public.arcanum_codes add constraint arcanum_codes_max_uses_check CHECK ((max_uses >= 1));

alter table public.arcanum_codes add constraint arcanum_codes_pkey PRIMARY KEY (code);

alter table public.arcanum_codes add constraint arcanum_codes_slug_fkey FOREIGN KEY (slug) REFERENCES arcana(slug) ON DELETE CASCADE;

alter table public.arcanum_codes add constraint arcanum_codes_uses_check CHECK ((uses >= 0));

alter table public.arcanum_progress add constraint arcanum_progress_part_id_check CHECK (((char_length(part_id) >= 1) AND (char_length(part_id) <= 80)));

alter table public.arcanum_progress add constraint arcanum_progress_pkey PRIMARY KEY (user_id, slug, walk, part_id);

alter table public.arcanum_progress add constraint arcanum_progress_slug_fkey FOREIGN KEY (slug) REFERENCES arcana(slug) ON DELETE CASCADE;

alter table public.arcanum_progress add constraint arcanum_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.arcanum_walks add constraint arcanum_walks_pkey PRIMARY KEY (user_id, slug, walk);

alter table public.arcanum_walks add constraint arcanum_walks_slug_fkey FOREIGN KEY (slug) REFERENCES arcana(slug) ON DELETE CASCADE;

alter table public.arcanum_walks add constraint arcanum_walks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.arcanum_walks add constraint arcanum_walks_walk_check CHECK ((walk >= 1));

alter table public.artist_profiles add constraint artist_profiles_bio_check CHECK ((char_length(bio) <= 280));

alter table public.artist_profiles add constraint artist_profiles_display_name_check CHECK (((char_length(btrim(display_name)) >= 1) AND (char_length(btrim(display_name)) <= 60)));

alter table public.artist_profiles add constraint artist_profiles_kronk_handle_check CHECK (((kronk_handle IS NULL) OR (kronk_handle ~* '^@[a-z0-9_]{1,30}@[a-z0-9.-]+\.[a-z]{2,}$'::text)));

alter table public.artist_profiles add constraint artist_profiles_links_check CHECK (((jsonb_typeof(links) = 'array'::text) AND (jsonb_array_length(links) <= 8)));

alter table public.artist_profiles add constraint artist_profiles_pkey PRIMARY KEY (user_id);

alter table public.artist_profiles add constraint artist_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.beta_feedback add constraint beta_feedback_body_check CHECK (((char_length(btrim(body)) >= 1) AND (char_length(btrim(body)) <= 5000)));

alter table public.beta_feedback add constraint beta_feedback_kind_check CHECK ((kind = ANY (ARRAY['idea'::text, 'problem'::text, 'love'::text])));

alter table public.beta_feedback add constraint beta_feedback_pkey PRIMARY KEY (id);

alter table public.beta_feedback add constraint beta_feedback_screen_check CHECK ((char_length(screen) <= 200));

alter table public.beta_feedback add constraint beta_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.client_errors add constraint client_errors_message_check CHECK ((char_length(message) <= 500));

alter table public.client_errors add constraint client_errors_path_check CHECK ((char_length(path) <= 200));

alter table public.client_errors add constraint client_errors_pkey PRIMARY KEY (id);

alter table public.client_errors add constraint client_errors_stack_check CHECK ((char_length(stack) <= 4000));

alter table public.client_errors add constraint client_errors_user_agent_check CHECK ((char_length(user_agent) <= 300));

alter table public.client_errors add constraint client_errors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.codex_word_reviews add constraint codex_word_reviews_pkey PRIMARY KEY (normalized);

alter table public.codex_word_reviews add constraint codex_word_reviews_status_check CHECK ((status = ANY (ARRAY['new'::text, 'planned'::text, 'added'::text, 'declined'::text])));

alter table public.dream_patterns add constraint dream_patterns_pkey PRIMARY KEY (user_id);

alter table public.dream_patterns add constraint dream_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.entitlements add constraint entitlements_pkey PRIMARY KEY (user_id);

alter table public.entitlements add constraint entitlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.focus_sessions add constraint focus_sessions_intention_id_fkey FOREIGN KEY (intention_id) REFERENCES week_intentions(id) ON DELETE SET NULL;

alter table public.focus_sessions add constraint focus_sessions_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;

alter table public.focus_sessions add constraint focus_sessions_outcome_check CHECK ((outcome = ANY (ARRAY['bloom'::text, 'seed'::text])));

alter table public.focus_sessions add constraint focus_sessions_pkey PRIMARY KEY (id);

alter table public.focus_sessions add constraint focus_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.habit_logs add constraint habit_logs_amount_check CHECK (((amount IS NULL) OR (amount >= (0)::numeric)));

alter table public.habit_logs add constraint habit_logs_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

alter table public.habit_logs add constraint habit_logs_pkey PRIMARY KEY (id);

alter table public.habit_logs add constraint habit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.identity_visions add constraint identity_visions_pkey PRIMARY KEY (id);

alter table public.identity_visions add constraint identity_visions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.items add constraint items_pkey PRIMARY KEY (id);

alter table public.items add constraint items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.journal_ai_insights add constraint journal_ai_insights_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;

alter table public.journal_ai_insights add constraint journal_ai_insights_entry_id_key UNIQUE (entry_id);

alter table public.journal_ai_insights add constraint journal_ai_insights_pkey PRIMARY KEY (id);

alter table public.journal_ai_insights add constraint journal_ai_insights_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.journal_entries add constraint journal_entries_mood_score_check CHECK (((mood_score IS NULL) OR ((mood_score >= 0) AND (mood_score <= 100))));

alter table public.journal_entries add constraint journal_entries_pkey PRIMARY KEY (id);

alter table public.journal_entries add constraint journal_entries_stop_id_fkey FOREIGN KEY (stop_id) REFERENCES wandering_stops(id) ON DELETE SET NULL;

alter table public.journal_entries add constraint journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.journal_highlights add constraint journal_highlights_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;

alter table public.journal_highlights add constraint journal_highlights_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;

alter table public.journal_highlights add constraint journal_highlights_pkey PRIMARY KEY (id);

alter table public.journal_highlights add constraint journal_highlights_text_check CHECK (((char_length(text) >= 1) AND (char_length(text) <= 600)));

alter table public.journal_highlights add constraint journal_highlights_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.journal_photos add constraint journal_photos_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;

alter table public.journal_photos add constraint journal_photos_pkey PRIMARY KEY (id);

alter table public.journal_photos add constraint journal_photos_transcription_status_check CHECK ((transcription_status = ANY (ARRAY['pending'::text, 'done'::text, 'failed'::text])));

alter table public.journal_photos add constraint journal_photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.kronk_links add constraint kronk_links_avatar_url_check CHECK (((avatar_url IS NULL) OR (avatar_url ~* '^https://'::text)));

alter table public.kronk_links add constraint kronk_links_display_name_check CHECK ((char_length(display_name) <= 120));

alter table public.kronk_links add constraint kronk_links_handle_check CHECK ((handle ~* '^@[a-z0-9_]{1,30}@[a-z0-9.-]+\.[a-z]{2,}$'::text));

alter table public.kronk_links add constraint kronk_links_pkey PRIMARY KEY (user_id);

alter table public.kronk_links add constraint kronk_links_profile_url_check CHECK (((profile_url IS NULL) OR (profile_url ~* '^https://'::text)));

alter table public.kronk_links add constraint kronk_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.life_chapters add constraint life_chapters_pkey PRIMARY KEY (id);

alter table public.life_chapters add constraint life_chapters_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.life_moments add constraint life_moments_pkey PRIMARY KEY (id);

alter table public.life_moments add constraint life_moments_stop_id_fkey FOREIGN KEY (stop_id) REFERENCES wandering_stops(id) ON DELETE SET NULL;

alter table public.life_moments add constraint life_moments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.memory add constraint memory_pkey PRIMARY KEY (id);

alter table public.memory add constraint memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.mood_log add constraint mood_log_pkey PRIMARY KEY (id);

alter table public.mood_log add constraint mood_log_score_check CHECK (((score IS NULL) OR ((score >= 0) AND (score <= 100))));

alter table public.mood_log add constraint mood_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.own_tools add constraint own_tools_how_check CHECK ((char_length(how) <= 4000));

alter table public.own_tools add constraint own_tools_learned_from_check CHECK ((char_length(learned_from) <= 200));

alter table public.own_tools add constraint own_tools_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 120)));

alter table public.own_tools add constraint own_tools_pkey PRIMARY KEY (id);

alter table public.own_tools add constraint own_tools_purpose_check CHECK ((char_length(purpose) <= 1000));

alter table public.own_tools add constraint own_tools_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);

alter table public.profiles add constraint profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.profiles add constraint profiles_user_id_key UNIQUE (user_id);

alter table public.project_notes add constraint project_notes_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;

alter table public.project_notes add constraint project_notes_pkey PRIMARY KEY (id);

alter table public.project_notes add constraint project_notes_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

alter table public.project_notes add constraint project_notes_status_check CHECK ((status = ANY (ARRAY['new'::text, 'doing'::text, 'done'::text])));

alter table public.project_notes add constraint project_notes_text_check CHECK (((char_length(text) >= 1) AND (char_length(text) <= 4000)));

alter table public.project_notes add constraint project_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.projects add constraint projects_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 60)));

alter table public.projects add constraint projects_pkey PRIMARY KEY (id);

alter table public.projects add constraint projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.reflections add constraint reflections_kind_check CHECK ((kind = ANY (ARRAY['light'::text, 'shadow'::text, 'void'::text, 'integration'::text, 'longing'::text, 'vision'::text, 'weight'::text, 'seed'::text, 'outcome'::text, 'definition'::text, 'freeform'::text])));

alter table public.reflections add constraint reflections_pkey PRIMARY KEY (id);

alter table public.reflections add constraint reflections_questionnaire_check CHECK (((questionnaire IS NULL) OR (questionnaire = ANY (ARRAY['light_shadow'::text, 'freeing_dream'::text]))));

alter table public.reflections add constraint reflections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.seasons add constraint seasons_pkey PRIMARY KEY (id);

alter table public.seasons add constraint seasons_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.showcase_credits add constraint showcase_credits_artist_user_id_fkey FOREIGN KEY (artist_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table public.showcase_credits add constraint showcase_credits_kronk_handle_check CHECK (((kronk_handle IS NULL) OR (kronk_handle ~* '^@[a-z0-9_]{1,30}@[a-z0-9.-]+\.[a-z]{2,}$'::text)));

alter table public.showcase_credits add constraint showcase_credits_name_check CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 60)));

alter table public.showcase_credits add constraint showcase_credits_pkey PRIMARY KEY (id);

alter table public.showcase_credits add constraint showcase_credits_role_check CHECK ((role = 'offered_by'::text));

alter table public.showcase_credits add constraint showcase_credits_url_check CHECK (((url IS NULL) OR (url ~* '^https://[^\s]+$'::text)));

alter table public.showcase_credits add constraint showcase_credits_work_id_fkey FOREIGN KEY (work_id) REFERENCES showcase_works(id) ON DELETE CASCADE;

alter table public.showcase_reports add constraint showcase_reports_pkey PRIMARY KEY (id);

alter table public.showcase_reports add constraint showcase_reports_reason_check CHECK ((char_length(reason) <= 500));

alter table public.showcase_reports add constraint showcase_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.showcase_reports add constraint showcase_reports_work_id_fkey FOREIGN KEY (work_id) REFERENCES showcase_works(id) ON DELETE CASCADE;

alter table public.showcase_reports add constraint showcase_reports_work_id_user_id_key UNIQUE (work_id, user_id);

alter table public.showcase_saves add constraint showcase_saves_pkey PRIMARY KEY (user_id, work_id);

alter table public.showcase_saves add constraint showcase_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.showcase_saves add constraint showcase_saves_work_id_fkey FOREIGN KEY (work_id) REFERENCES showcase_works(id) ON DELETE CASCADE;

alter table public.showcase_works add constraint showcase_background_is_image CHECK (((kind = 'image'::text) OR (NOT ('home_background'::text = ANY (placements)))));

alter table public.showcase_works add constraint showcase_featured_words_is_words CHECK (((kind = 'words'::text) OR (NOT ('featured_words'::text = ANY (placements)))));

alter table public.showcase_works add constraint showcase_image_has_file CHECK (((kind <> 'image'::text) OR (image_path IS NOT NULL)));

alter table public.showcase_works add constraint showcase_words_has_text CHECK (((kind <> 'words'::text) OR (char_length(btrim(body)) > 0)));

alter table public.showcase_works add constraint showcase_works_alt_text_check CHECK ((char_length(alt_text) <= 300));

alter table public.showcase_works add constraint showcase_works_body_check CHECK ((char_length(body) <= 4000));

alter table public.showcase_works add constraint showcase_works_image_height_check CHECK (((image_height IS NULL) OR ((image_height >= 1) AND (image_height <= 4000))));

alter table public.showcase_works add constraint showcase_works_image_path_check CHECK (((image_path IS NULL) OR (char_length(image_path) <= 200)));

alter table public.showcase_works add constraint showcase_works_image_width_check CHECK (((image_width IS NULL) OR ((image_width >= 1) AND (image_width <= 4000))));

alter table public.showcase_works add constraint showcase_works_kind_check CHECK ((kind = ANY (ARRAY['image'::text, 'words'::text])));

alter table public.showcase_works add constraint showcase_works_kronk_post_url_check CHECK (((kronk_post_url IS NULL) OR (kronk_post_url ~* '^https://[^\s]+$'::text)));

alter table public.showcase_works add constraint showcase_works_pkey PRIMARY KEY (id);

alter table public.showcase_works add constraint showcase_works_placements_check CHECK (((cardinality(placements) >= 1) AND (placements <@ ARRAY['home_background'::text, 'featured_words'::text, 'gallery'::text])));

alter table public.showcase_works add constraint showcase_works_review_note_check CHECK (((review_note IS NULL) OR (char_length(review_note) <= 500)));

alter table public.showcase_works add constraint showcase_works_save_mode_check CHECK ((save_mode = ANY (ARRAY['free'::text, 'contribution'::text])));

alter table public.showcase_works add constraint showcase_works_source_id_check CHECK (((source_id IS NULL) OR (char_length(source_id) <= 64)));

alter table public.showcase_works add constraint showcase_works_status_check CHECK ((status = ANY (ARRAY['waiting'::text, 'live'::text, 'declined'::text, 'removed'::text])));

alter table public.showcase_works add constraint showcase_works_suggested_amount_check CHECK (((suggested_amount IS NULL) OR (char_length(suggested_amount) <= 40)));

alter table public.showcase_works add constraint showcase_works_title_check CHECK ((char_length(title) <= 120));

alter table public.showcase_works add constraint showcase_works_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.showcase_works add constraint showcase_works_user_id_source_id_key UNIQUE (user_id, source_id);

alter table public.todos add constraint todos_pkey PRIMARY KEY (id);

alter table public.todos add constraint todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.tool_uses add constraint tool_uses_pkey PRIMARY KEY (id);

alter table public.tool_uses add constraint tool_uses_slug_fkey FOREIGN KEY (slug) REFERENCES arcana(slug) ON DELETE CASCADE;

alter table public.tool_uses add constraint tool_uses_tool_id_check CHECK (((char_length(tool_id) >= 1) AND (char_length(tool_id) <= 80)));

alter table public.tool_uses add constraint tool_uses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.user_arcana add constraint user_arcana_pkey PRIMARY KEY (user_id, slug);

alter table public.user_arcana add constraint user_arcana_slug_fkey FOREIGN KEY (slug) REFERENCES arcana(slug) ON DELETE CASCADE;

alter table public.user_arcana add constraint user_arcana_source_check CHECK ((source = ANY (ARRAY['free'::text, 'purchase'::text, 'gift'::text])));

alter table public.user_arcana add constraint user_arcana_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.user_values add constraint user_values_highest_tier_check CHECK (((highest_tier_reached >= 0) AND (highest_tier_reached <= 3)));

alter table public.user_values add constraint user_values_pkey PRIMARY KEY (id);

alter table public.user_values add constraint user_values_status_check CHECK ((status = ANY (ARRAY['active'::text, 'rested'::text])));

alter table public.user_values add constraint user_values_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.user_xp add constraint user_xp_pkey PRIMARY KEY (user_id);

alter table public.user_xp add constraint user_xp_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.value_challenges add constraint value_challenges_pkey PRIMARY KEY (id);

alter table public.value_challenges add constraint value_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.value_compass add constraint value_compass_pkey PRIMARY KEY (id);

alter table public.value_compass add constraint value_compass_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.value_words add constraint value_words_normalized_check CHECK (((char_length(normalized) >= 1) AND (char_length(normalized) <= 40)));

alter table public.value_words add constraint value_words_pkey PRIMARY KEY (id);

alter table public.value_words add constraint value_words_source_check CHECK ((source = ANY (ARRAY['course'::text, 'values'::text])));

alter table public.value_words add constraint value_words_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.value_words add constraint value_words_user_id_normalized_key UNIQUE (user_id, normalized);

alter table public.value_words add constraint value_words_word_check CHECK (((char_length(word) >= 1) AND (char_length(word) <= 40)));

alter table public.values_library add constraint values_library_element_check CHECK ((element = ANY (ARRAY['Water'::text, 'Fire'::text, 'Earth'::text, 'Air'::text, 'Ether'::text])));

alter table public.values_library add constraint values_library_name_key UNIQUE (name);

alter table public.values_library add constraint values_library_parent_slug_fkey FOREIGN KEY (parent_slug) REFERENCES values_library(slug);

alter table public.values_library add constraint values_library_pkey PRIMARY KEY (slug);

alter table public.wandering_stops add constraint wandering_stops_check CHECK (((depart IS NULL) OR (arrive IS NULL) OR (depart >= arrive)));

alter table public.wandering_stops add constraint wandering_stops_date_precision_check CHECK ((date_precision = ANY (ARRAY['day'::text, 'month'::text, 'year'::text])));

alter table public.wandering_stops add constraint wandering_stops_kind_check CHECK ((kind = ANY (ARRAY['stay'::text, 'visit'::text, 'transit'::text])));

alter table public.wandering_stops add constraint wandering_stops_pkey PRIMARY KEY (id);

alter table public.wandering_stops add constraint wandering_stops_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.wandering_stops add constraint wandering_stops_wandering_id_fkey FOREIGN KEY (wandering_id) REFERENCES wanderings(id) ON DELETE CASCADE;

alter table public.wanderings add constraint wanderings_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

alter table public.wanderings add constraint wanderings_pkey PRIMARY KEY (id);

alter table public.wanderings add constraint wanderings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.wanderings add constraint wanderings_user_id_item_id_key UNIQUE (user_id, item_id);

alter table public.week_harvests add constraint week_harvests_pkey PRIMARY KEY (id);

alter table public.week_harvests add constraint week_harvests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.week_harvests add constraint week_harvests_user_id_week_start_key UNIQUE (user_id, week_start);

alter table public.week_intentions add constraint week_intentions_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

alter table public.week_intentions add constraint week_intentions_outcome_check CHECK (((outcome IS NULL) OR (outcome = ANY (ARRAY['carried'::text, 'rested'::text, 'released'::text]))));

alter table public.week_intentions add constraint week_intentions_pkey PRIMARY KEY (id);

alter table public.week_intentions add constraint week_intentions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.week_intentions add constraint week_intentions_user_id_week_start_item_id_key UNIQUE (user_id, week_start, item_id);

alter table public.weekly_reflections add constraint weekly_reflections_pkey PRIMARY KEY (id);

alter table public.weekly_reflections add constraint weekly_reflections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.weekly_reflections add constraint weekly_reflections_user_id_week_start_key UNIQUE (user_id, week_start);

alter table public.younderstandings add constraint younderstandings_pkey PRIMARY KEY (id);

alter table public.younderstandings add constraint younderstandings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.yourigin_records add constraint yourigin_records_pkey PRIMARY KEY (user_id, tbl, id);

alter table public.yourigin_records add constraint yourigin_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.yourigin_sync_keys add constraint yourigin_sync_keys_pkey PRIMARY KEY (user_id);

alter table public.yourigin_sync_keys add constraint yourigin_sync_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX artist_profiles_kronk_handle_key ON public.artist_profiles USING btree (lower(kronk_handle)) WHERE (kronk_handle IS NOT NULL);

CREATE INDEX beta_feedback_user_created ON public.beta_feedback USING btree (user_id, created_at DESC);

CREATE INDEX client_errors_created ON public.client_errors USING btree (created_at DESC);

CREATE INDEX focus_sessions_user_date_idx ON public.focus_sessions USING btree (user_id, date_key DESC);

CREATE UNIQUE INDEX habit_logs_one_per_day ON public.habit_logs USING btree (item_id, day, step);

CREATE INDEX habit_logs_user_idx ON public.habit_logs USING btree (user_id, day);

CREATE INDEX identity_visions_user_idx ON public.identity_visions USING btree (user_id, inserted_at DESC);

CREATE INDEX items_user_id_idx ON public.items USING btree (user_id);

CREATE INDEX journal_entries_stop_idx ON public.journal_entries USING btree (stop_id) WHERE (stop_id IS NOT NULL);

CREATE INDEX journal_entries_user_date_idx ON public.journal_entries USING btree (user_id, entry_date DESC);

CREATE INDEX journal_highlights_user_idx ON public.journal_highlights USING btree (user_id, created_at DESC);

CREATE INDEX journal_photos_entry_idx ON public.journal_photos USING btree (entry_id);

CREATE UNIQUE INDEX kronk_links_account_key ON public.kronk_links USING btree (kronk_account_id);

CREATE INDEX life_moments_stop_idx ON public.life_moments USING btree (stop_id) WHERE (stop_id IS NOT NULL);

CREATE INDEX memory_user_id_idx ON public.memory USING btree (user_id);

CREATE INDEX mood_log_user_id_idx ON public.mood_log USING btree (user_id);

CREATE INDEX own_tools_user_idx ON public.own_tools USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX project_notes_entry_uniq ON public.project_notes USING btree (project_id, entry_id);

CREATE INDEX project_notes_project_idx ON public.project_notes USING btree (project_id, created_at DESC);

CREATE INDEX project_notes_user_idx ON public.project_notes USING btree (user_id);

CREATE INDEX projects_user_idx ON public.projects USING btree (user_id, "position");

CREATE INDEX reflections_session_idx ON public.reflections USING btree (user_id, session_id);

CREATE UNIQUE INDEX reflections_session_kind_uniq ON public.reflections USING btree (session_id, kind) WHERE (session_id IS NOT NULL);

CREATE INDEX reflections_user_idx ON public.reflections USING btree (user_id, inserted_at DESC);

CREATE INDEX seasons_user_created_idx ON public.seasons USING btree (user_id, created_at DESC);

CREATE INDEX showcase_credits_artist_idx ON public.showcase_credits USING btree (artist_user_id) WHERE (artist_user_id IS NOT NULL);

CREATE INDEX showcase_credits_work_idx ON public.showcase_credits USING btree (work_id, "position");

CREATE INDEX showcase_works_status_idx ON public.showcase_works USING btree (status, featured_at DESC);

CREATE INDEX todos_user_date_idx ON public.todos USING btree (user_id, todo_date);

CREATE INDEX tool_uses_user_idx ON public.tool_uses USING btree (user_id, slug, tool_id, created_at DESC);

CREATE INDEX value_compass_user_created_idx ON public.value_compass USING btree (user_id, created_at DESC);

CREATE INDEX wandering_stops_wandering_idx ON public.wandering_stops USING btree (wandering_id, "position");

CREATE INDEX week_intentions_user_week_idx ON public.week_intentions USING btree (user_id, week_start);

CREATE INDEX younderstandings_user_created_idx ON public.younderstandings USING btree (user_id, created_at DESC);

CREATE INDEX yourigin_records_user_rev ON public.yourigin_records USING btree (user_id, rev);

CREATE OR REPLACE FUNCTION public.artist_profiles_touch()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.client_errors_throttle()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (select count(*) from public.client_errors
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 20 then
    return null;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.codex_word_requests()
 RETURNS TABLE(normalized text, word text, people bigint, first_seen timestamp with time zone, last_seen timestamp with time zone, status text)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from you_private.codex_word_requests() $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.redeem_arcanum_code(p_code text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Same friendly message as before for signed-out visitors.
  if auth.uid() is null then
    raise exception 'Sign in to use a gift code.';
  end if;
  return you_private.redeem_arcanum_code(p_code);
end
$function$
;

CREATE OR REPLACE FUNCTION public.review_showcase_work(p_id uuid, p_decision text, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.set_codex_word_status(p_normalized text, p_status text)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select you_private.set_codex_word_status(p_normalized, p_status) $function$
;

CREATE OR REPLACE FUNCTION public.showcase_credits_link()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.artist_user_id := null;
  if new.kronk_handle is not null then
    select p.user_id into new.artist_user_id
    from public.artist_profiles p
    where lower(p.kronk_handle) = lower(new.kronk_handle);
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.showcase_is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$function$
;

CREATE OR REPLACE FUNCTION public.showcase_save_counts()
 RETURNS TABLE(work_id uuid, saves bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.work_id, count(*)::bigint
  from public.showcase_saves s
  join public.showcase_works w on w.id = s.work_id
  where w.user_id = auth.uid()
  group by s.work_id;
$function$
;

CREATE OR REPLACE FUNCTION public.showcase_works_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.yourigin_bump_rev()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.rev := nextval('public.yourigin_records_rev_seq');
  return new;
end
$function$
;

CREATE OR REPLACE FUNCTION public.yourigin_push(rows jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  n integer;
begin
  if not yourigin_private.is_allowed() then
    raise exception 'This account is not allowed to use YOUrigin sync';
  end if;
  insert into public.yourigin_records as r (user_id, tbl, id, updated_at, deleted, payload, iv)
  select auth.uid(), x ->> 'tbl', x ->> 'id', (x ->> 'updated_at')::bigint,
         coalesce((x ->> 'deleted')::boolean, false), x ->> 'payload', x ->> 'iv'
  from jsonb_array_elements(rows) x
  on conflict (user_id, tbl, id) do update
    set updated_at = excluded.updated_at,
        deleted = excluded.deleted,
        payload = excluded.payload,
        iv = excluded.iv
    where excluded.updated_at > r.updated_at;
  get diagnostics n = row_count;
  return n;
end
$function$
;

CREATE TRIGGER artist_profiles_touch BEFORE UPDATE ON public.artist_profiles FOR EACH ROW EXECUTE FUNCTION artist_profiles_touch();

CREATE TRIGGER client_errors_throttle BEFORE INSERT ON public.client_errors FOR EACH ROW EXECUTE FUNCTION client_errors_throttle();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER showcase_credits_link BEFORE INSERT OR UPDATE ON public.showcase_credits FOR EACH ROW EXECUTE FUNCTION showcase_credits_link();

CREATE TRIGGER showcase_works_guard BEFORE INSERT OR UPDATE ON public.showcase_works FOR EACH ROW EXECUTE FUNCTION showcase_works_guard();

CREATE TRIGGER yourigin_records_bump_rev BEFORE UPDATE ON public.yourigin_records FOR EACH ROW EXECUTE FUNCTION yourigin_bump_rev();

alter table public.admins enable row level security;

alter table public.ai_consent enable row level security;

alter table public.ai_usage enable row level security;

alter table public.arcana enable row level security;

alter table public.arcanum_code_redemptions enable row level security;

alter table public.arcanum_codes enable row level security;

alter table public.arcanum_progress enable row level security;

alter table public.arcanum_walks enable row level security;

alter table public.artist_profiles enable row level security;

alter table public.beta_feedback enable row level security;

alter table public.client_errors enable row level security;

alter table public.codex_word_reviews enable row level security;

alter table public.dream_patterns enable row level security;

alter table public.entitlements enable row level security;

alter table public.focus_sessions enable row level security;

alter table public.habit_logs enable row level security;

alter table public.identity_visions enable row level security;

alter table public.items enable row level security;

alter table public.journal_ai_insights enable row level security;

alter table public.journal_entries enable row level security;

alter table public.journal_highlights enable row level security;

alter table public.journal_photos enable row level security;

alter table public.kronk_links enable row level security;

alter table public.life_chapters enable row level security;

alter table public.life_moments enable row level security;

alter table public.memory enable row level security;

alter table public.mood_log enable row level security;

alter table public.own_tools enable row level security;

alter table public.profiles enable row level security;

alter table public.project_notes enable row level security;

alter table public.projects enable row level security;

alter table public.reflections enable row level security;

alter table public.seasons enable row level security;

alter table public.showcase_credits enable row level security;

alter table public.showcase_reports enable row level security;

alter table public.showcase_saves enable row level security;

alter table public.showcase_works enable row level security;

alter table public.todos enable row level security;

alter table public.tool_uses enable row level security;

alter table public.user_arcana enable row level security;

alter table public.user_values enable row level security;

alter table public.user_xp enable row level security;

alter table public.value_challenges enable row level security;

alter table public.value_compass enable row level security;

alter table public.value_words enable row level security;

alter table public.values_library enable row level security;

alter table public.wandering_stops enable row level security;

alter table public.wanderings enable row level security;

alter table public.week_harvests enable row level security;

alter table public.week_intentions enable row level security;

alter table public.weekly_reflections enable row level security;

alter table public.younderstandings enable row level security;

alter table public.yourigin_records enable row level security;

alter table public.yourigin_sync_keys enable row level security;

create policy admins_select_self on public.admins as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy ai_consent_insert_own on public.ai_consent as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy ai_consent_select_own on public.ai_consent as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy ai_consent_update_own on public.ai_consent as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "own usage read" on public.ai_usage as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy arcana_select_all on public.arcana as PERMISSIVE for SELECT to authenticated
  using (true);

create policy arcanum_code_redemptions_select_own on public.arcanum_code_redemptions as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy "No direct client access (use RPC)" on public.arcanum_codes as PERMISSIVE for ALL to anon, authenticated
  using (false)
  with check (false);

create policy arcanum_progress_delete_own on public.arcanum_progress as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy arcanum_progress_insert_held on public.arcanum_progress as PERMISSIVE for INSERT to public
  with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM user_arcana ua
  WHERE ((ua.user_id = auth.uid()) AND (ua.slug = arcanum_progress.slug))))));

create policy arcanum_progress_select_own on public.arcanum_progress as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy arcanum_progress_update_held on public.arcanum_progress as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM user_arcana ua
  WHERE ((ua.user_id = auth.uid()) AND (ua.slug = arcanum_progress.slug))))));

create policy arcanum_walks_insert_held on public.arcanum_walks as PERMISSIVE for INSERT to public
  with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM user_arcana ua
  WHERE ((ua.user_id = auth.uid()) AND (ua.slug = arcanum_walks.slug))))));

create policy arcanum_walks_select_own on public.arcanum_walks as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy arcanum_walks_update_own on public.arcanum_walks as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy artist_profiles_delete_own on public.artist_profiles as PERMISSIVE for DELETE to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)));

create policy artist_profiles_insert_own on public.artist_profiles as PERMISSIVE for INSERT to authenticated
  with check ((user_id = ( SELECT auth.uid() AS uid)));

create policy artist_profiles_select on public.artist_profiles as PERMISSIVE for SELECT to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT showcase_is_admin() AS showcase_is_admin) OR (EXISTS ( SELECT 1
   FROM showcase_works w
  WHERE ((w.user_id = artist_profiles.user_id) AND (w.status = 'live'::text))))));

create policy artist_profiles_update_own on public.artist_profiles as PERMISSIVE for UPDATE to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)))
  with check ((user_id = ( SELECT auth.uid() AS uid)));

create policy beta_feedback_insert_own on public.beta_feedback as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy beta_feedback_select_own_or_admin on public.beta_feedback as PERMISSIVE for SELECT to authenticated
  using (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT showcase_is_admin() AS showcase_is_admin)));

create policy beta_feedback_update_own on public.beta_feedback as PERMISSIVE for UPDATE to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy client_errors_insert_own on public.client_errors as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy client_errors_select_admin on public.client_errors as PERMISSIVE for SELECT to authenticated
  using (( SELECT showcase_is_admin() AS showcase_is_admin));

create policy "No direct client access (use RPC)" on public.codex_word_reviews as PERMISSIVE for ALL to anon, authenticated
  using (false)
  with check (false);

create policy dream_patterns_own on public.dream_patterns as PERMISSIVE for ALL to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy entitlements_select_own on public.entitlements as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy focus_sessions_delete_own on public.focus_sessions as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy focus_sessions_insert_own on public.focus_sessions as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy focus_sessions_select_own on public.focus_sessions as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy focus_sessions_update_own on public.focus_sessions as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy habit_logs_own on public.habit_logs as PERMISSIVE for ALL to public
  using ((auth.uid() = user_id))
  with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM items i
  WHERE ((i.id = habit_logs.item_id) AND (i.user_id = auth.uid()))))));

create policy identity_visions_delete_own on public.identity_visions as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy identity_visions_insert_own on public.identity_visions as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy identity_visions_select_own on public.identity_visions as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy identity_visions_update_own on public.identity_visions as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "own rows" on public.items as PERMISSIVE for ALL to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy journal_ai_insights_delete_own on public.journal_ai_insights as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy journal_ai_insights_insert_own on public.journal_ai_insights as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy journal_ai_insights_select_own on public.journal_ai_insights as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy journal_ai_insights_update_own on public.journal_ai_insights as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy journal_entries_delete_own on public.journal_entries as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy journal_entries_insert_own on public.journal_entries as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy journal_entries_select_own on public.journal_entries as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy journal_entries_update_own on public.journal_entries as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy journal_highlights_delete_own on public.journal_highlights as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy journal_highlights_insert_own on public.journal_highlights as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy journal_highlights_select_own on public.journal_highlights as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy journal_highlights_update_own on public.journal_highlights as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy journal_photos_delete_own on public.journal_photos as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy journal_photos_insert_own on public.journal_photos as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy journal_photos_select_own on public.journal_photos as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy journal_photos_update_own on public.journal_photos as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy kronk_links_select_own on public.kronk_links as PERMISSIVE for SELECT to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));

create policy "Users can delete their own chapters" on public.life_chapters as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy "Users can insert their own chapters" on public.life_chapters as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy "Users can view their own chapters" on public.life_chapters as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy "Users can delete their own moments" on public.life_moments as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy "Users can insert their own moments" on public.life_moments as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy "Users can update their own moments" on public.life_moments as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id));

create policy "Users can view their own moments" on public.life_moments as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy "own rows" on public.memory as PERMISSIVE for ALL to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "own rows" on public.mood_log as PERMISSIVE for ALL to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy own_tools_all_own on public.own_tools as PERMISSIVE for ALL to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "Users can delete own profile" on public.profiles as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy "Users can insert own profile" on public.profiles as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy "Users can read own profile" on public.profiles as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy "Users can update own profile" on public.profiles as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id));

create policy profiles_insert_own on public.profiles as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy profiles_select_own on public.profiles as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy profiles_update_own on public.profiles as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy project_notes_own on public.project_notes as PERMISSIVE for ALL to public
  using ((auth.uid() = user_id))
  with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = project_notes.project_id) AND (p.user_id = auth.uid()))))));

create policy projects_own on public.projects as PERMISSIVE for ALL to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy reflections_delete_own on public.reflections as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy reflections_insert_own on public.reflections as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy reflections_select_own on public.reflections as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy reflections_update_own on public.reflections as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy seasons_delete_own on public.seasons as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy seasons_insert_own on public.seasons as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy seasons_select_own on public.seasons as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy showcase_credits_delete_own on public.showcase_credits as PERMISSIVE for DELETE to authenticated
  using ((EXISTS ( SELECT 1
   FROM showcase_works w
  WHERE ((w.id = showcase_credits.work_id) AND (w.user_id = ( SELECT auth.uid() AS uid)) AND (w.status = ANY (ARRAY['waiting'::text, 'declined'::text]))))));

create policy showcase_credits_insert_own on public.showcase_credits as PERMISSIVE for INSERT to authenticated
  with check ((EXISTS ( SELECT 1
   FROM showcase_works w
  WHERE ((w.id = showcase_credits.work_id) AND (w.user_id = ( SELECT auth.uid() AS uid)) AND (w.status = ANY (ARRAY['waiting'::text, 'declined'::text]))))));

create policy showcase_credits_select on public.showcase_credits as PERMISSIVE for SELECT to authenticated
  using ((EXISTS ( SELECT 1
   FROM showcase_works w
  WHERE (w.id = showcase_credits.work_id))));

create policy showcase_credits_update_own on public.showcase_credits as PERMISSIVE for UPDATE to authenticated
  using ((EXISTS ( SELECT 1
   FROM showcase_works w
  WHERE ((w.id = showcase_credits.work_id) AND (w.user_id = ( SELECT auth.uid() AS uid)) AND (w.status = ANY (ARRAY['waiting'::text, 'declined'::text]))))))
  with check ((EXISTS ( SELECT 1
   FROM showcase_works w
  WHERE ((w.id = showcase_credits.work_id) AND (w.user_id = ( SELECT auth.uid() AS uid)) AND (w.status = ANY (ARRAY['waiting'::text, 'declined'::text]))))));

create policy showcase_reports_admin_delete on public.showcase_reports as PERMISSIVE for DELETE to authenticated
  using (( SELECT showcase_is_admin() AS showcase_is_admin));

create policy showcase_reports_admin_select on public.showcase_reports as PERMISSIVE for SELECT to authenticated
  using (( SELECT showcase_is_admin() AS showcase_is_admin));

create policy showcase_reports_insert on public.showcase_reports as PERMISSIVE for INSERT to authenticated
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM showcase_works w
  WHERE ((w.id = showcase_reports.work_id) AND (w.status = 'live'::text))))));

create policy showcase_saves_delete_own on public.showcase_saves as PERMISSIVE for DELETE to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)));

create policy showcase_saves_insert_own on public.showcase_saves as PERMISSIVE for INSERT to authenticated
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM showcase_works w
  WHERE ((w.id = showcase_saves.work_id) AND (w.status = 'live'::text) AND ((w.save_mode = 'free'::text) OR showcase_saves.contributed))))));

create policy showcase_saves_select_own on public.showcase_saves as PERMISSIVE for SELECT to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)));

create policy showcase_works_delete_own on public.showcase_works as PERMISSIVE for DELETE to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT showcase_is_admin() AS showcase_is_admin)));

create policy showcase_works_insert_own on public.showcase_works as PERMISSIVE for INSERT to authenticated
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND (rights_confirmed_at IS NOT NULL)));

create policy showcase_works_select on public.showcase_works as PERMISSIVE for SELECT to authenticated
  using (((status = 'live'::text) OR (user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT showcase_is_admin() AS showcase_is_admin)));

create policy showcase_works_update_own on public.showcase_works as PERMISSIVE for UPDATE to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT showcase_is_admin() AS showcase_is_admin)))
  with check (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT showcase_is_admin() AS showcase_is_admin)));

create policy todos_delete_own on public.todos as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy todos_insert_own on public.todos as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy todos_select_own on public.todos as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy todos_update_own on public.todos as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy tool_uses_delete_own on public.tool_uses as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy tool_uses_insert_held on public.tool_uses as PERMISSIVE for INSERT to public
  with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM user_arcana ua
  WHERE ((ua.user_id = auth.uid()) AND (ua.slug = tool_uses.slug))))));

create policy tool_uses_select_own on public.tool_uses as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy user_arcana_delete_free on public.user_arcana as PERMISSIVE for DELETE to public
  using (((auth.uid() = user_id) AND (source = 'free'::text)));

create policy user_arcana_insert_free on public.user_arcana as PERMISSIVE for INSERT to public
  with check (((auth.uid() = user_id) AND (source = 'free'::text) AND (EXISTS ( SELECT 1
   FROM arcana a
  WHERE ((a.slug = user_arcana.slug) AND a.is_free AND a.published)))));

create policy user_arcana_select_own on public.user_arcana as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy "Users can delete own values" on public.user_values as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy "Users can insert own values" on public.user_values as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy "Users can read own values" on public.user_values as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy "Users can update own values" on public.user_values as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id));

create policy "own rows" on public.user_xp as PERMISSIVE for ALL to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "Users can delete their own value challenges" on public.value_challenges as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy "Users can insert their own value challenges" on public.value_challenges as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy "Users can update their own value challenges" on public.value_challenges as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id));

create policy "Users can view their own value challenges" on public.value_challenges as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy value_compass_delete_own on public.value_compass as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy value_compass_insert_own on public.value_compass as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy value_compass_select_own on public.value_compass as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy value_compass_update_own on public.value_compass as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy value_words_delete_own on public.value_words as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy value_words_insert_own on public.value_words as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy value_words_select_own on public.value_words as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy value_words_update_own on public.value_words as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy values_library_read_all on public.values_library as PERMISSIVE for SELECT to public
  using (true);

create policy wandering_stops_delete_own on public.wandering_stops as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy wandering_stops_insert_own on public.wandering_stops as PERMISSIVE for INSERT to public
  with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM wanderings y
  WHERE ((y.id = wandering_stops.wandering_id) AND (y.user_id = auth.uid()))))));

create policy wandering_stops_select_own on public.wandering_stops as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy wandering_stops_update_own on public.wandering_stops as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM wanderings y
  WHERE ((y.id = wandering_stops.wandering_id) AND (y.user_id = auth.uid()))))));

create policy wanderings_delete_own on public.wanderings as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy wanderings_insert_own on public.wanderings as PERMISSIVE for INSERT to public
  with check (((auth.uid() = user_id) AND ((item_id IS NULL) OR (EXISTS ( SELECT 1
   FROM items i
  WHERE ((i.id = wanderings.item_id) AND (i.user_id = auth.uid())))))));

create policy wanderings_select_own on public.wanderings as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy wanderings_update_own on public.wanderings as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check (((auth.uid() = user_id) AND ((item_id IS NULL) OR (EXISTS ( SELECT 1
   FROM items i
  WHERE ((i.id = wanderings.item_id) AND (i.user_id = auth.uid())))))));

create policy week_harvests_delete_own on public.week_harvests as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy week_harvests_insert_own on public.week_harvests as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy week_harvests_select_own on public.week_harvests as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy week_harvests_update_own on public.week_harvests as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy week_intentions_delete_own on public.week_intentions as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy week_intentions_insert_own on public.week_intentions as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy week_intentions_select_own on public.week_intentions as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy week_intentions_update_own on public.week_intentions as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy weekly_reflections_delete_own on public.weekly_reflections as PERMISSIVE for DELETE to public
  using ((auth.uid() = user_id));

create policy weekly_reflections_insert_own on public.weekly_reflections as PERMISSIVE for INSERT to public
  with check ((auth.uid() = user_id));

create policy weekly_reflections_select_own on public.weekly_reflections as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));

create policy weekly_reflections_update_own on public.weekly_reflections as PERMISSIVE for UPDATE to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy younderstandings_own on public.younderstandings as PERMISSIVE for ALL to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "yourigin: own records" on public.yourigin_records as PERMISSIVE for ALL to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT yourigin_private.is_allowed() AS is_allowed)))
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT yourigin_private.is_allowed() AS is_allowed)));

create policy "yourigin: own key" on public.yourigin_sync_keys as PERMISSIVE for ALL to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT yourigin_private.is_allowed() AS is_allowed)))
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT yourigin_private.is_allowed() AS is_allowed)));

create policy "Users can delete their own moment photos" on storage.objects as PERMISSIVE for DELETE to public
  using (((bucket_id = 'life-moments'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

create policy "Users can upload their own moment photos" on storage.objects as PERMISSIVE for INSERT to public
  with check (((bucket_id = 'life-moments'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

create policy "Users can view their own moment photos" on storage.objects as PERMISSIVE for SELECT to public
  using (((bucket_id = 'life-moments'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

create policy journal_photos_storage_delete_own on storage.objects as PERMISSIVE for DELETE to public
  using (((bucket_id = 'journal-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy journal_photos_storage_insert_own on storage.objects as PERMISSIVE for INSERT to public
  with check (((bucket_id = 'journal-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy journal_photos_storage_select_own on storage.objects as PERMISSIVE for SELECT to public
  using (((bucket_id = 'journal-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy showcase_storage_delete on storage.objects as PERMISSIVE for DELETE to authenticated
  using (((bucket_id = 'showcase'::text) AND (((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) OR ( SELECT showcase_is_admin() AS showcase_is_admin))));

create policy showcase_storage_insert_own on storage.objects as PERMISSIVE for INSERT to authenticated
  with check (((bucket_id = 'showcase'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

create policy showcase_storage_select on storage.objects as PERMISSIVE for SELECT to authenticated
  using (((bucket_id = 'showcase'::text) AND (((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) OR ( SELECT showcase_is_admin() AS showcase_is_admin) OR (EXISTS ( SELECT 1
   FROM showcase_works w
  WHERE ((w.image_path = objects.name) AND (w.status = 'live'::text)))))));

create policy showcase_storage_update_own on storage.objects as PERMISSIVE for UPDATE to authenticated
  using (((bucket_id = 'showcase'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)))
  with check (((bucket_id = 'showcase'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('journal-photos', 'journal-photos', false, null, NULL) on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('life-moments', 'life-moments', false, 5242880, '{image/webp,image/jpeg}') on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('showcase', 'showcase', false, 2097152, '{image/webp,image/jpeg,image/png}') on conflict (id) do nothing;
