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

## Fix first (small, high-value)

- [ ] Hamburger menu overlay — hero text bleeds through behind the scrim
      when the menu is open (see screenshots, Jul 15). Scrim needs full
      opacity or the hero needs to properly recede/blur behind it.
- [ ] Hero pill currently reads "Current Chapter — Seedling" — this is
      actually the **Seed Being level**, not a Life Chapter. These are two
      separate systems (see `03-YOU-LIVING-BIOGRAPHY-pivot-brief.md`).
      Relabel to "Level — Seedling" now. Reserve "Current Chapter" for when
      real Chapters data exists, so the two concepts don't blur together
      from day one.

## Build: the Add action-sheet gap

Claude Code flagged (Jul 15) that `nav-bars-mockup.html` specifies a 3-choice
sheet on tapping **+**, but the app currently jumps straight to the full
`AddItemModal`. This needs actually building, not just a rename:

- [ ] **Today's list** — quick one-off task, today only. **Open decision:**
      does this reuse the `items` table with a new `type: "todo"`, or does
      it need its own shape? Decide before building — this is a real
      schema decision, not just UI.
- [ ] **Habit, goal, or dream** — routes to the existing `AddItemModal`,
      unchanged.
- [ ] **Journal entry** — quick reflection entry, feeds the Reflections
      screen (currently placeholder — check whether Reflections needs real
      wiring now or can stay a placeholder that this feeds later).

## Other loose ends to confirm, not just build

- [ ] Has the Phase 1 `/styleguide` component library actually been built
      yet? If Phase 2 screens are being styled before it exists, components
      (cards, buttons, inputs) are being designed twice. Check before
      continuing Phase 2.
- [ ] Home's "Living Atlas" explore card — confirm whether the "one
      contextual card" logic is actually dynamic (e.g. picks Healing Journey
      vs Atlas based on recent activity) or currently hardcoded. Hardcoded
      is fine for now — just don't want it mistaken for finished logic.

---

## Phase 2 — screen-by-screen order

- [x] **Home** — built, minor fixes above aside
- [ ] **YOU tab** (formerly Profile) — Pillars + Values attribute bars, Seed
      Being, level/stats, Legacy card
- [ ] **Journey** — segmented control (Chapters / Tree & Stars /
      YOUnderstanding), Life Chapters cards, Season indicator
- [ ] **Pursue** (full list — reached from Journey → Chapters or Home
      "View all") — most function-heavy screen, go carefully
- [ ] **Everything else** (lower priority, still placeholder): CommYOUnity,
      Atlas, Tree & Stars detail, Healing Journey, Therapists, Empatherapy,
      Events/Calendar, Shop, Challenges, Saved, Review, Legacy Mode

---

## Reminders that keep coming up

- `DEV_MODE` stays `"bypass"` — building with mock data deliberately, not
  wiring real login yet.
- Solo build (Sep 28): the data layer is ours now. Change
  `AppDataContext.jsx` / `AuthContext.jsx` deliberately — one migration
  at a time, tested with mock data first.
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
- Real integration with Kronk (friend's Mastodon server) — pull the feed in,
  reskin to YOU branding, credit line: "Proudly powered and supported by
  Kronk." **This is further than the "rename only, no Kronk wiring yet"
  decision on record** — worth explicitly re-confirming timing before
  Claude Code builds toward it, since build order currently has Kronk as a
  later mission.

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
- **Tree of YOU** — **SUPERSEDED (Sep 28)**: roots are now Pillars,
  branches are Values. See "Values System → Tree of YOU v2" below.
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


---

## Values System + Questionnaires (Sep 28) — approved direction

Replaces the fixed 12-value library. Access to values is **never
paywalled**; only AI depth that costs money is premium.

### Locked decisions
- **Slots:** start with **5** active values, gently encouraging (never
  requiring) one from each Element. **+1 slot the first time each value
  crosses into a new tier** (Practising, Embodying, Mastering). Prestige
  cycles deepen fruit, not slots, so slot growth can't loop.
  Open: maximum slot cap (suggest 9).
- **Pillars v2 (adopted Sep 28): 8 roots — 4 inner, 4 outer.** See
  "Pillars v2" section below.
- **Sub-values:** branch out from a parent value when it reaches
  **Practising**.
- **Rested values keep their XP and tier.** Rotation is free, unlimited.
- **Free tier:** 3 AI-personal challenges per custom value.
- **Reflections:** new `reflections` table, surfaced in the Journal tab.
- **v1 library:** 40 main values (parent values), each with sub-values
  that unfold as the parent deepens. v2 expands toward ~150 / 250+.
- **Language:** nothing is "locked". Values *unfold*, *branch*, *ripen*.
  All 40 main values are always choosable; slots are capacity for focus,
  not permission.
- **Suggestions, not favouritism:** after a tier crossing, offer 2–3
  kin values (balancing / nourishing) drawn from the Seeker's own
  answers and the Codex kinship web. Never ranked by popularity;
  library browsed by Element or A–Z.
- **Value card order:** Seeker writes their own definition **first**;
  YOU's perspective is revealed after (avoids anchoring).
- **Tier-crossing moment:** one brief, personal, kind line. No confetti.
- **Premium (v2):** `tailor-value-questions`, AI-personal challenges
  beyond the free 3, YOUnderstanding definition-evolution reflections.

### Current XP gates (found Sep 28, `app.const.js` + `js/config.js`)
- Value rating 0–99: Awakening 0–25 · Practising 26–50 ·
  Embodying 51–75 · Mastering 76–99.
- Challenges award 2–8 pts. web-next already has prestige cycles
  (`prestigeRequirement`, `getPrestigeStage`): tier is read from progress
  through the current cycle.
- Seed Being levels (total XP): Seedling 0 · Ember 100 · Wanderer 250 ·
  Seeker 500 · Alchemist 900 · Sage 1500 · Oracle 2500 · Elder 4000.
- [ ] Store `highest_tier_reached` per user value, so slot unlocks and
      sub-value unfolding trigger once, independent of prestige resets.

### Pillars v2 — adopted Sep 28
Replaces the 7 Pillars (and the short-lived Recreation addition).

| | Pillar | Holds | Absorbs |
|---|---|---|---|
| Inner | **Body** | Health, movement, rest, sensation | Body |
| Inner | **Heart** | Emotions, feeling, healing, emotional literacy | new |
| Inner | **Mind** | Thought, learning, curiosity, perspective | Mind |
| Inner | **Spirit** | Meaning, practice, connection to the greater | Spirit |
| Outer | **Connection** | Love, family, friendship, community | Relationships |
| Outer | **Purpose** | Work, vocation, contribution | Work |
| Outer | **Play** | Adventure, recreation, creativity, joy | Adventure + Creative |
| Outer | **Home & Earth** | Place, nature, security, resources | new |

Rule: every habit/goal/dream has one obvious Pillar, optional second.
On the Tree: inner roots grow deep, outer roots spread wide.

- [ ] `app.const.js`: replace `PILLARS` list, `PILLAR_COLORS`, pillar
      icons (`PillarsPanel`), Pursue category picker.
- [ ] Migration: `items.cat` and `memory.cat` — Relationships →
      Connection, Work → Purpose, Adventure → Play, Creative → Play.
- [ ] Remap `VALUE_PILLAR` / `VALUE_PILLAR2` (and the Codex `pillars`
      field) to the new 8. Rest → Body or Play; Vulnerability → Heart.
- [ ] Freeing the Dream banks: write Heart, Play, Home & Earth; merge
      old Adventure/Creative/Recreation questions into Play.
- [ ] Pillar XP: recompute from `memory` after migration (derived, so
      no stored totals to fix).
- [ ] Legacy vanilla build: leave on old 7 unless still in active use.

### The Values Codex (content — source of truth)
Working name: **The ValYOU's Codex**. One entry per value; feeds seed
data, AI prompts, challenges, and questionnaire tailoring.
Lives in the repo (versioned with git), compiled to seed SQL/JSON:

```
content/valyous-codex/
  _TEMPLATE.md
  water/
    compassion/
      compassion.md        ← main value
      kindness.md          ← sub-value (parent: compassion)
      self-compassion.md
  fire/ …
```
Folder per Element → folder per main value → sub-value files inside.
~400 files, but never more than ~10 in any one folder.
- [ ] Entry template: name, essence line, Light, Shadow (excess),
      Void (deficiency), balancing kin, nourishing kin, Pillars (1–2),
      Element, synonyms, sub-values.
- [ ] Write 40 main values (drafted with Claude, edited in YOU's voice).
- [ ] Curated challenges for most-chosen ~20: 4 per tier
      (2 Light : 1 Shadow : 1 Integration).
- [ ] Voice rule: YOU never claims to heal or fix. It holds space for
      light and dark as the full human experience.

### Questionnaires
- [ ] **Freeing the Dream** (per Pillar): Longing → Vision → Weight →
      Seed; close with plant into Pursue / hold as seed / release.
- [ ] **Light & Shadow of a Value**: Light / Shadow / Void / Integration;
      one question per screen; save and return. Also used at onboarding
      to help choose the first 3 values.
- [ ] Revisited at each tier crossing; stored in `definition_history`.

### Data layer
- [ ] Tables: `values_library`, `user_values` (extend), `value_challenges`,
      `reflections`, `custom_value_signals`.
- [ ] `ai_usage` table + token logging in every Edge Function
      (suggest-value-challenges, suggest-chapters,
      reflect-on-journal-entry, weekly-reflection,
      transcribe-journal-photo). RLS on all
      user-owned rows; library + shared challenges read-only public.
- [ ] Migrate existing 12 values into library; map existing user rows.
- [ ] Move `VALUE_PILLAR` / `VALUE_PILLAR2` into DB; update `pillars.js`.
- [ ] Slot count derived from tiers, not stored.
- [ ] `entitlements.is_premium` stub (false).

### Edge Functions
- [ ] `classify-value` (new): library match, Pillar/Element suggestion,
      harm flag.
- [ ] `suggest-value-challenges` (update): personal definition as input,
      lens balance, shared cache for library values.
- [ ] `tailor-value-questions` (v2, premium).
- [ ] Log token usage per call to `ai_usage`; per-user daily rate limit.

### Frontend (mock data, `DEV_MODE: "bypass"`)
- [ ] Values discovery: search + name your own, browse by Element.
- [ ] Active values (3 + earned slots) + Library shelf (rested).
- [ ] Value card (own definition first, then YOU's perspective).
- [ ] Both questionnaires.
- [ ] Tier-crossing acknowledgement line.
- [ ] Tree of YOU v2 (below) — refactor existing
      `components/journey/tree-stars/TreeOfStars.jsx` to the new mapping.

### Tree of YOU v2 — cosmic tree
- **Roots = 8 Pillars v2**, anchored in soil — inner roots (Body, Heart,
  Mind, Spirit) grow deep, outer roots (Connection, Purpose, Play,
  Home & Earth) spread wide; depth and spread grow with
  Pillar XP. Underground = the unseen: shadow as nourishment, not threat.
- **Trunk = the Seeker** (Seed Being as companion at its base).
- **Branches = active Values**; thickness follows tier.
- **Extending branches = sub-values** as they unfold.
- **Fruit = lived depth** (completed challenges + reflections).
- **Rested values = dormant branches** — bare, never cut.
- **Canopy reaches into the cosmos**; Constellations (memories) are the
  stars above it — one continuous Tree & Stars view.
- **Interaction:** tap a branch → the roots (Pillars) it draws from glow;
  tap a root → the branches it feeds glow.
- **Seasons** tint foliage (from Living Biography Seasons).
- Growth animates only on user action or a tier moment — no autoplay.

### Safety & privacy (required before live)
- [ ] Explicit, revocable consent before any reflection text reaches
      the Claude API.
- [ ] Reflections excluded from analytics.
- [ ] Quiet support-resources link on Shadow/Void screens.
- [ ] Moderation on AI output, not on Seeker input.
- [ ] Exit on every screen.
