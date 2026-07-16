# Build backlog — web-next UI

> Living doc. Update as items get built or new ones surface — don't let this
> only live in chat history. Companion to `PHASE-0-DECISIONS.md`.

---

## Standing rules (apply to every screen, not just Home)

These came out of the Home redesign pass but should govern all of Phase 2,
not be re-derived per screen. The principle: design for ease of mind,
full stop — not a special mode for some users. A calm, uncluttered
interface is just better design, and it happens to be what serves
everyone, regardless of how any individual mind works.

- **Predictable layout** — same structure every load, no shuffling/randomized
  card order.
- **Low decision load** — never more than 2–3 choices at the same visual
  level at once. Hide the rest behind "see all" rather than shrinking
  everything to fit.
- **No urgency or pressure cues** — no countdown timers, no "streak about to
  break!" red alerts, no flashing badges.
- **No autoplay motion** — nothing moves without the user acting on it.
- **Icons always paired with text labels** — never icon-only for anything
  actionable.
- **Generous, consistent spacing** — if in doubt, remove content rather than
  shrink it to fit.
- **Escape hatches** — anything expandable should be just as easy to
  collapse. Nothing should feel like a one-way commitment.

---

## Fix first (small, high-value) — done Jul 16

- [x] Hamburger menu overlay scrim — now `bg-black/60` + `backdrop-blur-sm`,
      hero properly recedes instead of bleeding through.
- [x] Hero pill relabeled "Current Chapter" → "Level — Seedling". "Current
      Chapter" is reserved for when real Chapters data exists.

## Build: the Add action-sheet gap — done Jul 16

`AddActionSheet.jsx` now shows the 3-choice sheet on tapping **+**:

- [ ] **Today's list** — still an open data-shape decision (reuse `items`
      with `type: "todo"`, or its own shape?). The sheet stops at surfacing
      this question rather than guessing — nothing is built here yet.
- [x] **Habit, goal, or dream** — routes to the existing `AddItemModal`,
      unchanged.
- [x] **Journal entry** — working quick-capture UI; honest in the confirmation
      copy that Reflections is still a placeholder so nothing persists yet.

## Other loose ends — confirmed Jul 16

- [x] `/styleguide` exists and loads clean (`src/components/screens/Styleguide.jsx`).
- [x] Home's "Living Atlas" explore card is confirmed **hardcoded**, not
      dynamic — noting so it isn't mistaken for finished logic later.
- [x] Values challenges do **not** auto-regenerate once a value's full
      challenge list is completed — confirmed no such logic exists in
      `completeChallenge` or `values.const.js`. Needs a scoping decision
      (where does "new" challenge content come from?) before building.

---

## Phase 2 — screen-by-screen order

- [x] **Home** — built
- [x] **YOU tab** — Pillars/Values rebuilt as icon-led accordions (lucide
      icons, expand/collapse), Seed Being avatar, Legacy card. Pillars now
      level up every 100 XP with a fill-and-reset bar + badge, same pattern
      as Values' tiers. Avatar-upgrade-station is a placeholder card only
      (same treatment as Legacy) — the mechanic itself isn't designed yet.
- [x] **Journey** — segmented control (Chapters / Tree & Stars /
      YOUnderstanding) built. Chapters has mock era cards (name + date
      range + blurb) plus a Season card, Your Pursuits ordered right after
      Season. Tree & Stars is a single fused ambient scene (tree rooted
      below, sky/starfield above, real time-of-day, independent of the
      dark/light toggle) — tapping the tree opens the interactive Tree of
      YOU (roots = 12 Values by tier, canopy = 7 Pillars by XP, tap either
      to trace the Value→Pillar connection); tapping the sky opens
      Constellations. Back from either returns to the ambient scene.
- [x] **Pursue** — migrated to the design system (floating cards, icons,
      type scale). All data calls (items, completeItem, toggleDay,
      toggleMilestone, deleteItem, unachieveItem, addItem) unchanged.
      **Habit XP exploit fixed**: check-in XP is now idempotent per
      day-slot per prestige cycle (undo zeroes the XP but keeps a
      permanent lock, so toggling on/off/on can't re-farm it). Streak is
      now derived from the days array instead of tracked incrementally, so
      it can't drift. New: 7-day streaks offer a prestige reset (fresh
      cycle + permanent tier badge).
- [x] **Everything else** — given basic interactive (local-state, not
      backend-wired) shells instead of static placeholders: Events
      (join/leave), CommYOUnity (likeable mock feed — **see decision
      below, this is about to be replaced with real Kronk data**), Healing
      (session timeline), Therapists (booking flow), Challenges (full
      Active/Suggested/Overcome flow per the spec below), Saved (tabbed
      shell, category still unscoped), Review (real feedback form), Shop
      (mock cart, no real commerce). Empatherapy and a new Settings screen
      (Settings/Account consolidated here from the YOU tab) stay minimal
      parked stubs — both genuinely deferred, not under-built.

---

## Reminders that keep coming up

- `DEV_MODE` stays `"bypass"` — building with mock data deliberately, not
  wiring real login yet.
- Don't touch `AppDataContext.jsx` / `AuthContext.jsx` without asking —
  that's the data-layer friend's territory.
- Kronk integration stays contained in its own file(s), not folded into
  `AppDataContext.jsx`/`AuthContext.jsx` or scattered into `Community.jsx`
  as inline fetches — see the CommYOUnity section below for why.
- Stay on `feature/living-biography-ui`. No new branches.
- Seed Being keeps its existing name/branding — not renamed. Only the
  Journey insight feature was renamed, to **YOUnderstanding**.

---

## Brain dump (Jul 15) — future ideas, not yet scoped for build

Captured as-is. Nothing here is approved for building yet — these need a
scoping pass first, most depend on other missions (Kronk, Empatherapy)
existing, and a few overlap with things already defined elsewhere in the
ecosystem docs (flagged below).

### CommYOUnity
- **Decision confirmed (Jul 16): real Kronk integration, now.** This
  supersedes the earlier "rename only, no Kronk wiring yet" decision and
  moves Kronk earlier than the ecosystem build order originally had it
  (YOU Core → Empatherapy → Kronk → Elemental Game) — worth a corresponding
  note in `03-YOU-LIVING-BIOGRAPHY-pivot-brief.md` if that order is
  genuinely changing, not just this one feature jumping the queue.
- **Containment rule, not a suggestion: keep all Kronk integration code in
  its own file(s)** — e.g. a `KronkContext.jsx` / `lib/kronkClient.js`,
  parallel to how `AppDataContext.jsx` and `AuthContext.jsx` are already
  split out, not folded into either of them. `Community.jsx` should read
  from that new context/hook the same way every other screen reads from
  `useAppData()` — it shouldn't grow inline `fetch` calls to Kronk's API,
  and Kronk's data/auth shape shouldn't leak into `AppDataContext.jsx`.
  This is what keeps the two data sources (Supabase for the core app,
  Kronk for the social feed) from cross-contaminating each other as the
  codebase grows — every other screen should be able to keep ignoring
  Kronk entirely, the same way they currently ignore Supabase auth details.
- Pull the feed in from Kronk (friend's Mastodon server), reskin to YOU
  branding, credit line: "Proudly powered and supported by Kronk."
- `Community.jsx` currently has a **mock local-state feed** (post cards
  with like-toggling, no persistence) — built as a structural placeholder,
  not real data. Whoever wires up Kronk will likely replace this outright
  rather than adapt it, since a Mastodon-shaped feed (boosts, replies,
  media attachments, remote authors) doesn't map cleanly onto the
  simple post shape mocked here. Treat the current UI as a rough visual
  reference, not a data contract to preserve.

### Therapists
- Once Empatherapy exists as its own site, Therapists page links out to it
  — practitioners get "double placement" (visible in both places).
- Idea (unresolved, thinking out loud): a filter/toggle between (1)
  therapist-authored posts/guidance and (2) their linked Kronk feed. Open
  question — build therapist-posting as its own thing inside Empatherapy
  and just link to it from YOU, or build it natively in YOU? Not decided.

### Journey section — per-feature notes
- **Constellations** — unchanged: memories as stars, pulled from Memory
  Bank, connecting stars reveals patterns.
- **Tree of YOU** — resolved driver: **Values**. Design direction: Values
  are already mechanically linked to Pillars in the data model (each Value
  feeds one or two Pillars via `VALUE_PILLAR`/`VALUE_PILLAR2` in
  `app.const.js` — completing a Value challenge already awards XP to its
  linked Pillar). The tree should make that existing relationship visible
  and interactive, not invent a new one:
  - **Roots = the 12 Values.** Each root's thickness/color follows the
    Value's tier (Awakening → Practising → Embodying → Mastering, using
    the existing tier colors).
  - **Branches/canopy = the 7 Pillars.** Fullness/leaf density follows
    Pillar XP, same data already computed in `pillars.js`/`PillarsPanel`.
  - **The interaction:** tapping a root highlights which branch(es) it
    feeds (a glow/line through the trunk, following the existing
    Value→Pillar mapping); tapping a branch highlights which roots feed
    it. This turns "here's a value, here's a pillar" from two separate
    lists into one visual cause-and-effect map — the actual teaching
    value of the metaphor.
  - Keep this distinct from Seed Being: Seed Being is identity/mythic
    progression ("who I'm becoming"), the Tree is a structural map of
    growth ("here's what's feeding what"). Different job, both stay.
- **Chapters** — recommendation (Cassidy to confirm): give it a distinct
  job by thinking of Journey as three zoom levels, not three overlapping
  features —
  - **Constellations** = the individual dots: single meaningful memories.
  - **Chapters** = the grouping: multi-month/year eras with a name and
    date range (e.g. "Learning to Feel, 2019–2021"), each one gathering
    the Constellation-dots and mood-log data from that period into a
    readable arc. This is the actual "Life Chapters" concept from the
    Living Biography pivot brief — AI-detected periods, not manually
    created.
  - **YOUnderstanding** = the interpretive voice: the AI noticing
    patterns *across* Constellations/Chapters/mood data, on a recurring
    cadence (short-term nudges now, monthly/yearly Legacy-style capsules
    later).
  Under this framing Chapters isn't redundant with Constellations (zoomed
  out vs. zoomed in) or YOUnderstanding (structural grouping vs.
  interpretation). If this still doesn't feel necessary once you see it
  built, the fallback is folding mood/season tracking into Reflections
  and dropping Chapters as its own screen — but worth trying the "three
  zoom levels" framing first before cutting it.
- **YOUnderstanding** — grows into monthly/yearly reflection moments,
  described as a Spotify-Wrapped-style immersive capsule (visual + audio,
  possibly AI-generated video) built from a YOUser's full history —
  goals, habits, dreams, achievements, journal entries. Ties directly into
  Legacy Mode. Ambitious, long-horizon — AI-generated video especially is
  a real technical unknown, not just a design task. Treat as a defined
  future project (design direction now, build much later), same pattern
  as astrology.
- **EmOCEAN** — **resolved: this is The Elemental Game**, not a separate
  feature. Use "The Elemental Game" as the canonical name going forward
  (EmOCEAN can stay as flavor/internal working title if it's a nicer hook,
  but don't scope two features for the same thing). Still built last per
  ecosystem build order — design-later, not now.

### Add button
- Confirmed, no change: 3 choices — habit/goal/dream, to-do list, journal
  entry. (Still needs the actual sheet built — see "Build" section above.)

### Calendar
- Idea (explicitly called "blurry" by Cassidy): let users add events to a
  personal calendar; pull in Kronk events posted by friends; pull in
  Empatherapy session bookings. Depends on both Kronk and Empatherapy
  existing. Not scoped, just noted.

### YOU tab
- Direction: Pillars/Values XP should lead to something *usable and
  visual*, not just a number — Sims/Fallout-style attribute-driven
  upgrades to avatar/companion/world, not only stat bars. This lines up
  with "avatar upgrade station" already in the nav plan — this brain-dump
  note is the rationale/depth behind that nav item, worth designing
  together rather than as two separate features.
- Also wants: dropdown menus, more color/icon richness for aesthetic
  clarity (currently fairly flat/minimal).

### Top bar
- Profile icon (top right) → account settings + basic profile info +
  stats.
- Notification bell → CommYOUnity notifications, therapist
  messages/nudges, habit/goal/dream reminders, plus one daily-rotating
  "gratitude reminder" message pinned at the top of the notification list
  (changes once a day).

### Home header
- Greeting + a short, warm rotating message (encouragement / gratitude
  prompt / fun fact / line of poetry) — changes once per day, different
  again in the evening. Open question: pre-written content library, or
  AI-generated? Keep tone aligned with the philosophy brief's voice
  (gentle, non-preachy) regardless of source.

### Shop
- Future marketplace, filterable, linked to Kronk's marketplace. Note:
  ecosystem doc is explicit that YOU's marketplace and Kronk's marketplace
  are **separate systems with some crossover items, not one shared
  store** — "directly linked" should mean crossover items surfacing here,
  not a merged storefront.

### Challenges — now has a real proposed purpose
Personal hardship-tracking page, distinct from Pursue's goals/habits/dreams:
- YOUser can log a personal challenge they're facing/want to overcome.
- Self-assessed "honesty scale" for how much XP they believe they earned
  overcoming it (interesting, non-standard XP model — worth a design pass
  on its own).
- Journal entry flow could prompt, at the end: "want to track this as a
  Challenge?"
- Therapists can also suggest a Challenge to a YOUser, who can
  accept/reject it — rejected ones move to a separate tab rather than
  disappearing.

### Saved
Multiple competing ideas, not yet narrowed down:
- Saved CommYOUnity posts
- Saved daily quotes/messages
- Saved EmOCEAN features/tools
- A personal "toolkit library" of skills/tools learned through the app
Possibly tabbed to hold more than one of these at once. Needs a scoping
decision before building — don't build all of these in parallel.

### Review
- Confirmed: in-app feedback + suggestion box for feature requests/removals.

### Donate — resolved
Separate from the Empatherapy Fund, not the same mechanism. Two options
offered at donation time:
1. Support the YOU app directly
2. Support the Empatherapy Fund (healing access for those who can't afford
   it — as already defined in the ecosystem master vision)
Both live under one "Donate" entry point, presented as a simple either/or
choice at the point of donating.

### Share
- Referral system with a friend discount incentive, plus a shareable YOU
  profile link that auto-connects the recipient to whatever's shared on
  CommYOUnity. Depends on Kronk accounts existing — future item.

### Branding
- Real logo + photography still needed eventually. Placeholder imagery
  (current painterly landscape style) is fine to keep using in the
  meantime — don't block build momentum waiting on final brand assets.

