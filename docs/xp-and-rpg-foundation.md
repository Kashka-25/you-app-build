# XP and the RPG foundation

How YOU awards XP today, where it is stored, and the rules the YOU Realm
(the RPG, parked until after the beta) must build on. Written for sprint
task B2, 13 Nov 2026.

## One ledger: the `memory` table
Every XP award is **one row in `memory`**: `name`, `type`, `xp`, `cat` (the
Pillar it grows), `date_key` (the day it counts for), `tags`. Nothing else
holds XP:

- A Pillar's XP is the sum of `memory.xp` for that Pillar
  (`AppDataContext`, the `pillars` memo). Total XP and the level
  (Seedling 0, Ember 100, Wanderer 250, Seeker 500, Alchemist 900, Sage 1500,
  Oracle 2500, Elder 4000; `constants/app.const.js`) come from the same sum.
- `user_xp` is a legacy table from the first app. **Nothing writes it any
  more**; it is kept only so exports and old accounts stay complete. Don't
  read it for totals.
- Every `memory` write lives in `lib/AppDataContext.jsx`. No component and
  no Edge Function writes XP (checked 13 Nov; `weekly-reflection` only reads
  `memory`).

## The rules, and where each amount comes from
All amounts live in `lib/xp.js`, `lib/focus.js` or `constants/app.const.js`;
`AppDataContext` only applies them.

| What the Seeker does | XP | Pillar | Source |
|---|---|---|---|
| Check in a habit for the day | 3 (`CHECKIN_XP`) | the habit's | `xp.js` |
| …on the 7th, 14th… day in a row | +5 (`WEEK_BONUS_XP`) | same | `xp.js` `streakBonus` |
| …on the 30th, 60th… day in a row | +10 (`MONTH_BONUS_XP`) | same | `xp.js` `streakBonus` |
| Tick one step of a habit with steps | its share of 3 (`stepShares`) | the habit's | `xp.js` |
| Tend a sown intention on Today | 3 (`TEND_XP`); for a habit it *is* the check-in | the item's | `xp.js` |
| Finish a pursuit | habit 10, goal 25, dream 50, idea 10 (`finishXp`, `XP_VALS`) | the item's | `xp.js`, `app.const.js` |
| A memory or entry pinned to a Wandering's place | 10 (`TRAVEL_MEMORY_XP`) | the trip's | `xp.js` |
| A focus session | 1 per 10 min, +2 at 30 min straight, +3 at 60; at most 20 a day | the session's | `focus.js` |
| Complete a value challenge | its points (Codex challenges fixed; AI ones clamped to the difficulty's range by `suggest-value-challenges`) | the value's first Pillar, and half to its second | `awardValuePillarXP` |
| A YOUniversity course challenge | its points, shared across the values chosen | as a value challenge | `honourValue` |
| Journaling, moods and memories (unless pinned to a Wandering's place) | none: writing is never scored | | |

## Rules that keep it honest
- **Earned once.** A habit check-in row is named
  `"<habit> (check-in #<slot> cycle <n>)"`. Undoing a check-in sets its
  `xp` to 0 but keeps the row, so re-ticking can't award again. Steps work
  the same way (`setStepXp`). Tending and travel XP are removed when undone.
- **No double XP** (sprint B1): tending a sown habit on Today is that day's
  check-in, never a second award.
- **No pressure.** Bonuses only add; missing a day never takes XP away, and
  nothing is shown as a broken streak (calm-design rules in
  `web-next/BUILD-BACKLOG.md`).
- **New XP goes through the same path.** Add the amount to `lib/xp.js` (or
  the feature's own rules file), write one `memory` row from
  `AppDataContext`, and make undo either remove it or zero it.

## What the YOU Realm builds on
- **The `memory` ledger is the event log.** The Realm reads what the Seeker
  did, and when, from `memory` (Pillar, amount, source, date) and derives
  its world from it. It must not keep a second XP total that can drift.
- **XP is client-written today.** Rows are written by the app under the
  Seeker's own RLS policy, so a determined user could write their own XP.
  That's fine for personal growth with nothing to trade.
- **Anything of value needs a server-side ledger.** Coins, gifts, trades,
  anything another person can receive, or anything that could ever be paid
  for, must live in its own table written only by an Edge Function or a
  `security definer` function (insert revoked from `authenticated`), with one
  row per change. Never in `profiles.prefs`, local storage or `memory`.
- Before the Realm is built: decide whether XP itself should move behind a
  server function too (it would close the client-written gap above).
