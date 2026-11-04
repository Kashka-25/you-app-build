# YOU — Your Own Universe: project handover and development audit

*Prepared 4 November 2026 for a new AI development partner, at the start of a 21-day sprint (4–25 November 2026). Written from the code on `main`, the repo's own docs (`web-next/BUILD-BACKLOG.md`, `PHASE-0-DECISIONS.md`), git and PR history, the Notion "Build Notes" inbox and "beta sprint" plan, and the working notes kept across earlier build sessions.*

**How to read this honestly.** "Built" below means the code exists on `main`, the app compiles, and the feature reads and writes real data. It does **not** always mean someone has tested it end to end on a phone. Where something is known to be untested, it says so. Planned features, mockups and design files are listed separately from working ones.

---

## 0. Quick facts

| | |
|---|---|
| Product | **YOU — Your Own Universe**, a self-love and personal-growth app (PWA) |
| Owner / creator | Cassidy (GitHub `Kashka-25`). Solo founder; all code so far written with Claude Code |
| Live site | https://yourownuniverse.life (Netlify, site `you-app-build`) |
| Staging | https://staging--you-app-build.netlify.app (branch `staging`) |
| Repo | `Kashka-25/you-app-build` (GitHub). The app is in `web-next/`; the repo root still holds the old vanilla-JS app, which is no longer deployed |
| Stack | React 18 + Vite 5 + Tailwind 3 + Framer Motion; Supabase (Postgres, Auth, Storage, Edge Functions in Deno); Anthropic Claude API for AI; Netlify hosting; Resend SMTP for auth email |
| Supabase project | `yikoymzktspamahrsuje` (Free plan). **Staging and production share this one database** |
| Users today | Cassidy plus a handful of friends (beta sized for ~12). Real personal data is in production |
| Size | ~41,000 lines in `web-next/src`; 42 SQL migrations; 12 Edge Functions |
| Health check (4 Nov) | `npm run build` succeeds (warning: 1.7 MB main JS chunk). `npm test`: 1 test file, 10 tests, all pass |
| Open PRs | None. `main` and `staging` are level as of PR #90 (3 Nov) |

---

## 1. Project vision

### What it is
YOU is a "living biography": a private place where a person tends who they are becoming and keeps the story of their life. It blends a journal, a gentle habit/goal/dream tracker, a values practice, a memory timeline and AI reflections that notice patterns over time. The brand language uses "YOU" inside words throughout (YOUrnal, YOUrney, PursYOUts, YOUniversity, KommYOUnity, YOUrigin, YOUsers). Users are called **Seekers** or **YOUsers**.

### The problem it solves
Most self-improvement apps run on pressure: streaks that break, red badges, guilt. Writing a habit down isn't motivating on its own, and people's journals, goals, memories and values live in separate apps that never talk to each other. YOU links today's small action to who the person is becoming ("Your Mind roots grew"), keeps everything in one place, and reflects it back (seasons, chapters, the Mirror, My Story) so a person can see their own growth.

### Who it's for
People on a conscious growth or healing path: reflective, creative, often spiritual, who want a calm, beautiful private space rather than a productivity tool. First audience: Cassidy's friends and the **Kronk** community (kronk.info, a small invite-only Mastodon server run by a friend, Chris). Creators are a secondary audience via **YOUrigin** and **Showcase**.

### What the finished experience should feel like
- **Calm and kind.** Standing rules (in `BUILD-BACKLOG.md`): predictable layout, at most 2–3 choices at once, no urgency or streak-break alerts, no autoplay motion (agreed exceptions: twinkling night sky, the Focus flower), icons always with text labels, escape hatches everywhere. "Rhythm, not streaks": nothing dies, wilts or resets.
- **Beautiful and painted.** Cassidy's own watercolour-and-gold illustration set; every section and extra has a painted emblem. Light mode is **"Nature"** (earthy parchment, terracotta, ochre gold; *no blues by day*). Dark mode is **"Cosmos"** (midnight indigo, starlight gold). AI features have a distinct black-and-gold "Premium" look.
- **Private and sovereign.** Data is the user's; export and delete are built in; AI is opt-in with explicit consent, says what it read, and is moderated (no diagnosing, no "healing" claims, self-harm safety).
- **Simple first.** As of 3 Nov the beta is deliberately a small core with everything else as optional "Extras" (see §2).

### The wider ecosystem (context, not sprint scope)
YOU Core → **Empatherapy** (future practitioner directory / healing journey) → **Kronk / KommYOUnity** (community) → an "Elemental Game". **YOUrigin** is a separate creator app (repo `Kashka-25/YOUrigin`, GitHub Pages) that writes into YOU's Showcase tables. **YOUniversity** holds courses called **Arcana**. **YOU Premium** (subscription) will eventually fund AI.

### Product history in one paragraph
Started as a vanilla-JS habit/astrology tracker (still at the repo root, not deployed). In August 2026 it pivoted to the "Living Biography" concept and a React rebuild in `web-next/` (see `03-YOU-LIVING-BIOGRAPHY-pivot-brief.md`). September–October was a fast feature build on `mvp` then `main`: journal, pursuits, values (a 100-value "Codex"), Sow/Tend/Harvest weekly ritual, Focus timer, Wanderings (travel maps), Seasons, Mirror, My Story, YOUniversity courses, Showcase, Kronk integration, offline mode, beta safety. Design moved forest-green → ocean/cosmos "yin-yang" (Oct 5) → earthy **Nature & Cosmos** (Oct 15). Real users arrived ~Oct 20, so a staging workflow was added. On **3 Nov** Cassidy did a "K.I.S.S." reset: the beta became five core sections with everything else switched off as Extras (PR #82). The pre-reset `main` is preserved on branch `backup/main-2026-11-03`.

---

## 2. What has been built

### 2.1 The app as a new user sees it today (on `main`)

1. **Welcome universe** (`/welcome`, `components/welcome/Universe.jsx`): animated "Explore Your Own Universe" landing page with the logo at the centre and six places around it, each with a sheet and a small demo "glimpse". Then sign up / sign in. **Working.**
2. **Auth**: email + password (min 12 chars), confirm-email via Resend SMTP from `hello@yourownuniverse.life`, password reset, "email already has an account" message, "Continue with Kronk" (OAuth). **Email/password working and used by real testers.** Kronk sign-in: built and deployed, **end-to-end test still listed as not done**.
3. **First-run welcome tour** (`components/Welcome.jsx`), once per account, skippable, rewritten 3 Nov to describe the simple beta. **Working.**
4. **App shell**: top bar (profile picture → Settings), side menu, bottom bar = Home · YOUrnal · [+ Add] · PursYOUts · YOU (two middle spots customisable). Offline banner. Crash boundary. **Working.**

### 2.2 The five core sections (always on)

| Section | Route | What actually works | Notes / gaps |
|---|---|---|---|
| **Home** | `/` | Painted sunrise banner with greeting and a daily personal message (your compass line, or a highlight/memento); daily mood check-in; Today (habits due + intentions sown this week); PursYOUts pill; Season nudge card; "New in YOU". Extras add cards (Your path + practice when YOUniversity is on; featured words when Showcase is on; to-do list) | Sprint "Home" day done 1–2 Nov |
| **YOUrnal** | `/reflections` | Write entries (mood on 0–100 scale, tags, photos), dictate by voice, **Scan a page** (photo of handwriting → AI transcription), journal lock, highlights (select words → keep, link to a dream, use as memento), mood line, tag filter, per-entry AI reflection and "Read this dream", weekly reflection, dream patterns | Sprint "YOUrnal" day done (PR 66/67). **AI parts not recorded as tested with consent on** |
| **PursYOUts** | `/pursue` | Habits, goals, dreams and (new 3 Nov) **ideas**: add/edit/complete/delete (with confirm), Pillar (life area) + sub-category, tags, milestones/steps, "how much" steps in # / min / hrs, day tracker, real days-in-a-row streaks, totals per step, backfill history ("been doing this longer?"), XP. Weekly **Sow → Tend → Harvest** ritual (`/sow`, `/harvest`). **Wanderings** (travel plans/maps inside dreams, MapLibre + Photon place search) | The old 7-day "cycle"/Prestige is retired (old Prestige marks stay). Notion brief for today (4 Nov) lists UX issues: crowded cards, long add form, Sow/Harvest hard to find from this page. Some may already be addressed; re-check against the page. "Ideas" type: note says *check the DB accepts the new type* |
| **YOUrney** | `/journey` | One Memories timeline (moments with up to 10 photos, carousel, places, HEIC handled, photos converted on-device to WebP and GPS stripped), Life Chapters (manual + AI "Suggest chapters"), **Your Season** (AI reading of recent harvests/journal), Season reviews (story-style, at solstices/equinoxes), **Look back** (AI reflection over a chosen window), **Tree of YOU** (painted, 8 growth tiers driven by XP) and **Life Constellations**, **YOUnderstanding** incl. "Ask YOU your own question" (new AI function, 3 Nov), Identity visions | "Look back" is a named placeholder for something better. Several Build Notes still open for Your Season (time dropdown, full-screen read, save/delete) |
| **YOU** | `/you` | Profile, Pillars with levels/XP, **Values**: choose from a 100-value Codex (essence/light/shadow/challenges per value), name your own value, tier progress, challenges (AI "generate more"), Crossroads/compass (rank values), Values Sky (calmed 3 Nov), The Mirror (`/mirror`), Legacy → **My Story** memoir (print/PDF/Markdown, assembled in-browser, no AI) | Codex values are `status: draft` awaiting Cassidy's pass. "Value growth from a challenge" not tried on a real value |

### 2.3 Extras (built, switched **off** by default in Settings → Extras)

| Extra | State |
|---|---|
| **YOUniversity** (`/youniversity`) | Library + Explore. Two free Arcana (Light & Shadow, Freeing the Dream questionnaires); one paid-in-future course, **The Sovereign Empath** (7 stages, full course player, rest days, re-walks, tools kept in Library). Gift codes work (`EMPATH-F25F6F`, 3 uses). **No payments.** Paid course content ships in the public JS bundle (must move behind RLS before selling) |
| **KommYOUnity** (`/community`) | Live Kronk home feed via OAuth, Froth (like) / Komment, share prompts. **Depends on Chris** (Kronk admin) for `you.kronk.info` DNS and invite-only sign-up. Migration `20261018150000_kronk_links.sql` listed as "apply in SQL editor" — **confirm whether applied**. Not end-to-end tested. Doesn't work on staging (OAuth redirect not registered) |
| **Showcase** (`/showcase`) | Gallery of art/words from YOUsers, featured words on Home, saves, reports, admin review queue (`/showcase-review`). Fed by YOUrigin. RLS tested (`supabase/tests/showcase_rls.mjs`) |
| **YOUrigin** (`/yourigin`) | Status page for a creator's shared pieces; the creating happens in the separate YOUrigin app |
| **YOUr Projects** (`/projects`) | Projects with notes/to-dos (New/Doing/Done), search, journal tag auto-filing |
| **Focus** (`/focus`) | Timer with a growing flower, XP rules, mementos (165 lines incl. Cassidy's own), garden around the Tree, local "it bloomed" notification (no Web Push) |
| **Today's to-do list** | Quick list on Home/Threshold; items vanish at day's end |
| **The Threshold** | Optional calm landing screen before Home |

### 2.4 Cross-cutting systems (working)

- **Offline** (`lib/offline.js`): reads cached in IndexedDB per account; writes queued and replayed; client-generated UUIDs make retries safe. Tested on staging; **not yet tested on a phone in airplane mode** (Build Note still "Doing").
- **AI layer**: every call goes through `invokeAi()` in the app and an Edge Function that checks consent (`ai_consent` table, per-source switches), a premium gate (`lib/premium.js` + `_shared/limit.ts`, open to all in beta), and a **cost guard**: $20/month whole app, $1/tester/month, 30 calls/24 h (Supabase secrets `AI_MONTHLY_BUDGET_USD`, `AI_USER_MONTHLY_USD`, `AI_DAILY_LIMIT`), usage logged in `ai_usage`, monthly allowance shown to the user. **Output moderation** (`_shared/moderate.ts`, unit-tested) strips healing/diagnosis/medication claims and withholds self-harm encouragement. Anthropic console also has a hard monthly spend limit. Models referenced: `claude-opus-5-5` and `claude-sonnet-5`.
- **Trust & data**: `/privacy` (privacy + beta terms, readable signed out), download all data as JSON, delete account (Edge Function deletes storage then auth user; all FKs cascade, checked 18 Oct).
- **Beta feedback loop**: "Send feedback" sheet → `beta_feedback` table → forwarded to Notion Build Notes; crash reports → `client_errors`; admin-only screens `/build-notes`, `/tester-inbox`, `/codex-requests`, `/showcase-review` (gated by the `admins` table).
- **Personalisation**: per-account prefs in Supabase auth `user_metadata.prefs` (extras on/off, nav layout, colour scale, welcomed flag, Realm state). Light/dark per device (`localStorage you.mode`) plus colour-scale sliders.
- **Extras framework**: `lib/plugins.js` (`PLUGINS`, `usePlugin`) and `lib/navigation.js` (`PLACES`; a place exists only while its extra is on).
- **Help**: What's new (`/whats-new`, from `lib/whatsNew.js`), Find your way (`/find-your-way`), both reached from Settings since 3 Nov.
- **PWA**: manifest, maskable icons, service worker (`public/sw.js`), add-to-home-screen instructions.

### 2.5 Visual placeholders and stubs (NOT functional)

- Routes that render only a "coming soon" `ParkedScreen`: `/atlas` (Living Atlas), `/healing`, `/events`, `/therapists`, `/shop`, `/challenges`, `/saved`, `/review`. Component files for several of these (`Events.jsx`, `Challenges.jsx`, `Therapists.jsx`, `Shop.jsx`…) still exist with mock local state but **are not routed**. `/empatherapy` is a stub.
- `/styleguide`, `/welcome-lab`, `/rpg-preview`: internal/dev pages.
- The **avatar upgrade station** is hidden.
- `web-next/README.md` is **stale** (describes the July scaffold, "bypass" dev mode etc.). Trust `BUILD-BACKLOG.md` and this document instead.

### 2.6 Partially built, not on `main`

- **YOU Realm** (branch `feat/you-rpg`, one WIP commit, 2 Nov): turns the YOU page into a Sims-style life game (character select, companion, Sanctuary, YOU Coins/Crystals bought with XP, quests from real habits/goals, a catalog of 5 style sets). Needs **~165 layered art images** (brief in `design/realm-art-brief.md`; only a few exist), and coin gifting to artists needs a server-side ledger (prefs are user-editable, so not safe for currency). Diverged significantly from staging (109 files differ). **Not shippable in this sprint without major art and scope.**
- Several `section/*` and `notes/*` branches remain locally and on origin; all merged ones can be deleted. `backup/main-2026-11-03` must be kept.
- Uncommitted files in the main working folder: design assets (`design/chatgpt-prompts`, `design/home-tiles`, `design/kronk-intro`, emblem previews), `web-next/public/images/realm/`, `web-next/public/images/Tree of Stars/`, a stray `grep.exe.stackdump`, and a modified `.claude/launch.json`.

### 2.7 Design system and assets

- Tokens: `web-next/src/styles/tokens.css` (all colours as CSS variables; token names like `forest`, `sage` are historical and now hold earthy/cosmos values). Tailwind config maps them. Typography: Cormorant Garamond (headings), DM Sans (body), fixed type scale (`text-hero` … `text-label`). 8px grid, `rounded-card` 20px. Icons: lucide-react (outline, 1.75 stroke) plus painted emblems.
- UI library: `components/ui/` (Button, Card, Input, Modal, Fold, ProgressRing, SegmentedControl, EmptyState, LoadingScreen, Premium, PhotoCarousel, XpBar…), shown at `/styleguide`.
- Art: `web-next/public/images/home/*` (section paintings), `public/images/icons/*` (emblems, `<name>.png` 128px + `@4x`), Tree of YOU tiers, logo **`public/logo-full.png`** (gold YOU around an ocean/cosmos yin-yang) and `logo-wordmark.png`. Do **not** use the old green leafy `images/logo-you.png`.
- Rule: every new extra gets its own painted emblem and a What's new card (`design/plugin-emblems`).
- Five Elements as section accents (`lib/elements.js`).

---

## 3. What remains to be built

### 3.1 Missing or incomplete functionality (for launch)
1. **End-to-end verification of the core on real phones** (iOS Safari PWA and Android Chrome): sign-up → confirm email → welcome → first habit → check-in → journal entry → memory with photo → Sow/Harvest → export → delete account. Much has been tested piecemeal on desktop; a full phone pass is not recorded.
2. **AI test pass with consent on** (checklist in `BUILD-BACKLOG.md` "AI test pass"): journal reflect, dream read, highlights suggestions, scan a page, weekly reflection, seasons, suggest chapters, generate challenges, Ask YOU, allowance moving. Recorded as untested because consent was never switched on for Cassidy's account.
3. **Offline in airplane mode on a phone** (built, untested on device).
4. **Remaining sprint sections** from the Notion plan: YOUrney (Your Season dropdown/full-screen/save-delete), YOU page polish, First open (slower, more intimate loading screen), Settings & trust, menu, whole-app pass on small phones and both themes.
5. **"Ideas" pursuit type**: verify the database accepts `type = 'idea'` on `items` (the `items` table predates the migrations folder, so any check constraint isn't visible in the repo).
6. **Tester note is out of date** (`TESTER-NOTE.md`): bottom bar order changed, Find your way moved to Settings, Values path, Coming-soon pages are now hidden. Rewrite before inviting.
7. Supabase Auth → URL Configuration: confirm Site URL and redirect URLs include `https://yourownuniverse.life/**` and the staging URL (backlog item still unticked; email reset is reported working since 21 Oct, so this is probably done; confirm).

### 3.2 Known bugs / risk items
- No known crash-level bugs on `main` are recorded. Real issues will come from `client_errors` and `beta_feedback`; read them first.
- Today's PursYOUts brief (Notion, 2 Nov) lists UX problems: crowded habit cards, long add form, two rows of filters, Sow/Harvest not reachable from PursYOUts, no Add button on the page. Delete-confirm and the double-streak confusion are already fixed on `main`.
- A sown habit tended on Today and also checked in on PursYOUts can earn XP twice (backlog, open).
- `suggest-value-challenges` has no AI-consent check (it sends only a value name; low risk).

### 3.3 Technical debt
- **Schema not fully in code.** Core tables (`profiles`, `items`, `memory`, `mood_log`, `user_values`, `life_moments`, `life_chapters`, `value_challenges`) were created by the old vanilla app and have **no CREATE migration in the repo**. The remote migration history is **out of sync** with the files: the rule is *never* `supabase db push`; new SQL is pasted into the Supabase SQL editor by Cassidy. Nobody can rebuild the database from the repo today.
- **Staging shares the production database.** Any migration or Edge Function deploy hits real users.
- **Tests:** one unit test file (Showcase) plus a Deno moderation test and an RLS script. No component, integration or end-to-end tests. No CI.
- **Bundle size:** main chunk 1.7 MB (495 KB gzip); `heic2any` 1.35 MB and MapLibre 1 MB are lazy but large. Slow first load on poor mobile connections.
- `AppDataContext.jsx` is a 2,370-line god-context holding nearly all reads/writes.
- `Settings.jsx` is 817 lines.
- Legacy vanilla app at the repo root and stale README add confusion.
- Prefs in auth `user_metadata` are user-editable (fine for preferences, not for anything of value).
- Supabase Free plan: no leaked-password protection, limited backups, compute limits. Free projects pause after a week of inactivity (unlikely with daily users, but note it).

### 3.4 Design / UX improvements wanted
- PursYOUts painted header and compact cards (in progress per sprint plan).
- Slower, more intimate loading screen (Build Note).
- Imagery for bare cards ("eye pleasure"); a few screens may still carry older palettes (season images, Styleguide).
- Small-phone and dark-mode pass across every core screen.

### 3.5 Integrations / infrastructure still required
| Item | Needed for MVP? | Blocker |
|---|---|---|
| `you.kronk.info` domain + Kronk invite flow | No (KommYOUnity is an Extra) | Chris (Kronk admin) |
| Stripe payments for Arcana and YOU Premium | No | Business decision; `entitlements` table + premium gate already exist |
| Web Push notifications | No | Service-worker push + a scheduled sender |
| Separate staging Supabase project | Recommended | Cost/time; needs a schema baseline first |
| Error monitoring beyond `client_errors` | Nice to have | — |
| Backups | **Yes, confirm** | Check what the Free plan gives; consider Pro or a scheduled `pg_dump` |

---

## 4. The finished MVP goal

### Definition of "ready for real users" (private beta, ~12–30 people)

A new person, on their own phone, with no help from Cassidy, can:

1. Find YOU from a link, understand what it is, install it to their home screen, sign up, confirm their email and reset a forgotten password.
2. Complete (or skip) the welcome and know within 5 seconds what each of the five core sections is for.
3. **PursYOUts:** add a habit/goal/dream/idea quickly, check in daily, see real progress, edit, complete and delete safely.
4. **YOUrnal:** write, edit and delete entries with mood and tags, add a photo, and (optionally) get an AI reflection.
5. **YOUrney:** add a memory with photos and see it on the timeline; see the Tree of YOU grow.
6. **YOU:** choose a few values and see Pillars grow from their actions.
7. **Home:** check in a mood and see today's habits/intentions in one glance.
8. Do the weekly Sow → Harvest ritual at least once.
9. Turn AI on knowingly, see what it read, get safe output, and stay within the allowance without errors.
10. Use it with a patchy signal without losing anything.
11. Send feedback from any screen, and download or delete all their data.
12. Never meet a dead end, a "coming soon" page, a blank screen, or a mock feature.

Plus, behind the scenes: production data is backed up and restorable; Cassidy can see crash reports and feedback; costs are capped.

### Essential for launch
Everything in the list above, which is **mostly built**. The work is verification, polish and safety, not new features.

### Can wait until after launch
YOU Realm (life RPG), payments/Premium subscription, KommYOUnity reaching beyond the Kronk community, Kronk sign-up from YOU, Web Push, Living Atlas, Healing Journey/Empatherapy, Events/Calendar, Therapists, Shop, Challenges/Saved/Review pages, more YOUniversity Arcana and formats, animal-sign reflections, plant-medicine questionnaires, CommYOUnity love-hours tracker, 100 MB education videos, Codex DB sync, Mirror/compass extensions, AI chapter intros for My Story, native apps.

---

## 5. Technical overview

### 5.1 Stack and key dependencies (`web-next/package.json`)
React 18.3, react-router-dom 6, Vite 5, Tailwind 3.4, Framer Motion 12, `@supabase/supabase-js` 2, lucide-react, maplibre-gl 5 (maps), exifr + heic2any (photo handling), qrcode, Vitest 2. Edge Functions: Deno/TypeScript calling the Anthropic Messages API.

### 5.2 Architecture
```
web-next/
  index.html            sets light/dark before first paint
  src/main.jsx          providers (Auth, AppData), router
  src/App.jsx           pre-auth gates (privacy, Kronk callback, email confirm,
                        welcome universe, sign-in, password recovery, first-run
                        welcome) then <AppShell> routes
  src/lib/
    supabaseClient.js   client; reads VITE_SUPABASE_URL/ANON_KEY from .env;
                        custom fetch → offline.js (cache + write queue)
    AuthContext.jsx     session, prefs (auth user_metadata). DEV_MODE must stay "live"
    AppDataContext.jsx  almost all table reads/writes and XP logic (2.4k lines)
    plugins.js / navigation.js   extras + menu/bar model
    premium.js, aiSources.js, aiCost.js   AI gate, consent sources, cost display
    xp.js, habits.js, week.js (localDateKey: always device-local dates), seasons.js …
  src/components/       screens/, home/, journal/, pursue/, journey/, values/,
                        pillars/, sow/, focus/, wandering/, youniversity/, course/,
                        showcase/, projects/, welcome/, ui/
  src/constants/        values Codex (100, compiled by scripts/compile-codex.mjs
                        from content/valyous-codex), arcana, mementos, questionnaires
supabase/
  migrations/           42 files, 23 Sep → 3 Nov 2026 (applied by hand)
  functions/            12 Edge Functions + _shared (anthropic, limit, moderate,
                        sources, notion, cors…)
  email-templates/, codex/, tests/
```
Every route is client-side; `netlify.toml` builds from `web-next` and rewrites `/*` to `index.html`.

### 5.3 Repository and deployment workflow
- Branches: `main` (live) ← `staging` (test) ← short-lived `section/<name>`, `notes/<topic>`, `fix/<topic>` branches. **Always PR into `staging` first**, Cassidy tests on the staging URL, then PR `staging` → `main`. Netlify deploys both automatically.
- Several sessions may work in parallel via **git worktrees** outside OneDrive (copy `web-next/.env`, junction-link `node_modules`, use a different port, sign in again).
- Migrations: write a file in `supabase/migrations/`, then Cassidy pastes the SQL into the Supabase SQL editor **after explicit go-ahead**. Never `supabase db push`.
- Edge Functions: deployed with the Supabase CLI (`supabase functions deploy <name>`). Secrets: `ANTHROPIC_API_KEY`, `KRONK_*`, `NOTION_TOKEN`, `NOTION_BUILD_NOTES_DB`, AI limit secrets, `AI_REQUIRE_PREMIUM`.
- Cassidy asks for commits, pushes and merges explicitly; don't do them unasked.
- Domain: `yourownuniverse.life` at GoDaddy DNS → Netlify. Email: Resend (eu-west-1) as Supabase SMTP.

### 5.4 Database (Supabase Postgres, RLS on every table)
**Legacy core (no CREATE migration in repo):** `profiles`, `items` (habits/goals/dreams/ideas), `memory` (XP events per Pillar), `mood_log`, `user_values`, `value_challenges`, `life_moments` (memories + `photo_paths`), `life_chapters`.

**Created by migrations:**
- Journal: `journal_entries`, `journal_photos`, `journal_highlights`, `journal_ai_insights`, `weekly_reflections`, `reflections`, `dream_patterns`, `younderstandings`
- Pursuits & rhythm: `habit_logs`, `todos`, `week_intentions`, `week_harvests`, `focus_sessions`, `projects`, `project_notes`
- Identity & values: `identity_visions`, `values_library`, `value_compass`, `value_words`, `codex_word_reviews`
- Story: `seasons`, `wanderings`, `wandering_stops`
- YOUniversity: `arcana`, `user_arcana`, `arcanum_progress`, `arcanum_walks`, `arcanum_codes`, `arcanum_code_redemptions`, `own_tools`, `tool_uses`
- Showcase/creators: `artist_profiles`, `showcase_works`, `showcase_credits`, `showcase_saves`, `showcase_reports`
- Platform: `ai_consent`, `ai_usage` (service-role writes only), `entitlements` (service-role only), `admins`, `beta_feedback`, `client_errors`, `kronk_links`
- Storage buckets include `life-moments` (WebP/JPEG ≤ 5 MB), journal photos, private `showcase`.

### 5.5 Edge Functions
AI: `reflect-on-journal-entry`, `weekly-reflection`, `infer-season`, `suggest-chapters`, `suggest-value-challenges`, `transcribe-journal-photo`, `read-my-dreams`, `ask-younderstanding`. Other: `kronk` (OAuth connect/login/feed/post), `send-feedback`, `send-build-note` (→ Notion), `delete-account`.

### 5.6 Known technical risks
1. **One database for staging and production**, with real personal journals in it.
2. **Schema can't be rebuilt from the repo**; migration history out of sync.
3. **Backups unverified** on the Free plan.
4. **Almost no automated tests**; regressions are caught by hand.
5. **Large JS bundle**; slow first open on mobile data.
6. **Single-person bus factor** and dependence on an external admin (Chris) for Kronk.
7. AI behaviour with real consent is **largely untested in production**.
8. Paid course content is in the public bundle.
9. iOS PWA quirks (storage eviction, notifications, camera/HEIC) not systematically tested.

---

## 6. Development roadmap (21 days, 4–25 Nov 2026)

Complexity: **S** ≤ half a day · **M** ~1 day · **L** 2–3 days · **XL** 4+ days. Times assume one AI-assisted developer and Cassidy testing.

### Critical — must be done for MVP
| # | Task | Size | Est. |
|---|---|---|---|
| C1 | **Feature freeze** on new features; Realm, payments and new extras parked | S | 0 |
| C2 | Read `client_errors` + `beta_feedback` + Build Notes "New"; triage into fix-now / later | S | 2 h |
| C3 | **Schema baseline**: `supabase db dump --schema-only` of production into the repo (`supabase/schema/baseline.sql`); document the legacy tables; confirm `items.type` accepts `idea` | M | 1 day |
| C4 | **Backups**: confirm what's restorable; either upgrade to Pro (daily backups, leaked-password check) or schedule a weekly `pg_dump` + storage export; do one test restore into a scratch project | M | 1 day |
| C5 | Finish **PursYOUts** polish from the 2 Nov brief (compact cards that open, quick add + "More", Sow/Harvest card at top, page Add button, painted header) | L | 2 days |
| C6 | Finish **YOUrney** sprint items (Your Season time choice + full-screen read + save/delete; check AI says what it read) | M | 1 day |
| C7 | **YOU** page pass (values flow is clear for a newcomer; Codex wording sanity check for the most-picked ~20 values) | M | 1 day |
| C8 | **AI test pass** with a test account, consent on: every AI feature, cost guard, moderation, error messages, allowance display | M | 1 day |
| C9 | **Phone QA** of the full new-user journey (iPhone Safari PWA + Android Chrome), incl. offline/airplane mode, small screens, light and dark | L | 2 days (+ fixes) |
| C10 | **First open**: loading screen, welcome universe, sign-up, tour describe the real beta; remove any path to parked pages | M | 1 day |
| C11 | **Settings & trust** pass: privacy text still true, export JSON complete, delete account verified on a test account, AI consent clear | S | half day |
| C12 | **Beta kit**: rewrite `TESTER-NOTE.md`, invite list, a short "what to try" checklist, a feedback rhythm (e.g. weekly check-in) | S | half day |
| C13 | Bug-fix buffer for what C8–C9 find | L | 3 days |

### Important — if time permits
| # | Task | Size | Est. |
|---|---|---|---|
| I1 | Code-split the main bundle (lazy-load routes and extras); target < 600 KB main chunk | M | 1 day |
| I2 | A handful of Playwright smoke tests (sign in, add habit, journal entry, memory) + GitHub Action on PRs to `staging` | L | 2 days |
| I3 | Separate **staging Supabase project** built from the baseline (C3) | L | 2 days |
| I4 | Fix double XP when tending + checking in the same habit | S | half day |
| I5 | Extras sweep: each extra works when switched on (YOUniversity, Focus, Projects, Showcase, To-do, Threshold); hide any that don't | M | 1 day |
| I6 | KommYOUnity end-to-end test (needs Chris for `you.kronk.info`); confirm `kronk_links` migration applied | M | 1 day + Chris |
| I7 | Update `web-next/README.md`; delete merged branches; tidy untracked design files | S | 2 h |
| I8 | Slower, more intimate loading screen (Build Note) | S | half day |

### Future — post-launch
| Task | Size |
|---|---|
| YOU Realm life game (art pipeline for ~165 images, coins ledger, server-side transfers) | XL (weeks) |
| Stripe: YOU Premium subscription + paid Arcana; move paid content behind RLS/Storage | XL |
| Web Push (Focus done, season nudges, community) | L |
| Kronk: sign-up from YOU, likes/boosts/replies, email for Kronk-only users | L |
| Living Atlas, Healing Journey / Empatherapy, Events/Calendar, Therapists, Shop | XL each |
| More Arcana, course/tool formats, Codex DB sync, compass/Mirror extensions | L–XL |
| Refactor `AppDataContext` into per-domain hooks | L |
| Native wrappers (Capacitor) if PWA limits bite on iOS | XL |

### Suggested calendar
- **Days 1–3 (4–6 Nov):** C1–C4, start C5.
- **Days 4–8 (7–11 Nov):** C5, C6, C7, C10, C11.
- **Days 9–12 (12–15 Nov):** C8, C9, C12, start fixing.
- **Day 13 (16 Nov):** invite the first wave (≈ the original launch week).
- **Days 14–21 (17–25 Nov):** C13 fixes from real testers, then Important items in order I1, I4, I5, I2, I7, I8, I3, I6.

---

## 7. Recommendation

### What to prioritise
**Trust, then clarity, then polish.** The app already has far more features than a beta needs. What decides whether testers stay is: nothing gets lost (backups, offline, safe deletes), they understand what to do in the first minute, and the five core pages feel finished and beautiful. Spend the sprint making the existing core *reliable and obvious*, not bigger.

### What to avoid wasting time on
- **YOU Realm.** It's a lovely idea and the biggest scope risk in the repo: it needs ~165 art images, a currency ledger and a game design. Park it entirely until after the beta tells you people use the YOU page.
- **Payments and Premium.** AI is capped at $1/tester/month; with 12–30 testers that's at most ~$30. Don't build Stripe for a private beta.
- **Parked pages** (Atlas, Healing, Events, Therapists, Shop, Challenges, Saved, Review). They're hidden; leave them hidden.
- **New extras or new AI features.** Every new idea goes to Build Notes for after the beta.
- **Repeated visual reworks** of finished pages (the design has changed palette three times in two months). Lock Nature & Cosmos for the sprint.
- **Kronk-dependent work** until Chris has done his part.

### What I would simplify
- PursYOUts cards: one line per pursuit, tap to open detail.
- The add form: name + type + life area, everything else behind "More".
- Make Sow/Harvest a single visible weekly card rather than something found only on certain days.
- Consider making only one or two extras visible in the beta (e.g. Focus and YOUniversity) and keeping the rest fully off, so testers' feedback concentrates on the core.
- Retire the root vanilla app from the repo (or move it to an `archive/` folder) and fix the README so future collaborators aren't misled.

### Fastest sensible path to a functional release
Freeze features today → secure the data (schema baseline + backups) → finish PursYOUts/YOUrney/YOU polish → run one honest phone test of the whole new-user journey and the AI features → fix what breaks → rewrite the tester note → invite the first small wave around 16 November → spend the last week fixing what real people hit. Everything else waits for evidence from testers.

---

## Executive summary

YOU is a calm, beautifully illustrated personal-growth "living biography" PWA: journal, habits/goals/dreams, values, memories and AI reflections, built in React + Supabase and **already live** at yourownuniverse.life with a few real users. Feature coverage is broad and largely real (not mockups): the five core sections (Home, YOUrnal, PursYOUts, YOUrney, YOU) read and write real data; offline mode, AI with consent/cost caps/moderation, export/delete, feedback and crash reporting all exist. Eight extras exist behind switches; eight more pages are hidden "coming soon" stubs; the YOU Realm game is an unmerged work in progress.

The gap to a launch-ready private beta is **not features but confidence**: several important flows (AI with consent on, offline on a phone, Kronk, the full new-user journey on iOS/Android) are recorded as untested; staging and production share one database; the core schema isn't fully in the repo; backups are unverified; automated tests are nearly absent. The fastest route is a feature freeze, data safety, focused polish of the five core pages, a rigorous phone test, and a small invited beta around 16 November with the final week reserved for fixing what testers find.

### Recommended next five tasks
1. **Freeze features and triage**: read `client_errors`, `beta_feedback` and Notion Build Notes; tag each item launch-blocking or post-beta. *(S, 2 h)*
2. **Secure the data**: dump the production schema into the repo, document the legacy tables, confirm the `idea` type is accepted, and set up and test a restorable backup. *(M, ~2 days)*
3. **Finish PursYOUts** (today's sprint section): compact cards, quick-add form, Sow/Harvest card, Add button, painted header. *(L, 2 days)*
4. **AI test pass + phone QA** of the complete new-user journey on iPhone and Android, including airplane mode and both themes; log every issue. *(L, 2–3 days)*
5. **Finish YOUrney and YOU, then the beta kit**: Your Season controls, a clear values flow, an updated tester note and invite list. *(M–L, 2–3 days)*
