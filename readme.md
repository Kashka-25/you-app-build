# YOU — Your Own Universe

A gamified personal-growth PWA. Vanilla HTML/CSS/JS + Supabase + Netlify.
No build step — files load directly in the browser via `<script>` tags in dependency order.

## Run locally

```
npx serve . -p 8888
```

Open in incognito to avoid service-worker cache during development.

## Deploy

1. Inject your Supabase anon key into `js/config.js` (replace `REPLACE_KEY`).
2. Drag the whole `you-app/` folder to Netlify (or push to a connected repo).

## Architecture

This project is organised into modular files so each concern lives on its own.
Load order matters (no bundler) and is defined in `index.html`:

```
config → constants → services → utils → features → app
```

### Folder map

```
you-app/
├── index.html              # single page; loads all modules in order
├── manifest.json           # PWA manifest
├── sw.js                   # service worker (cache name: you-v5-modular)
│
├── styles/                 # design system, split by concern
│   ├── tokens.css          # ← colours, fonts, spacing, reset. EDIT THEME HERE.
│   ├── auth.css            # auth screen, onboarding, level-up overlay
│   ├── layout.css          # app shell, avatar panel, header, xp bar, stats, tabs
│   ├── cards.css           # add form, filters, item cards
│   ├── calendar.css        # memory bank, astrology, calendar, mood
│   ├── values.css          # tags, pillars, values tab
│   └── modals.css          # all modals, toast, mobile responsive
│
└── js/
    ├── config.js           # Supabase client + app constants (XP, levels, pillars)
    ├── constants/
    │   ├── values.const.js # the 12-value library + challenges
    │   └── levels.const.js # avatar SVG art per stage
    ├── services/
    │   ├── auth.service.js # magic-link login, session, sign-out
    │   └── db.service.js   # Supabase load/save for items, memory, mood
    ├── utils/
    │   ├── astrology.util.js # sun/moon/rising signs, moon phase, guidance
    │   └── streak.util.js    # streak + date-key helpers
    ├── features/
    │   ├── state.js        # global state object, profile, stats, toast
    │   ├── onboarding.js   # onboarding flow + value picker
    │   ├── avatar.js       # Seed Being render, environments, level-up
    │   ├── pursue.js       # items: add, complete, un-achieve, edit, delete, cards
    │   ├── memory.js       # Memory Bank render
    │   ├── tags.js         # Tags tab grouping
    │   ├── pillars.js      # Pillars XP render
    │   ├── values.js       # values, challenges, breakthroughs, add-value
    │   └── calendar.js     # calendar grid, mood logging
    └── app.js              # tab routing, render orchestration, init (loads LAST)
```

## Where to make common changes

- **Change a colour or font:** `styles/tokens.css`
- **Add/edit a value or its challenges:** `js/constants/values.const.js`
- **Tweak XP values or level thresholds:** `js/config.js`
- **Change avatar art:** `js/constants/levels.const.js`
- **Edit the item card layout:** `js/features/pursue.js` (`cardHtml`) + `styles/cards.css`
- **Auth behaviour:** `js/services/auth.service.js`
- **Database queries:** `js/services/db.service.js`

## Important conventions

- **Load order is dependency order.** A file may use a function defined in an
  earlier-loaded file, never a later one. If you add a new module, place its
  `<script>` tag in `index.html` after its dependencies.
- **No ES modules / imports.** Everything shares one global scope. Functions and
  the `S` state object are globally accessible. This is intentional for the
  no-build setup.
- **`app.js` loads last** because its `DOMContentLoaded` handler calls
  `checkAuth()`, which needs every other module present.
- **When editing the service worker asset list,** bump `CACHE_NAME` so clients
  pick up the change.

## Notes for future migration

When the team grows or the marketplace build begins, this structure ports
cleanly to React + Vite: each `features/` file becomes a feature folder,
`services/` and `utils/` carry over almost unchanged, and `tokens.css` becomes
the design-token source. See `YOU-v5-architecture.md` for the full plan.
