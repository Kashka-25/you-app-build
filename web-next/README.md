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
- Habit day-tracker + streaks (derived from checked days, not tracked
  incrementally) + idempotent check-in XP (a day-slot can be undone but
  never re-farmed) + streak bonus XP + a 7-day prestige reset (fresh cycle,
  permanent tier badge)
- Values — tier progress, challenges, breakthroughs, add a value. Challenge
  lists are fixed per value and do **not** auto-regenerate once fully
  completed — confirmed gap, not yet scoped.
- Pillars — computed from XP same as the vanilla app, now with a levels
  system (100 XP/level, fill-and-reset bar + badge, same pattern as Values)
- Both rendered as icon-led accordions (lucide icons, expand/collapse) in
  the YOU tab, not flat always-on bars.
- Home, Journey (Chapters/Tree & Stars/YOUnderstanding), nav shell
  (top bar, hamburger sitemap, bottom tabs, Add action-sheet) are built out
  screen UI, all still reading through the same `AppDataContext` hooks.

**Interactive but not data-wired (local component state only, no
persistence — structural shells, not finished features):** Events
(join/leave), CommYOUnity (mock feed — **about to be replaced by real Kronk
integration, see BUILD-BACKLOG.md**), Healing Journey (session timeline),
Therapists (booking flow), Challenges (full active/suggested/overcome
flow), Saved (tabbed shell, category not yet chosen), Review (feedback
form), Shop (mock cart, no commerce), Living Atlas, Tree of YOU detail,
Life Constellations.

**Minimal parked stubs (genuinely deferred, not under-built):**
Empatherapy bridge, Settings/Account, Legacy Mode.

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
  constants/      ported 1:1 from js/config.js and js/constants/values.const.js,
                  plus getPillarLevel (pillar leveling, mirrors getTier for Values)
  components/
    AppShell.jsx    phone frame, top bar, bottom tabs, sidebar menu, Add sheet
    TopBar.jsx      hamburger + wordmark + avatar/badge + bell
    SidebarMenu.jsx hamburger slide-in sitemap + Settings/Account + dark mode toggle
    AddActionSheet.jsx  3-choice sheet on tapping + (today's list / habit-goal-
                        dream / journal entry)
    Primitives.jsx  shared Placeholder/Pill/SectionTitle/ExploreLink/ParkedScreen
    ui/             design-system library (Button, Card variants, Input variants,
                    Modal, ProgressRing, SegmentedControl, EmptyState, LoadingScreen,
                    shared motion presets) — see /styleguide
    pursue/         AddItemModal, ItemCard
    values/         ValuesPanel
    pillars/        PillarsPanel
    journey/        ChaptersView, TreeAndStarsView, YOUnderstandingView, plus a
                    tree-stars/ subfolder (AmbientScene, TreeDetail, ConstellationsDetail)
    screens/        one file per route — Home, Community, Journey, You, Pursue,
                    Atlas, Healing, Empatherapy, Events, Reflections, Legacy,
                    Therapists, Shop, Challenges, Saved, Review, Settings, Styleguide
```

## Known gaps / next session

- Edit modal for existing items (add/complete/delete/tags/milestones all
  work; editing an existing item's name/type/category doesn't have a form
  yet).
- Supabase URL/anon key are inline in `supabaseClient.js`, same as the
  vanilla app today — moving to `.env` is still on the backlog, not a
  blocker.
- Mood/energy logging, Calendar/astrology screens not touched yet.
- CommYOUnity's mock feed is about to be replaced by real Kronk
  integration — see BUILD-BACKLOG.md.
- The interactive placeholder screens (Events, Healing, Therapists,
  Challenges, Saved, Review, Shop, Atlas, Tree of YOU detail,
  Constellations) all use local component state only — nothing persists,
  no backend wiring exists for any of them yet.
- Today's list (in the Add action-sheet) has no data shape decided —
  needs a call on whether it reuses `items` with a new type or gets its
  own shape before it can be built.
- Values challenges don't auto-regenerate once a value's list is fully
  completed — no content-generation logic exists for this.
