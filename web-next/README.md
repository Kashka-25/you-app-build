# YOU — web-next (Living Biography rebuild)

React + Vite + Tailwind, scaffolded on the `feature/living-biography-ui` branch
alongside the existing vanilla build (which stays live and untouched at the
repo root). This is a parallel build, not a replacement yet — see
`03-YOU-LIVING-BIOGRAPHY-pivot-brief.md` for why.

## Run it

```
cd web-next
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## What's functional vs placeholder

**Functional (real Supabase read/write, same tables as the live app — `items`,
`memory`, `user_values`, `profiles`):**
- Pursue — add/edit/complete/un-achieve/delete habits, goals, dreams
- Tags, milestones, intention reflection
- Habit day-tracker + streaks + streak bonus XP
- Values — tier progress, challenges, breakthroughs, add a value
- Pillars — computed from XP same as the vanilla app
- Both rendered in the new **attribute-bar stat-screen style** (segmented
  blocks, not sliders) — this closes the open "Pillars/Values UI" item.

**Placeholder only (matches the reference mockup, not wired to data):**
Community, Journey's Life Chapters/Season, Living Atlas, Tree of YOU, Life
Constellations, Healing Journey (parked — Empatherapy not yet live),
Empatherapy bridge (parked), Events, YOU Companion, Reflections, Legacy Mode.

## Dev mode

`src/lib/AuthContext.jsx` has a `DEV_MODE` constant, same pattern as the
vanilla app's `DEV_MODE` bypass:

- `"bypass"` (current default) — skips real auth, uses a fake local user id.
  Supabase reads/writes will run but return nothing under RLS, since that id
  has no real rows. Fine for checking layout and interaction, not for seeing
  real data.
- `"live"` — real Supabase email/password auth. Switch this before testing
  against your actual account data, and definitely before this goes anywhere
  near production.

## Structure

```
src/
  lib/            AuthContext, AppDataContext (all Supabase read/write logic)
  constants/      ported 1:1 from js/config.js and js/constants/values.const.js
  components/
    AppShell.jsx  phone frame, tab bar, mode toggle, quick-add
    Primitives.jsx  shared placeholder/pill/section components
    pursue/       AddItemModal, ItemCard
    values/       ValuesPanel
    pillars/      PillarsPanel
    screens/      one file per screen (Home, Community, Journey, Profile,
                  Pursue, Atlas, Tree, Constellations, Healing, Empatherapy,
                  Events, AICompanion, Reflections, Legacy)
```

## Known gaps / next session

- Edit modal for existing items (add/complete/delete/tags/milestones all
  work; editing an existing item's name/type/category doesn't have a form
  yet).
- Supabase URL/anon key are inline in `supabaseClient.js`, same as the
  vanilla app today — moving to `.env` is still on the backlog, not a
  blocker.
- Mood/energy logging, Calendar/astrology screens not touched yet.
- All placeholder screens are structural only — no imagery, no copy pass.
