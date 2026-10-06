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
  *(One agreed exception, Oct 1: a night sky may twinkle if it looks real.
  That means irregular, brightness-scaled scintillation, never a uniform
  blink or pulse, and it's still under prefers-reduced-motion.)*
- **Icons always paired with text labels** — never icon-only for anything
  actionable.
- **Generous, consistent spacing** — if in doubt, remove content rather than
  shrink it to fit.
- **Escape hatches** — anything expandable should be just as easy to
  collapse. Nothing should feel like a one-way commitment.

---

## Fix first (small, high-value)

- [x] Hamburger menu overlay — hero text bleeds through behind the scrim
      when the menu is open (see screenshots, Jul 15). Scrim needs full
      opacity or the hero needs to properly recede/blur behind it.
- [x] Hero pill currently reads "Current Chapter — Seedling" — this is
      actually the **Seed Being level**, not a Life Chapter. These are two
      separate systems (see `03-YOU-LIVING-BIOGRAPHY-pivot-brief.md`).
      Relabel to "Level — Seedling" now. Reserve "Current Chapter" for when
      real Chapters data exists, so the two concepts don't blur together
      from day one. *(Done: pill no longer exists — Home redesign
      replaced it with the real current Chapter from `pickCurrentChapter`.)*

## Build: the Add action-sheet gap

> **Built Sep 28:** top level is Pursuit · Today · Journal. Pursuit →
> Habit / Goal / Dream (opens `AddItemModal`). Journal → Entry / Idea /
> Experience (auto-tagged) plus "Add a memory with a photo instead".
> Today's list shows on Home as a "Today" card.
> `todos` migration run Sep 28.

Claude Code flagged (Jul 15) that `nav-bars-mockup.html` specifies a 3-choice
sheet on tapping **+**, but the app currently jumps straight to the full
`AddItemModal`. This needs actually building, not just a rename:

- [x] **Today's list** — quick one-off task, today only. **Open decision:**
      does this reuse the `items` table with a new `type: "todo"`, or does
      it need its own shape? Decide before building — this is a real
      schema decision, not just UI. *(Decided: own `todos` table — no
      Pillar, XP or streaks; only today's show, unfinished ones fall away.)*
- [x] **Habit, goal, or dream** — routes to the existing `AddItemModal`,
      unchanged.
- [x] **Journal entry** — quick reflection entry, feeds the Reflections
      screen (currently placeholder — check whether Reflections needs real
      wiring now or can stay a placeholder that this feeds later).

## Other loose ends to confirm, not just build

- [x] Has the Phase 1 `/styleguide` component library actually been built
      yet? If Phase 2 screens are being styled before it exists, components
      (cards, buttons, inputs) are being designed twice. Check before
      continuing Phase 2. *(Yes — `/styleguide` + `components/ui/`.)*
- [x] Home's "Living Atlas" explore card — confirm whether the "one
      contextual card" logic is actually dynamic (e.g. picks Healing Journey
      vs Atlas based on recent activity) or currently hardcoded. Hardcoded
      is fine for now — just don't want it mistaken for finished logic.
      *(Moot: the Home redesign removed the explore card.)*

---

## Phase 2 — screen-by-screen order

- [x] **Home** — built, minor fixes above aside
- [~] **YOU tab** (formerly Profile) — Pillars + Values attribute bars, Seed
      Being, level/stats, Legacy card *(built: Seed Being + level, Pillars,
      Values, The Mirror and Legacy links; avatar upgrade station still a
      placeholder)*
- [x] **Journey** — segmented control (Chapters / Tree & Stars /
      YOUnderstanding), Life Chapters cards, Season indicator *(plus an Identity
      tab. Seasons are real now: read from Harvests, see "Seasons, The
      Mirror and Legacy")*
- [x] **Pursue** (full list — reached from Journey → Chapters or Home
      "View all") — most function-heavy screen, go carefully *(built: filters, Pillar
      groups, nested sub-categories, milestones, prestige)*
- [ ] **Everything else** (lower priority, still placeholder): CommYOUnity,
      Atlas, Tree & Stars detail, Healing Journey, Therapists, Empatherapy,
      Events/Calendar, Shop, Challenges, Saved, Review *(Legacy is built
      now, with My Story)*

---

## YOUniversity · Arcana (Oct 5)

Add-ons ("Arcana": Latin for secrets; to the alchemists, the hidden essence
that heals or transforms) found in Explore and kept in the Library. Each
opens in its own format and plugs into other parts of YOU. Content lives in
`constants/arcana.js`; the database knows which exist, which are free, and
who holds what (`20261005100000_arcana.sql`, applied Oct 5).

- [x] YOUniversity in the side menu: **Library** and **Explore** tabs.
- [x] First Arcana, both free: Light & Shadow, Freeing the Dream. Starting
      either from a value/Pillar also adds it to the Library.
- [x] Arcanum page: about, inside, where it lives in YOU, Begin a sitting,
      past sittings (continue / let go), remove from Library (free only).
- [x] Own tools: tools picked up along the way (name, where from, what it
      helps with, how), "I used this today", a four-week use strip.
- [x] Only free Arcana can be added from the app; paid ones only by the
      service role (future payment webhook).
- [x] **The Sovereign Empath** (first paid Arcanum, "Coming soon"; Cassidy
      holds it as a gift to test). `constants/arcana/sovereignEmpath.js`,
      DRAFT wording for Cassidy to reshape. Opening check-in → 7 stages
      (lesson · practice · challenge) → closing check-in and "What changed".
      `20261005120000_arcanum_courses.sql` (applied Oct 5): `arcanum_progress`,
      `tool_uses`, writable only for an Arcanum the Seeker holds.
- [x] **Reusable course layout** (`components/course/`): the path, a
      full-screen step player (read · reflect · choose · scenario · scale ·
      breathe · list · value · challenge), drafts kept on the device, rest
      days on the local date (a dev-only "Skip the rest" for testing), the
      moment after each part, tools kept in the Library with every use.
- [x] Challenges ask which value they honoured; living it grows that value.
- [x] **Rest is suggested, not enforced** (Oct 5): "Feel ready? Continue
      now" opens a prompt explaining why rest helps (longer after deeper
      parts), then "Rest until…" or "Continue now". Saved as
      `arcanum_progress.rest_skipped_at` (`20261005140000_arcanum_rest_skipped.sql`,
      applied), so it holds on every device. Replaces the dev-only skip.
- [x] **More engaging course page** (from Cassidy's CENTRE mockup): arched
      hero, stats, Today card (with minutes), a stage map of seven doors,
      "What you've gained" (tools, locked ones show their stage), values
      honoured, the Sovereignty Code in gold lines.
- [x] Tested Oct 5 end to end (check-in, Stage I, the close); test data
      removed after.
- [ ] Value growth from a challenge: not yet tried on a real value.
- [ ] Paid content currently ships in the app bundle (lazy-loaded). Before
      selling, serve it only to holders (e.g. from Storage behind RLS).
- [ ] Show the Sovereignty Code on My YOU (optional, private).
- [x] **Gift codes** for paid Arcana (`20261006100000_arcanum_gift_codes.sql`,
      applied Oct 6): `arcanum_codes` (uses, end date; unreadable from the
      app), `redeem_arcanum_code()` grants `user_arcana` as a gift, once
      per person. "Have a gift code?" on the course page and in Explore.
      First code: `EMPATH-F25F6F`, The Sovereign Empath, 3 uses, until
      31 Dec 2026, for beta testers. New codes: insert a row in
      `arcanum_codes` (ask Claude).
- [ ] Payments (Stripe) for paid Arcana, granting `user_arcana` server-side.
- [ ] More formats: course, tool. More ways to plug in: challenges, values,
      progress over time.
- [ ] Support line in questionnaires: when the Empatherapy directory exists,
      offer both "Talk to someone now" (findahelpline) and "Find a
      practitioner" (Empatherapy), not one instead of the other.

## Yin & Yang design (Oct 5–6)

Drawn from the "O" in the YOU logo: a yin-yang of ocean and cosmos held
in a gold ring. Built on `design/yin-yang`, merged into `mvp` Oct 6. The
previous forest-green design is tagged **`forest-design`** (the `main`
commit live before this), to compare or restore.

- **Light mode is the Ocean side:** sea foam `--bg #F6FAF9`, sea glass
  surfaces, deep-ocean teal `--forest-accent #176A76` for buttons and
  selected things, gold `#B88F3E`, ink `#122E37`. Light from above, the
  sea below (`--sky`).
- **Dark mode is the Cosmos side:** midnight `--bg #0B0B1F`, night-sky
  surfaces, nebula violet `--sage #6C68B6`, starlight gold `#E0B865`, a
  faint starfield and nebula glow (`--sky`).
- **Each carries a seed of the other** (`--seed`): cosmos indigo
  `#3D3B7A` in the Ocean, sea teal `#4FB3B5` in the Cosmos. Buttons in the
  Cosmos glow sea-teal; teal text brightens to the seed.
- Token names (forest, sage…) were kept so every screen follows; all
  colours live in `src/styles/tokens.css`. Text on accents uses
  `--on-accent`.
- Home's hero: `public/images/ocean-light.svg` (dawn over waves, a small
  moon) and `cosmos-dark.svg` (nebula, golden sun-star, crescent). Top and
  bottom bars are glass over the sky.
- Night scenes (Focus, Tree of Stars, Constellations, Crossroads, maps)
  and the AI premium ink moved from forest night to cosmos night; plants
  and soil stay green.
- The chosen mode is remembered per device (`localStorage you.mode`,
  applied in `index.html` before first paint). Menu: "Switch to Cosmos
  (dark)" / "Switch to Ocean (light)".
- **The five Elements as section accents** (`lib/elements.js`,
  `--el-*` in tokens.css, deeper on the Ocean, softer in the Cosmos):
  Water → Reflections · Fire → Pursue, Focus · Earth → Threshold, Sow,
  Harvest, Wanderings · Air → YOUniversity and courses · Ether → YOUrney,
  Mirror, Legacy, My Story · Home and the YOU tab keep the gold ring.
  Shown only in section labels, the bottom-nav marker, a thin line on
  cards (`shadow-card`) and a mark under the chosen tab. Buttons never
  change. Value cards wear their own Element.
- [ ] Other screens with their own photos or art (season images, the
      Styleguide) may still carry the forest feel; not yet reviewed.
- [ ] Home & Earth, Pillar colours and VALUE_COLORS elsewhere (Tree of
      Stars) are unchanged; decide whether they follow the Elements too.

## The course in your day (Oct 5, later)

- [x] Home's Today card and the Threshold show each course in progress:
      a part ready, the challenge being carried, or a rest (Home only).
- [x] Bring Me Back to Myself: "Tools to steady you" first, hard-moment
      tools (`quick: true`) leading, then your own tools.
- [x] Listen: read aloud in the course player (device voice, en-AU first).
- [x] Welcome back: after 7+ days away, a recap on the course page (last
      part, stages walked, tools kept, a line you wrote, what's next), and a
      "Welcome back" on Home.
- [x] Walk a course again, as often as you like (`arcanum_walks`,
      `arcanum_progress.walk` + `summary`; `20261005180000_arcanum_walks.sql`,
      applied). "Your words" per stage for any walk, "Read again"
      (read-only replay), "Your walks" date log, "Walk it again".
- [x] Course answers in AI reviews only with a separate yes
      (`ai_consent.include_courses`): asked once on the course page when AI
      reflections are on; changeable in Settings. `weekly-reflection`
      deployed (v8) to include that week's course answers.
- [x] Light text on green everywhere (`text-onAccent`, 28 spots in 21
      files), so selected chips, ticks and the Add button read in dark mode.
- [x] **AI is YOU Premium** (future subscription). One gate in the app
      (`lib/premium.js`, `invokeAi`) and one on the server (the shared
      guard in `_shared/limit.ts`, all 6 AI functions redeployed Oct 5).
      Open to everyone in the beta. To make it subscription-only: set
      `PREMIUM_OPEN_IN_BETA = false` and the secret `AI_REQUIRE_PREMIUM=true`;
      `entitlements.is_premium` then decides (service role only).
- [ ] Payments for YOU Premium (Stripe webhook writing `entitlements`).

## Values in your own words + the Codex at 100 (Oct 5)

- [x] Course values question: choose several; "Choose from all values"
      glossary (search incl. sub-values and synonyms, closest suggestions,
      keep your own word). Growth is shared between the values chosen.
- [x] Name your own value in the YOU tab (Codex home offered first);
      own values get a gold card with definition, Light & Shadow, AI
      challenges and rest.
- [x] Codex requests for Cassidy (`20261005160000_value_words.sql`,
      applied): `value_words`, `admins`, counts-only admin RPCs; gold dot on
      the menu + "Codex requests" page (New / Planned / Added / Not for the
      Codex). Never shows who.
- [x] **Codex: 40 → 100 values** (`content/valyous-codex/_PROPOSED-60.md`).
      Each new value: essence, light, shadow, void, whole, kin, synonyms,
      sub-values, 2 questions, 7 starter challenges, an icon. Promoted
      Kindness, Generosity, Security (old parents got consoling, savouring,
      safekeeping). All `status: draft` for Cassidy's pass.
- [x] Each value's own questions now appear in Light & Shadow ("Go deeper").
- [ ] Sync `supabase/codex/values_library.sql` (now 100 values) to the
      database. Nothing reads the table yet, so it can wait.
- [ ] Email / push notice for new Codex requests (needs an email service).

## Journal highlights, premium AI look and fixes (Oct 4)

- [x] **Saving an entry closes it**, with a short "Saved" note. Photos and
      a reflection are added by tapping the saved entry.
- [x] **"Scan a page" spacing**: the Reflections title and its buttons sit on
      one line, with room before "Your journal — just for you."
- [x] **Journal highlights** (`journal_highlights`,
      `20261004120000_journal_highlights.sql`, applied Oct 4):
      - Select any words in an entry → "Keep as a highlight": trim them,
        tag them, link them to a dream (or any pursuit), and choose whether
        they may come back as a memento. Works on new entries too (kept once
        the entry saves).
      - The journal reflection now also suggests up to 3 **moments worth
        keeping**: the Seeker's exact words, checked server-side to really
        be in the entry (`reflect-on-journal-entry`, deployed Oct 4).
      - **Highlights tab** in Reflections: gathered under the dream each
        feeds (dream ideas in one place), then the rest; filter by tag;
        change the dream, toggle memento, remove. Highlights outlive a
        deleted entry.
      - **Personal mementos**: every third focus hour, a highlight kept as a
        memento comes back instead of a library line, credited "From your
        journal" with its date.
- [x] **Premium AI look** (`components/ui/Premium.jsx`, `.ai-*` in
      tokens.css): black-and-gold for every AI feature (journal and weekly
      reflections, Season, chapter suggestions, value challenges, Harvest's
      reflection, Scan a page, the AI settings card). Gold hairline border,
      gold lettering and a soft sheen; the same in light and dark mode. Use
      it for future premium features too.
- [ ] Show a dream's highlights on the dream itself (Pursue card).
- [ ] Highlights tab: more than tags and dreams? (search, by date)

## Sow · Tend · Harvest + the Threshold (Oct 1) — approved direction

**The problem it answers:** "Why should I use this app, and how will it
help me?" Writing a habit down isn't motivating on its own. This loop links
today's small action to who the Seeker is becoming, and lets the Tree grow
from real effort. It borrows Forest's *visible growth from effort*, but
**not** its loss aversion: nothing dies, wilts or resets.

### The Threshold: the app's first layer
- [x] On opening the app (once per session), the Seeker lands on the
      **Threshold**: a calm full-screen layer, like a screensaver for the
      app. Greeting, date, today's sown intentions, the quick list, and one
      **portal** that leads deeper into the app (Home).
- [x] **Two questions, in order:** "What do you want to plant today?"
      (today's sown pursuits with their next step, then the quick list and
      its add field), then "What do you want to plant this week?" (an
      invitation to Sow, what's already growing, or "you chose to rest").
      Today comes first because it's always answerable. Sow's heading uses
      "plant" too.
- [x] Layers within the app: Threshold (today) → Home (your life now) →
      Journey, YOU and the rest (the whole story).
- [x] No autoplay motion (standing rule). The portal moves only when
      tapped.
- [x] Escape hatch: "Open on the Threshold" switch in My YOU (default on).
      Stored per device in localStorage for now.
- [x] Threshold is reachable any time from the Today card on Home.
- [x] **Quick list with inline add** on both the Threshold and Home's
      Today card ("Add something for today"). These are plain `todos`: no
      Pillar, no XP, no streak, gone at day's end. The Threshold has no +
      button, so without this a to-do couldn't be added from the first layer.

### Sow (weekly, about 5 minutes)
- [x] "What do you want to grow this week?" Pick **up to 3** of the
      Seeker's existing, unfinished habits, goals and dreams. No new setup.
- [x] Each pick shows its type, Pillar and a **Value**. It defaults only to
      an active value that really draws from that Pillar, otherwise "no
      value yet" (never an unrelated guess). Tap to cycle through all values.
- [x] Loose day chips: Mon–Sun, or none = "sometime this week". No time
      slots.
- [x] "Resting is allowed too": sowing fewer than 3, or nothing, is valid.
- [x] On Sundays, Sow plans the week starting tomorrow; any other day it
      plans the current week (weeks run Monday to Sunday).
- [x] Re-opening Sow edits that week's sowing rather than duplicating it.
- [x] Prompted from the Threshold and Home when the week isn't sown yet (and
      every Sunday for the next week). Never a red badge, never a nag.

### Tend (daily)
- [x] Today shows intentions sown for today's weekday, plus "sometime this
      week" ones until they've been tended once that week.
- [x] Each shows its **thread**: the item's own *intention* text (the "why"
      the Seeker wrote in AddItemModal) or its type, then Value, then Pillar.
- [x] Ticking one = **tended**: logs a small `memory` entry (3 XP, same as a
      habit check-in) to the item's Pillar, so the **Tree's roots grow**.
      Shows "Your <Pillar> roots grew". Unticking removes it again (net XP
      stays honest, no exploit).
- [x] "Rest today": hides it for today, no lost progress. A "sometime this
      week" one comes back tomorrow.
- [x] **Rhythm, not streaks:** "Tended on N days this week". Counts what was
      done, never resets to zero, never shows what was missed.
- [x] **Focus session** ("Tend" timer, the gentle Forest part), Oct 4.
      Mockup: claude.ai/artifact/VqGYV3BzLTrcpZjyaKHJFs. `/focus`
      (`components/focus/`, logic in `lib/focus.js`, table `focus_sessions`
      from `20261004100000_focus_sessions.sql`, applied Oct 4).
      - Entry: a timer button on each of Today's intentions, and "A focus
        session for something else" on Home's Today card (any pursuit, or
        name it and optionally pick a Pillar).
      - 15 / 30 / 45 / 60 min or Open; "Hide the clock, just let it grow".
      - A flower grows continuously and sways (motion is right here, by
        Cassidy's call); stages seed → sprout → bud → bloom. Time is read
        from the start, so leaving the app never hurts it. A pill shows the
        session anywhere else in the app.
      - **XP (Cassidy's scheme):** +1 per 10 minutes, plus +2 for 30 minutes
        straight and +3 for an hour straight, in one session (an hour = 11).
        Everything reached stays yours if you rest early. Focus XP capped at
        20 a day. A session on a sown intention also counts as tending it
        (3 XP, once).
      - **Mementos:** every completed hour of focus (counted across all
        sessions) grows a memento on the flower that crossed it: a short
        line from the greats (`constants/mementos.js`: 100 from the greats,
        including music, art and the mind, 50 messages from YOU, and 15 from
        Cassidy Dugan's own songs, poems, spoken word and words, as of Oct 4:
        165 hours before any repeat). Public
        domain only, always credited with author and work, no modern
        translations and no famous misattributions. Sealed until opened, on
        the end screen and from the flower in the garden; memento flowers
        carry a gold spark on the Tree. Each Seeker gets their own shuffled
        order, no repeats until all are used. Original lines are credited
        "A message directly from YOU", and there's a section for
        **Cassidy Dugan's own works**, added as they're written.
        Anything we write ourselves, inspired by anyone or not, is ours and
        credited "A message directly from YOU" (our own wording, never a
        close rewrite of someone's line).
        `mementos` column from
        `20261004110000_focus_mementos.sql` (applied Oct 4).
      - Rest early = a resting seed in the garden; the end screen keeps the
        plant at the size it reached ("Resting as a bud"). Optional "What
        grew?" note.
      - **"It bloomed" notification** (local, from the device) when a timed
        session finishes while the app isn't in view. Taps open `/focus`.
      - **The garden**: blooms (Pillar-coloured centres) and resting seeds
        grow around the Tree of YOU, oldest by the trunk, spreading outward.
        Tap it: the view zooms into the soil and opens the garden up close,
        month by month; tap a flower for its day, time and note. The week's
        garden also shows in Harvest (even in a week with nothing sown).
- [ ] Focus notifications when the phone has fully suspended the browser
      need Web Push (a service-worker push subscription and a scheduled
      sender). Today it notifies while the browser is running, and greets
      the Seeker with the bloom when they return.
- [ ] Threshold: offer a focus session there too (only Today's intentions
      have the timer button today).
- [ ] Decide: should tending also feed **Value** growth (branch thickness /
      tier)? Not done yet on purpose, because it would move tier gates.
      Today, tending feeds Pillar roots only.
- [ ] A sown habit tended on Today and also checked in on Pursue earns both
      (3 + 3 XP). Decide whether tending a habit should *be* its check-in.

### Steps: break anything down (Oct 1)
- [x] Every pursuit (habit, goal and dream; habits were excluded before)
      can be broken into smaller **steps**. Same data as before
      (`items.milestones`), but the UI now says "steps" everywhere.
- [x] Steps can be added, ticked and removed **right on the Pursue card**
      ("Break it into steps"), not only in the edit form.
- [x] Quick-list to-dos get steps too ("Steps" on each to-do), stored in
      `todos.steps` (`20261001130000_todo_steps.sql`). Still no Pillar, no XP.
- [x] On Today and the Threshold, a sown pursuit shows its **next step**
      with its own tick, so the breakdown is visible where you act.
- [ ] Decide: should finishing a step give a little XP or growth? It
      doesn't for now. A step is a way in, not a score.

### Found while testing with real data (Oct 1)
- [x] Sow listed every unfinished pursuit in one long list. **Now grouped
      by Pillar** (in Pillar order, empty Pillars hidden, no-Pillar items
      under "Other"). Groups start collapsed, except ones already holding
      this week's picks. Each header shows its count and "N sown". Within a
      group: habits, then goals, then dreams (most week-sized first).
- [x] "Rest this week" is a quiet secondary button until something is
      picked, so it can't be the loudest thing on arrival.

### Harvest (end of week) — built Oct 1
- [x] **When:** on Sunday it looks back on the week now ending; Monday to
      Saturday, on last week (a missed Sunday isn't a missed harvest). It's
      offered only if that week had something sown and isn't harvested yet,
      as a quiet card above "What do you want to plant this week?" on the
      Threshold and a line on Home's Today card. Once its week has passed,
      it stops asking.
- [x] **Your roots:** XP logged that week, by Pillar ("Play grew +6"), with
      a link to the Tree. A quiet week says roots grow in the dark too.
- [x] **Noticed:** one line from the existing weekly reflection (patterns,
      else "your week"). If there's none but there are journal entries,
      "Reflect on last week" generates it, behind AI consent. Hidden when
      there's no journal that week. No new Edge Function.
- [x] **What you sowed:** each intention with "Tended on Mon and Wed" (never
      a list of what was missed), its steps and value, then **Carry forward
      / Let it rest / Release**. Anything unchosen rests. Carrying sows it
      into next week with the same days and value, never past 3.
- [x] **Release = archive** (Cassidy's call). `items.released_at` takes it
      out of Pursue, Sow, Home and Today, keeping history, steps and XP.
      Pursue → **Released** lists them, with "Bring back".
- [x] **Something to remember:** optional note, kept in `week_harvests`.
- [x] Re-opening a harvested week shows what was chosen, and it can be
      updated.
- [x] Harvests feed **Chapters**, **Seasons** and **The Mirror** (Oct 2). See
      "Seasons, The Mirror and Legacy" below.
- [x] Data: `20261001140000_harvest.sql`, which adds `items.released_at`,
      `week_intentions.outcome` and the `week_harvests` table. *(Applied
      Oct 1. Tested end to end: harvest, carry forward, release, bring back.)*

### Data
- [x] `week_intentions` table (`20261001120000_week_intentions.sql`): one
      row per sown item per week. `item_id` → `items` (cascade), `week_start`
      (Monday), `days smallint[]` (0 = Mon … 6 = Sun, empty = any day),
      `value_name`, `tended_dates date[]`, `rested_dates date[]`. Unique per
      (user, week, item). RLS own-rows only.
- [x] Loaded outside the main batch (like `todos`), so a missing table
      can't block the app.
- [x] Dates are the Seeker's **local** date, not UTC. *(Oct 1: fixed
      app-wide. Every `todayKey()` (todos, check-ins, completions, journal,
      moments, visions, chapters, Home's mood) now uses `localDateKey()`
      from `lib/week.js`, and the weekly reflection's "this week" uses the
      local Monday. The old UTC keys read as yesterday early in the
      morning: until 10–11am in Australia, or until 1am in the UK during
      BST. Existing rows keep the dates they were saved with.)*

## Wanderings: travel plans inside Dreams (Oct 1)

**Naming:** the Journey tab is now shown as **YOUrney**. The whole life
story is the YOUrney, and it fits CommYOUnity and YOUnderstanding. The route
and code keep `journey` so old links still work. Travel plans are
**Wanderings** (echoing the Wanderer level), and they live inside Dreams.

### v1 (built)
- [x] Any Dream can "Plan a wandering" (in its expanded card). Dreams that
      have one show "Wandering · N stops" on the card. One per dream.
- [x] **Wandering screen** (`/wandering/:id`): status is derived, never
      stored (Dreaming → Planned → Travelling → Travelled). Shows the date
      range and nights, "from your dream …", and an editable title.
- [x] **Map:** MapLibre + OpenFreeMap (OpenStreetMap vector tiles, free, no
      key), recoloured into YOU's palette for light and dark. Numbered pins,
      a dashed gold route, fits all stops on arrival **without animating**.
      It moves only when a stop is tapped (and jumps instead under
      reduced motion). Two-finger pan so the page still scrolls on phones.
      Lazy-loaded: the map library loads only when a Wandering is opened.
- [x] **Stops:** type any place, pick from matches (Photon / OpenStreetMap
      place search; only the place name is sent, towns and cities first).
      Each stop has arrive and leave dates, a kind (stay / visit / passing
      through), a note, earlier/later reorder, and remove with a confirm. A
      new stop starts on the day the previous one leaves.
- [x] **Plan the days:** each day at a stop has its own little list (same
      step list as everywhere else).
- [x] **Travelling Threshold:** while a stop's dates include today (local
      device date, so it follows timezones), the Threshold opens with
      "Today in Kyoto · Day 2 of 4 · Japan", that day's plans (add and tick
      right there), and "Next: Osaka on Thu 22 Apr".
- [x] Data: `20261001150000_wanderings.sql`, which adds `wanderings` (one per
      dream) and `wandering_stops` (coordinates, dates, kind, note,
      `day_plans`). RLS: rows may only point at your own dream and your own
      wandering. *(Applied and tested end to end Oct 1.)*
- [x] Place search ranking: keeps Photon's own order (Lisbon, Portugal
      before Lisbon, Iowa), puts places above stations and airports, and
      prefers an exact name ("Kyoto" the city before Kyoto Prefecture or
      Kyoto Station).
- [ ] Leaked-password protection (HaveIBeenPwned) needs Supabase **Pro**.
      The org is on **Free** (confirmed Oct 2), so the advisor warning is
      expected and stays until an upgrade; then it's one switch in Auth →
      Email. Meanwhile the free alternative: minimum password length 12, and
      lowercase, uppercase, digits and symbols required (Cassidy sets this in
      the dashboard).
- [x] `handle_new_user()` locked down (`20261002130000_lock_handle_new_user.sql`):
      EXECUTE revoked from public/anon/authenticated, so it's no longer
      callable through `/rest/v1/rpc`. Verified that a trigger still fires
      for a role that can't call its function directly. Both advisor
      warnings for it are cleared.

### Later
- [x] **Memories pinned to places** (Oct 1). A life moment ("Add a memory",
      with its photo) or a journal entry can be pinned to one stop
      (`stop_id`, `20261001160000_memory_places.sql`; removing a stop only
      unpins, never deletes).
      - Both forms show "Where was this?" **only** when a stop covers that
        date (or it's already pinned). New memories made while travelling
        are pinned to where you are automatically, with one tap to change
        or choose "Not pinned".
      - Each stop has **Memories here**: what's pinned (with photo
        thumbnails, unpin), "From your days here" suggestions (unpinned
        memories dated within the stop, "Pin here"), and "Add a memory
        here".
      - Stop rows show "· N memories". Memory cards in Chapters and journal
        cards in Reflections show a small place tag.
      - The travelling Threshold card has "Capture a memory in <place>".
      - *(Migration applied and tested end to end Oct 1: suggest, pin,
        add here, auto-pin, hidden off-trip, unpin on stop removal.)*
- [x] **Life Constellations** (Oct 1). A second doorway in the Tree &
      Stars sky (top right, beside The Story of You), through the same
      portal. Every Wandering with pinned memories becomes a constellation
      in the **true shape of its route**: stops are projected from their
      coordinates and joined in travel order. A star grows brighter with
      each memory there. Stops with nothing remembered stay faint, holding
      the shape. Tap a star to see that place's memories (photos, journal
      excerpts) and "Open the wandering". A Wandering with memories links
      to it ("See it among your Life Constellations"). The sky twinkles
      realistically, the same as The Story of You (shared
      `tree-stars/twinkle.js`): memory stars glimmer calmly, and it's still
      under reduced motion. No migration needed.

### Found while testing (Oct 1)
- [x] YOUrney's segmented control overflowed at phone width ("Tree & Stars"
      wrapped to three lines, "YOUnderstanding" was clipped). **Fixed in the
      shared `SegmentedControl`**, which also helps Reflections, Saved and
      Challenges: labels never wrap, tabs share the width when they fit,
      and the row scrolls sideways when they don't, with a soft fade on the
      edge that has more. The selected tab always scrolls into view.
- [x] The Story of You's stars blinked on a uniform loop (all fading
      15%→55% on one smooth wave; era stars pulsed like a heartbeat).
      **Cassidy: autoplay is fine here if it looks real.** Now it's
      realistic scintillation: three irregular flicker patterns, each star
      with its own speed and offset, and an amplitude that scales with
      brightness (bright stars shimmer and occasionally catch a warm or
      cool tint; faint ones are nearly still). Era stars get a calm glimmer
      instead of a pulse. It's off under prefers-reduced-motion.
- [x] **"Everywhere you've been"** (Oct 1). A door in The Story of You (and
      "See them on the world map" in Life Constellations) opens a
      full-screen night-coloured world map. It shows every place you've
      actually reached: stops whose arrival date has come, so future plans
      don't count yet. Each Wandering's route is drawn in its own colour, and
      places glow larger with each memory there. The header reads "N places ·
      N countries · N wanderings", with the countries named. Tap a place for
      its trip, month and year, dates, memory count and "Open the
      wandering". A tap on several overlapping places zooms in to separate
      them. Still on arrival (fits without animating). Lazy-loaded; shares
      the map chunk. No migration needed.
      - Shared `wandering/mapStyle.js` now styles every map, adding a
        `night` palette. Ice, ocean labels, label outlines, and all road,
        rail and runway lines are recoloured for every palette (they glared
        white on the darker ones).
      - "Been" also includes every stop of a Dream marked **done**: exact
        dates aren't needed to have been somewhere.
- [x] Country-level stops (a whole country, no place beneath it) open at a
      country-wide zoom. Place details never repeat the name ("Egypt" isn't
      shown under Egypt). A done Dream's Wandering reads **Travelled** even
      without dates.
- [x] Cassidy's data (Oct 1): a Wandering on each travel dream (Egypt,
      Estonia, Finland, Iceland, India, Indonesia, Italy, Japan,
      Philippines, Walk the Road to Santiago at Santiago de Compostela;
      Cambodia and Ko Pha-ngan as travelled). Van life has none (not a
      place). New done dream **Portugal** (Spirit/Travel, +50 XP on 1 Oct
      2026) with a Wandering: Lisbon, Porto, Sintra, Cascais, Terra Sangha
      (not on OpenStreetMap; pinned just south-east of Santo António das
      Areias, Marvão, near the Spanish border, per Cassidy) and Nazaré, July to
      October 2026, undated.
- [x] **Pursuits → Wanderings tab** (Oct 1). Pursue has two tabs, Pursuits
      and Wanderings (deliberately not in the side menu). The Wanderings tab
      shows "Everywhere you've been", "Plan a wandering" (a picker of
      unfinished dreams, travel first), and every trip grouped as
      Travelling now / Planned / Dreaming / Travelled, each with its places,
      when, and memory count. Open it directly with router state
      `{ view: "wanderings" }`.
- [x] **Approximate dates** (`20261001170000_stop_date_precision.sql`):
      `wandering_stops.date_precision` is day / month / year. Remembered
      trips show only what's known ("2019", "November 2023",
      "Jul – Oct 2026"), never invented days. Approximate stops count for the
      world map and Constellations but get no day plans or auto-pinning.
      Picking real Arrive/Leave dates makes a stop exact.
- [x] Cassidy's trips (Oct 1): Cambodia and Ko Pha Ngan in 2019; Portugal
      Jul – Oct 2026; Peru, Ecuador & Bolivia in 2024 and England in early Nov
      2023 (both standalone, no dream, no XP); Northern Rivers (Ocean Shores,
      Byron Bay, Wilsons Creek) in 2023, attached to the done dream "Lived
      in the Northern Rivers (1 year)". **Norway deliberately not added**
      (deported; didn't truly get to go).
- [x] **Travel XP: "score what the trip gave you, not how many countries
      you ticked off"** (Cassidy's choice, Oct 2).
      - Each memory or journal entry pinned to a Wandering's place earns
        `TRAVEL_MEMORY_XP` (10) to the trip's Pillar (Spirit by default),
        logged as "Remembered in <place>" on the memory's own date.
        Unpinning, deleting the memory, or removing its stop takes it
        back. One reconcile in AppDataContext keeps the ledger (memory rows
        tagged `travel:<kind>:<id>`) matched to what's pinned, so there's
        no XP logic scattered through save paths and no farming.
      - Completing the journey keeps the usual dream XP as its base. No
        XP per place or country, deliberately.
      - A standalone journey has **"Make this a dream"**: it creates a done
        Spirit · Travel dream, links the Wandering, and logs the dream XP
        on the journey's first date.
      - Each Wandering shows what it's given you: "N memories · +N XP".
      - *(Tested Oct 2: "Add a memory here" on Lisbon gave +10 XP to Spirit,
        and deleting the memory took it back.)* Fixed while testing: the memory
        and journal forms dropped a chosen place when the stop's dates were
        approximate (no exact date "covers" them), so remembered trips
        couldn't be pinned. A chosen place is now always saved.
      - Cassidy's England and South America journeys made dreams (+50 XP
        each, dated Nov 2023 and 2024). South America reordered and renamed
        **Ecuador, Peru & Bolivia** (Ecuador came first).
- [x] For Legacy and the Mirror: a yearly "places you reached this year"
      (built Oct 2, see below).
- [x] **A finished Wandering offers to mark its Dream lived** (Oct 2).
      Once a Wandering's dates are behind you and its Dream isn't done,
      the Wandering screen asks "You went. Is "<dream>" a dream lived?",
      with an optional "What did it give you?" line (saved to the dream's
      note). "Mark it lived" gives the usual dream XP to the dream's Pillar,
      **dated to when the journey began** (the same year the Mirror and
      Legacy count it in), then shows "A dream lived · +50 XP to Spirit".
      Pursuits → Wanderings shows "Ready to mark this dream lived" on those
      trips. Uses the normal `completeItem`, so un-achieving in Pursue
      takes it back. No migration. *(Tested end to end on a throwaway trip
      to Hobart; test rows removed.)*

### Also fixed alongside
- [x] The service worker cached *every* GET, including Supabase data
      responses (and would have cached unlimited map tiles). It now caches
      only same-origin app files. The cache was bumped to v2 so old copies
      are cleared.

---

## Seasons, The Mirror and Legacy (Oct 2)

- [x] **Seasons, read from Harvests.** New `infer-season` Edge Function
      (Claude Opus 5.5, server-side refusal fallback on, behind AI consent,
      usage logged). It reads the last 10 harvests: the notes, what was
      carried, rested or released, plus that week's reflection. It names
      "Season of …" with a short blurb and 2–4 signals, saved to `seasons`
      (`20261002120000_seasons.sql`); the newest row is current. Read only
      when asked: "Read my season" on YOUrney → Chapters (replacing the old
      hard-coded preview), and "See what season you're in" after a Harvest.
      The card always says what it read from ("Read from 6 harvests · 3 Aug
      – 28 Sep"). *(Oct 2: migration applied, `infer-season` deployed v1 with
      JWT required. Verified: refuses without sign-in (401) and without AI
      consent (403 consent_required), so nothing reaches Claude. The first
      real reading waits for Cassidy's first Harvest and their own consent.)*
- [x] **Chapters + Harvests.** "Suggest chapters" now sends every harvest
      note as context. Chapter names and blurbs can reflect what each era
      held, but only moments are grouped. Each chapter also shows "From
      your harvests": the notes kept within its dates. *(suggest-chapters
      redeployed as v6, Oct 2.)*
- [x] **"Places you reached this year"** (`lib/years.js` +
      `YearInPlaces`): stops that began in a year, exact or approximate,
      grouped by trip, with countries, memory count and "See <year> on the
      world map" (the world map now takes a `year`).
- [x] **The Mirror** (`/mirror`, linked from YOU and Legacy): "<year> so
      far" (places, memories, journal, harvests, dreams lived, current
      season, latest harvest note) and "One year ago" (the same week last
      year: places you were, memories, journal, harvest notes), or an
      honest empty state. Nothing is generated; it's only what was kept.
- [x] **Legacy** is no longer a placeholder: My Story, The Mirror, and
      "Your years", every year with life in it, newest first, each with
      places and what it held.
- [x] **"My Story" memoir** (`/my-story`, from Legacy; Oct 2). Built only from
      what the Seeker kept, in their own words: no AI, and assembled in the
      browser, never uploaded (`lib/myStory.js` is one book model for both
      outputs).
      - Book: cover (name, years) · contents · **the years**, oldest first
        (seasons, where I went with countries and stop notes, dreams lived,
        memories with photos and places, harvest notes, journal) ·
        chapters · **what I'm growing toward** (values in their own
        definitions, identity visions, dreams still ahead).
      - Section switches; **journal entries start off** (most private).
      - **Print or save as PDF** (print styles: only the book, on white, one
        year per page, photos never split) and **Download text** (Markdown,
        `my-story-YYYY-MM-DD.md`).
      - No repetition: single-place trips read "Cambodia", not "Cambodia:
        Cambodia", and travel dreams aren't listed twice in a year.
      - Later: optional AI-written chapter introductions (with consent),
        and a cover photo.
- [x] Dreams count in the year they were **lived**: a dream with a dated
      Wandering belongs to the year the journey began, not the day it was
      ticked off in the app.
- Shared `_shared/anthropic.ts`: optional per-call `model` and `fallbacks`;
  refusal stop reason surfaced as an error; only text blocks are read
  (thinking blocks skipped). Existing functions are unchanged until
  redeployed.

## Beta safety (Oct 2)

Built so Cassidy can share the MVP with friends without paying for
unlimited AI.

- [x] **AI cost guard** (`functions/_shared/limit.ts`), checked before every
      Claude call in all six AI functions and counted from `ai_usage`
      (model + tokens → real cost):
      - whole-app budget **$20 a month**: AI pauses for everyone until the
        1st, and nothing else is affected;
      - **$1 per tester per month** (Cassidy's choice);
      - **30 calls per rolling 24 hours**, a backstop for runaway bugs.

      Change any of them with Supabase secrets (`AI_MONTHLY_BUDGET_USD`,
      `AI_USER_MONTHLY_USD`, `AI_DAILY_LIMIT`). If usage can't be read, calls
      are allowed rather than locking people out. AI is open to everyone
      who signs up.
- [x] Testers see their allowance: Your Own Universe → AI reflections
      shows "$0.32 of $1.00 this month" with a bar (`lib/aiCost.js` mirrors
      the server's prices; the server enforces).
- [x] `ai_usage` writes are service-role only
      (`20261002140000_ai_usage_service_only.sql`). The old self-insert
      policy would have let a forged row pause everyone's AI.
- [x] **Output moderation** (`functions/_shared/moderate.ts`), on every AI
      reply but never on the Seeker's writing (photo transcriptions are
      exempt):
      - sentences claiming to heal, cure or fix, diagnosing the Seeker, or
        giving medication or dose advice are dropped, and the rest shows;
      - self-harm encouragement withholds the whole reply and points
        gently to findahelpline.com.

      Unit-tested: 6 gentle sentences kept, 7 unsafe ones dropped, 2
      blocked. Moderation logs counts only, never content.
- [x] Friendly AI errors: every AI call goes through `invokeAi()`, so limit
      and moderation messages reach the Seeker. The old "check the Edge
      Function is deployed" developer messages are gone from the UI.
- [x] Prompts describe YOU as "a self-love and personal-growth app"
      (Cassidy, Oct 2). The old "self-therapy app" wording broke the voice
      rule.
- [x] **Exit on every screen**: Escape closes the top layer only (modals,
      sheets, menu, skies, world map; `ui/useEscape.js`). Added close
      buttons to the side menu and the + Add sheet, and a label on the
      modal ✕.
- [x] Signed-in only: the cost guard returns 401 to callers with no user
      (just the public anon key), which `suggest-value-challenges` would
      otherwise have let through uncapped. Usage is read in pages of 1000,
      so a busy month can't undercount.
- [x] Live (Oct 2): migration applied and all six AI functions redeployed.
      Verified without any AI call: anon → 401, a forged `ai_usage` insert →
      refused by RLS, $1 used → 429 `monthly_allowance`, $20 total → 429
      `budget_paused`. Settings shows "Used up for this month" past $1.
      Test rows removed.
- [x] Supabase Auth: minimum password length 12 (Cassidy, Oct 2).
- [x] Hard backstop for Cassidy: a monthly spend limit on the Anthropic API
      key (Anthropic Console). *(Set Oct 3.)*
- [ ] `suggest-value-challenges` has no AI-consent check. That's fine, since
      it sends only a value's name, but worth knowing.

## Memory photos: carousel + small storage (Oct 3)

- [x] **Several photos per memory** (up to 10), shown as a swipeable
      carousel (`ui/PhotoCarousel.jsx`: scroll-snap, dots, "2/5", arrows,
      keyboard arrows; never moves on its own). Used in Chapters, The
      Mirror and Life Constellations. Stop rows show the cover with a count;
      My Story prints the cover large and the rest in a small grid.
- [x] The memory form takes several photos at once, shows thumbnails,
      **Cover** on the first (tap the star to make another the cover), and
      ✕ to remove. Editing keeps, reorders or removes existing photos;
      removed files are deleted from storage.
- [x] **Converted on the device before upload** (`lib/imageCompress.js`),
      whatever the source format: long edge at most 1600px, WebP at 0.8
      (JPEG fallback where a browser can't write WebP), EXIF rotation
      applied, metadata and **GPS location stripped**. Tested: a 5.7 MB
      camera-sized JPEG became a 126 KB WebP, and a 3.9 MB PNG became 216 KB.
      HEIC that a browser can't open gets a friendly message. The form shows
      "X instead of Y" so the saving is visible.
- [x] Data: `20261003100000_moment_photo_carousel.sql` adds
      `life_moments.photo_paths` (ordered; `photo_path` stays as the cover
      for single-photo views; existing photos backfilled) and limits the
      `life-moments` bucket to WebP/JPEG at most 5 MB.
- [ ] Existing memory photos stay as uploaded (not re-converted).
- [x] Carousel tested end to end (Oct 3): 3 photos saved as ~33 KB WebP
      each, cover choice kept, arrows and counter, removing a photo deletes
      its file, deleting the memory deletes all its files, and the bucket
      refuses an unconverted PNG. Test data removed.
- [x] Cassidy's three memories from Oct 3 re-converted (Oct 3): 4.6, 3.7 and
      3.8 MB → 377, 314 and 311 KB WebP (1200x1600). The memories use the
      small versions.
- [x] Cassidy deletes the three originals in the Supabase dashboard
      (Storage → life-moments): `1791015149289.jpg`, `1791015736882.jpg`,
      `1791016022929.jpg` in their folder. *(Done Oct 3; checked: none
      left, and every memory's photos are still there.)*

## Scan a journal page (Oct 3)

- [x] Reflections has **Scan a page** beside Write. Pick photos of
      handwritten pages (up to 6, camera or library). AI consent is asked
      first, and "Not now" saves nothing. Then the pages are converted (1568px,
      the size Claude reads at; WebP 0.85), one new entry is made, each page
      is attached and transcribed in order, and the entry opens with the
      text filled in and "It's a first draft: check the words, then save."
      If a page can't be read (allowance, offline), the entry keeps its pages
      to try again. The progress pop-up can be closed; the scan carries on.
- [x] Every journal page photo (also "Add a photo" inside an entry) is
      converted the same way: a 0.9 MB test page was stored as a 128 KB WebP.
- [x] Fixed: deleting a journal entry left its page photos in storage.
      They're removed now (tested; no leftover files in either bucket).
- [ ] The AI read itself is untested: Cassidy hasn't turned on AI
      reflections, and consent is never given on their behalf.

## Side menu (Oct 2)
- [x] Kept clean: Home, YOUrney, Reflections, CommYOUnity, then a
      collapsed **Coming soon · 6** (Therapists, Events / Calendar, Shop,
      Challenges, Saved, Review), then Your Own Universe and the theme
      switch. It opens by itself when you're on one of those pages. Move an
      item up into `SITEMAP` once it's real. Pursuits and Wanderings are
      deliberately not in the menu (reach them from Home → Your pursuits).

## Reminders that keep coming up

- `DEV_MODE` is `"live"` (real sign-in) and must **never ship as
  `"bypass"`**. Flip it only briefly for local UI checks, then flip it back
  before committing.
- Solo build (Sep 28): the data layer is ours now. Change
  `AppDataContext.jsx` / `AuthContext.jsx` deliberately, one migration at
  a time. Migrations live in `supabase/migrations/` and are applied to
  project `yikoymzktspamahrsuje` only after Cassidy's go-ahead.
- Work happens on the `mvp` branch (pushed to GitHub).
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
  Maximum slot cap: **9** (decided Sep 28).
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
- [x] Store `highest_tier_reached` per user value, so slot unlocks and
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

- [x] `app.const.js`: replace `PILLARS` list, `PILLAR_COLORS`, pillar
      icons (`PillarsPanel`), Pursue category picker. *(Icons now shared in
      `constants/pillarIcons.js`; Atlas regions follow Pillars too.)*
- [x] Migration: `items.cat`, `memory.cat` and `identity_visions.category` — Relationships →
      Connection, Work → Purpose, Adventure → Play, Creative → Play.
- [x] Remap `VALUE_PILLAR` / `VALUE_PILLAR2` (and the Codex `pillars`
      field) to the new 8. Rest → Body or Play; Vulnerability → Heart.
      *(Rest → Body; Empathy's second Pillar Spirit → Heart.)*
- [x] Freeing the Dream banks: write Heart, Play, Home & Earth; merge
      old Adventure/Creative/Recreation questions into Play. *(All 8 drafted
      in `src/constants/questionnaires.js` — Cassidy to edit the wording.)*
- [x] Pillar XP: recompute from `memory` after migration (derived, so
      no stored totals to fix). *(App also maps old names on read via
      `normalizePillar`, so XP is correct before the migration runs.)*
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
- [x] Entry template: name, essence line, Light, Shadow (excess),
      Void (deficiency), balancing kin, nourishing kin, Pillars (1–2),
      Element, synonyms, sub-values.
- [~] Write 40 main values (drafted with Claude, edited in YOU's voice).
      *(All 40 drafted Sep 28 — warm, poetic, plain meaning alongside each
      metaphor. `status: draft` until Cassidy's pass. `npm run codex`
      compiles them into the app + `supabase/codex/values_library.sql`.)*
- [ ] Curated challenges for most-chosen ~20: 4 per tier
      (2 Light : 1 Shadow : 1 Integration).
- [~] Voice rule: YOU never claims to heal or fix. It holds space for
      light and dark as the full human experience. *(Enforced on AI output
      since Oct 2, see "Beta safety"; still to be written into the Codex
      text itself.)*

### Questionnaires
- [x] **Freeing the Dream** (per Pillar): Longing → Vision → Weight →
      Seed; close with plant into Pursue / hold as seed / release.
- [x] **Light & Shadow of a Value**: Light / Shadow / Void / Integration;
      one question per screen; save and return. Also used at onboarding
      to help choose the first values. *(Built Sep 28; onboarding use
      not yet wired.)*
- [ ] Revisited at each tier crossing; stored in `definition_history`.

### Data layer
- [~] Tables: `values_library`, `user_values` (extend), `value_challenges`,
      `reflections`, `custom_value_signals`. *(Done in
      `20260928140000_values_system.sql` except `custom_value_signals`,
      which waits for custom values.)*
- [x] `ai_usage` table + token logging in every Edge Function (all six,
      including infer-season). RLS: Seekers read only their own rows;
      writes are service-role only (see "Beta safety").
- [x] Migrate existing 12 values into library; map existing user rows.
      *(13 incl. Family; Elements are a first proposal until the Codex.)*
- [ ] Move `VALUE_PILLAR` / `VALUE_PILLAR2` into DB; update `pillars.js`.
- [x] Slot count derived from tiers, not stored.
- [x] `entitlements.is_premium` stub (false).

### Edge Functions
- [ ] `classify-value` (new): library match, Pillar/Element suggestion,
      harm flag.
- [ ] `suggest-value-challenges` (update): personal definition as input,
      lens balance, shared cache for library values.
- [ ] `tailor-value-questions` (v2, premium).
- [x] Log token usage per call to `ai_usage`; per-user limits. *(Oct 2: see
      "Beta safety" for the daily cap, monthly allowance and budget.)*

### Frontend
- [~] Values discovery: search + name your own, browse by Element.
      *(Browse by Element / A–Z + gentle one-per-Element hint done; search
      and name-your-own wait for the 40-value library + `classify-value`.)*
- [x] Active values (5 + earned slots, cap 9) + Library shelf (rested).
- [x] Value card (own definition first, then YOU's perspective).
      *(Revisits keep the old wording in `definition_history`.)*
- [x] Both questionnaires. *(Entry points: value card → "Explore its
      light & shadow"; Pillar → "Free a dream"; Reflections → Explorations
      to reread, continue or delete.)*
- [x] Tier-crossing acknowledgement line.
- [x] Tree of YOU v2 (below) — refactor existing
      `components/journey/tree-stars/TreeOfStars.jsx` to the new mapping.
      *(Built Sep 28. Memories as Life Constellations came Oct 1–2, as a
      second doorway in the sky. Not yet: Seasons tint the foliage,
      sub-value twigs.)*

### True North: the Crossroads and the compass line (Oct 3)
A list of values isn't a compass yet: it needs an order (values only show
themselves when they pull against each other) and the Seeker's own words.
Mockup: claude.ai/artifact/TUDRHitZaDygmu6422czUj.
- [x] **The Crossroads** (`components/values/Crossroads.jsx`, logic in
      `lib/crossroads.js`): a night-sky ritual opened from the True North
      card at the top of Values. Two active values at a time, each with the
      Seeker's own definition (else the Codex essence), and rotating prompts
      ("If this season only had room for one…"). A binary insertion sort, so
      5 values take about 8 crossings and 9 take about 21. "They feel equal to me"
      is allowed (ties share a rank). Back steps back a crossing.
- [x] **Your compass**: the True North (shared, if tied), the rest in
      order with up/down to adjust, and "the hardest crossing" (the pair
      the Seeker sat with longest, from timing only, no AI).
- [x] **Compass line**: one sentence in their words, with their top three
      definitions shown as material and starters (I want to live… / My life
      is going well when… / At the end, I hope I… / I steer by…). Can be
      written later or rewritten without walking again.
- [x] Shown on Home (top card, links to YOU) and on the True North card,
      which notes when the values in focus have changed since.
- [x] **History kept**: `value_compass`, one row per walk
      (`20261003120000_value_compass.sql`, applied Oct 3). Latest = current.
- [x] **Feeds AI** (`_shared/compass.ts`): journal reflections, weekly
      reflections and Seasons get the compass as context, with a rule to
      notice gently where life meets or drifts from it, never to judge or
      score. Deployed Oct 3.
- [ ] The Mirror: "how your compass has shifted" across walks.
- [ ] Lived vs. held: the order chosen beside where life actually went.
- [ ] Offer a fresh walk when a new Season is read.
- [ ] Bring Me Back To Myself: show the compass line there too.

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
- [x] Explicit, revocable consent before any reflection text reaches
      the Claude API. *(`ai_consent` table; asked on first AI use; switch in
      Your Own Universe; enforced in the 4 Edge Functions via
      `_shared/consent.ts`.)*
- [x] Reflections excluded from analytics. *(No analytics exist yet —
      keep it that way for `reflections` / `journal_entries` when added.)*
- [x] Quiet support-resources link on Shadow/Void screens. *(Also on
      Freeing the Dream → Weight. Links to findahelpline.com.)*
- [x] Moderation on AI output, not on Seeker input. *(Oct 2, see "Beta
      safety".)*
- [x] Exit on every screen. *(Oct 2, see "Beta safety".)*
