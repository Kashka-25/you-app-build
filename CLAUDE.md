# CLAUDE.md: YOU, Your Own Universe

Context for Claude Code sessions in this repo. The full picture lives in
`HANDOVER-FOR-CHATGPT.md` (what's built, architecture), `SPRINT-ROADMAP-42H.md`
(current sprint and progress) and `docs/ROADMAP.md` (index plus "Next"). When
those docs and this file disagree, the dated sprint docs win; fix this file.

## What YOU is
"The Living Biography": a calm, private personal-growth and community PWA. It
blends a journal (YOUrnal), habits/goals/dreams/ideas (PursYOUts), memories,
chapters and seasons (YOUrney), values and Pillars (YOU), with AI reflections
that are opt-in. Owner: Cassidy (GitHub `Kashka-25`). Users are **Seekers**
(the default identity) or YOUsers. Pivot rationale:
`03-YOU-LIVING-BIOGRAPHY-pivot-brief.md`.

- Live: https://yourownuniverse.life (Netlify site `you-app-build`)
- Staging: https://staging--you-app-build.netlify.app (branch `staging`)
- Supabase project `yikoymzktspamahrsuje` (Pro since 5 Nov 2026)

## Repo layout
- `web-next/`: **the app** (React 18 + Vite 5 + Tailwind 3 + Framer Motion).
  Netlify builds it per `netlify.toml` (base `web-next`, publish `dist`, `/*`
  rewritten to `index.html`).
  - `src/App.jsx`, `src/main.jsx`; `src/lib/` (Supabase client, `AuthContext`,
    `AppDataContext`, `offline.js`, `xp.js`, `plugins.js`, `navigation.js`,
    `accountData.js`); `src/components/`; `src/constants/` (values Codex,
    arcana incl. `arcana/sovereignEmpath.js`)
  - `BUILD-BACKLOG.md` (living backlog and past decisions),
    `PHASE-0-DECISIONS.md` (type scale, spacing, icons), `README.md`
- `supabase/`: `migrations/` (applied by hand), `functions/` (Edge Functions +
  `_shared`), `schema/` (`baseline.sql`, `snapshot.mjs`), `backup/`
  (`backup.mjs`, `restore.mjs`), `tests/`, `email-templates/`, `codex/`
- Repo root `index.html`, `js/`, `styles/`, `sw.js`, `readme.md`: the **old
  vanilla app, no longer deployed**. Don't edit it; `readme.md` describes it.
- `design/`: art briefs, prompts and emblem work.

## Commands (run in `web-next/`)
```
npm install
npm run dev       # Vite on http://localhost:5173
npm run build     # vite build
npm run preview
npm test          # vitest run
npm run codex     # node scripts/compile-codex.mjs (rebuilds the values Codex)
```
Needs `web-next/.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; see
`.env.example`). `DEV_MODE` in `src/lib/AuthContext.jsx` must stay `"live"`.

## Ground rules
1. **Never run `supabase db push`.** Write SQL in `supabase/migrations/`;
   Cassidy pastes it into the Supabase SQL editor after an explicit go-ahead.
   Back up first (`supabase/backup/backup.mjs`), then re-run
   `supabase/schema/snapshot.mjs` and commit `baseline.sql`.
2. **Every change goes through a PR to `staging` first** (`section/*`,
   `docs/*`, `fix/*` branches). Cassidy tests on staging, then `staging` → `main`.
   Commit, push and merge only when Cassidy asks.
3. **Real journals live in the live database.** Staging has its own project,
   `you-staging` (`oiiznskttnflnekbfykx`), with the same structure and test
   data only (docs/STAGING-DATABASE.md). Until Netlify's staging and preview
   contexts point at it, the staging site still uses live. Migrations and
   function deploys go to both projects, staging first. Never read or copy
   user content.
4. **Trust → clarity → polish.** The 21-day MVP sprint (4–25 Nov 2026, ~12
   beta testers) is about trust and correctness, not new features. New ideas go
   to Build Notes for after the beta.
5. Calm-design rules in `BUILD-BACKLOG.md` apply: no streak-break pressure, no
   urgency, icons with text labels, escape hatches everywhere.

## Key decisions
- Seeker is the default identity; "Alchemist" is recognised practice, not a tier.
- Ecosystem build order: **YOU Core → Empatherapy → Kronk → Elemental Game**.
- Healing Journey: designed only, hidden; built after Empatherapy exists to feed
  it (Empatherapy / IntoTheLighthouse, formerly HOPEIUM).
- 3 Nov "K.I.S.S." reset: five core sections (Home, YOUrnal, PursYOUts,
  YOUrney, YOU); everything else is an Extra, off by default.
- YOU Realm (`feat/you-rpg`) is parked until after the beta.
- Planned (8 Nov): an "entry key" demo mode so portfolio visitors can try YOU
  as a blank or example user. It must **never** touch real user data and needs
  a separate demo backend. Not built.

## Known risks
- Staging's own database (you-staging) is built; the staging site still uses
  live until Netlify's staging/preview environment variables are switched.
- Paid YOUniversity course content ships in the public JS bundle
  (`src/constants/arcana/`); must move behind RLS/Storage before selling.
- Core legacy tables have no CREATE migrations; `supabase/schema/baseline.sql`
  is the source of truth for what the database really is.
- No CI; very few automated tests.
- Main JS chunk is 1.43 MB after lazy-loading.

## Ecosystem
- YOU is one world inside **Creative Universe**, Cassidy's central portfolio
  hub: repo `Kashka-25/creative-universe`.
- **YOUrigin** signs in with YOU accounts and syncs to the same Supabase project.
- Project proposal: https://claude.ai/artifact/Bz16tnjtbRq71HYoFKsvVc
