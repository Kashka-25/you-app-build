# YOU — 21-day MVP sprint, scoped to 42 hours

*4–25 November 2026. A companion to `HANDOVER-FOR-CHATGPT.md`. Sources: `03-YOU-LIVING-BIOGRAPHY-pivot-brief.md`, `web-next/BUILD-BACKLOG.md`, the code on `main`, and read-only checks of the live database on 4 Nov.*

**Goal:** a working Living Biography app that real people can sign up for, use to record and grow their lives, and send feedback from.
**Not in scope:** the RPG game (YOU Realm). This sprint only lays clean foundations for it.
**Budget:** 42 hours ≈ 2 hours a day. That's 36 h of planned work plus 6 h of contingency.

---

## Progress (4 Nov, merged to main: PR #91 → #92)

| Task | State |
|---|---|
| A1 Backups | **Supabase Pro since 5 Nov** (YOU's project moved into the Wandering org): daily backups kept 7 days, no pausing, image resizing (memory photos now load 800px copies). Scripted export (`supabase/backup/backup.mjs`, data + storage, `~/YOU-backups/`) still before every migration. Leaked-password check: Cassidy to switch on. **Test restore done 9 Nov**: a fresh backup rebuilt into a scratch project matched live on every table, account, policy, function lock and trigger (photo upload not restored, only counted); scratch project deleted. Fixes in `fix/backup-retry` |
| A2 Schema baseline | Done: `supabase/schema/baseline.sql` + `snapshot.mjs` (refreshed after A4) |
| A3 + A4 Account-link migration | **Live (4 Nov):** 48 unreachable rows removed; items/memory/mood_log/user_xp are uuid → `auth.users` on delete cascade; 7 policies recreated. Items 42, memory 72 |
| A5 Delete & export | **Live:** `delete-account` redeployed and clears the four tables itself; export adds `user_xp`, `dream_patterns`, `beta_feedback`, `arcanum_code_redemptions`. **Delete check done 13 Nov on staging:** the test account (27 rows in 11 tables, 1 memory photo, its sign-in) was deleted from Settings → Your data; afterwards 0 rows in any column of any app table, 0 files, 0 sessions. Export checked against the database: it has every table a Seeker writes to; not included are `ai_usage` (counts only), `client_errors`, `showcase_reports` and YOUrigin's three tables. YOUrigin's portfolio pictures (private `portfolios` bucket, folders named by a hash, not the user id) were left behind; `fix/delete-yourigin-pictures` removes them, checked on staging with a second test account (a published portfolio and its picture, then 0 rows, 0 files) |
| B1 Double XP | Fixed: tending a sown habit is its check-in |
| B2 One XP source | **Done 13 Nov:** every XP award is one `memory` row written from `AppDataContext`; no component or Edge Function writes XP; `user_xp` is legacy and unwritten. The last two amounts outside the rules files (`TEND_XP`, `TRAVEL_MEMORY_XP`) moved into `lib/xp.js`, and finishing a pursuit uses `finishXp`. Rules and the Realm's ground rules in `docs/xp-and-rpg-foundation.md` |
| B3 AI test pass | **Done 13 Nov on staging** (you-staging, test account, consent on): consent screen, entry reflection, weekly reflection, season, suggest chapters, Ask YOU, dream patterns and value challenges all worked and read well; daily-limit message checked by lowering the limit briefly. 8 calls, about US$0.13. Found and fixed in `fix/ai-test-findings`: a second memory stuck on "Saving…", medication advice in -ing form ("reducing your medication") slipping past moderation (now 27 moderation tests), season dates reading "9 Nov – 9 Nov", "1 moments" / "Read my 1 dreams" (dream reading now waits for a second dream). Still to do: scan a page, on a phone |
| C1 PursYOUts | Compact cards, quick add and painted header were already live; a small "Sow your week" button in the header (Cassidy chose a button over a card) |
| C2 Your Season | **Checked 13 Nov** (demo, Wren, with test readings): the time menu (ten weeks, two weeks, a month, three months, since a date), full-screen reading, kept readings in Memories by date, delete from a kept reading, and the demo's "AI is off" message all pass; keep / change / delete on closing a fresh reading checked in the code (needs a real AI read). Build Note already Done (PR 93 → 94). Fixed: look-back readings showed the day after their last day ("18 Oct – 2 Nov" for a reading on 1 Nov) |
| C3 Values clarity | **Checked 13 Nov in the demo** (blank newcomer and Wren). Passes: first values (ten starters with meanings, "See all", own words), values sky and cards, challenges grow the value and its Pillar, resting, True North with fewer than two values says what to do, the Crossroads opens and can be left, an empty Pillar offers "Plant something" and "Free a dream". Fixed: Pillars said writing in the YOUrnal grows them (it earns no XP, so the empty-state line and "How Pillars grow" now name only what does, and say the YOUrnal is never scored); a value's card now says which Pillar its challenges grow and what the points mean, and a done challenge says "+3 · Rest and Body grew". Welcome tour and Find your way describe values truly (nothing for C4) |
| C4 First open | **Done 13 Nov:** the splash keeps the full YOU logo and stays one splash; it breathes in once (1.2 s, paint only) with a line for today, one of ten picked by the date (`lib/dailyLine.js`, the same all day); the blinking status word is gone (screen readers still hear it), the first page fades in once after the splash, and nothing moves with reduced motion. No added wait. Welcome tour, Find your way and the planets page checked against the app and corrected: the bar holds four places and YOUrney is in the menu, what the + adds, ideas as a PursYOUt (+10 XP), what YOUrney holds, the real Extras, KommYOUnity and YOUniversity marked as Extras |
| D1 Bundle | Non-core screens lazy-loaded: main chunk 1.70 → 1.43 MB (495 → 424 KB gzip). The rest is the 245 KB values Codex and core libraries |
| E2 Tester note | Rewritten for the simple beta; README replaced |

Hours used so far: about 9 of 42.

---

## 1. Where the pivot brief stands

| Pivot brief feature | State on `main` | MVP? |
|---|---|---|
| Life Chapters (AI-suggested) | Built | Yes, as it is |
| Seasons (AI-inferred) | Built, plus season reviews | Yes; finish the controls |
| Tree of YOU | Built (8 painted tiers) | Yes, as it is |
| Life Constellations | Built | Yes, as it is |
| The Mirror | Built | Yes, as it is |
| Legacy / My Story | Built (print, PDF, Markdown) | Yes, as it is |
| Living Biography AI (patterns) | Partly built: YOUnderstanding, Ask YOU, weekly reflection, Look back | Yes, but **test it** |
| Living Atlas | Not built (hidden) | No |
| Healing Journey | Designed only (hidden) | No |

**Conclusion:** the Living Biography is already feature-complete enough for a beta. The 42 hours should go on **trust, correctness and clarity**, not new features.

---

## 2. Found on 4 Nov (read-only checks of the live database)

1. **Deleting an account doesn't delete everything.** Four of the original tables, `items` (habits, goals, dreams, ideas), `memory` (XP history), `mood_log` and `user_xp`, store `user_id` as plain text with **no link to the account**. Every other table (50 of them) is linked and cascades. So **Delete my account** leaves those four tables' rows behind. This makes the privacy page untrue. **6 orphaned items** from deleted accounts are already there.
2. **42 rows belong to nobody who can sign in.** They're old ids from the first vanilla app (`user_…`: 24 items, 17 memory rows, 1 user_xp). Row-level security means nobody can read them, but they block converting the column to a proper account link.
3. **"Ideas" are safe.** `items.type` has no check constraint, so `idea` saves.
4. **The schema is now captured.** `supabase/schema/baseline.sql` was generated from the live database (54 tables, all policies, functions, triggers, buckets), together with a re-runnable script `supabase/schema/snapshot.mjs`. It's uncommitted on branch `fix/mvp-secure-and-polish`. No changes were made to the database.

---

## 3. Dependencies between unfinished work

```
Backups confirmed + test restore ─┐
Schema baseline (done) ───────────┼─► Account-link migration (4 legacy tables)
Decide fate of 47 legacy/orphan ──┘        │
rows                                       ├─► Delete-account + export verified ─► Privacy page true
                                           └─► XP ledger is account-safe ─► (future) RPG reads XP, coins ledger

Single XP rule source (fix double XP) ─► (future) RPG economy can trust XP

AI test pass ─────────────┐
PursYOUts polish ─────────┤
YOUrney Season controls ──┼─► First-open loading + tour copy ─► Phone QA (iOS + Android) ─► Fix buffer ─► Beta kit + invites
YOU values clarity ───────┤                                       ▲
Bundle code-splitting ────┘                                       │
Offline (built) ──────────────────────────────────────────────────┘ (tested during QA)
```

Key rules that come from this:
- **Back up before migrating.** The staging site uses the live database, so every migration reaches real users.
- **The welcome tour is written last among the pages**, because it describes them.
- **Phone QA only once the pages are frozen**, otherwise it has to be done twice.
- **The tester note is written last**, after navigation is final.

---

## 4. Essential for the beta vs can wait

### Essential (in the 42 hours)
- Data you can trust: backups, accounts linked properly, delete and export complete.
- XP correct and from one source (no double-earning).
- The AI features work with consent on, stay within the caps and give safe output.
- The core five pages clear for a newcomer: Home, YOUrnal, PursYOUts, YOUrney, YOU.
- First open is fast enough and truthful.
- Tested on real phones, including offline.
- Feedback reaches Cassidy (Send feedback → Notion, crash reports).
- Tester note and invites.

### Waits (post-beta)
YOU Realm and any RPG UI · payments / YOU Premium · KommYOUnity / Kronk work (needs Chris) · Web Push · Living Atlas, Healing Journey, Events, Therapists, Shop, Challenges, Saved, Review · a separate staging database · automated end-to-end tests and CI · refactoring `AppDataContext` · more Arcana · new extras · palette or visual reworks of finished pages.

*Accepted risk:* staging keeps sharing the live database during the sprint. Mitigations: backups, a test account, migrations rehearsed on a scratch project first.

---

## 5. The roadmap: exact order, with hours

### Phase A · Secure the data (10 h), days 1–5
| # | Task | Hours | Done when |
|---|---|---|---|
| A1 | **Backups.** Decide: Supabase Pro ($25/mo: daily backups kept 7 days, leaked-password check, no pausing), or a weekly scripted export of data and storage on Free. Then do one **test restore** into a scratch project | 2 | A restore has actually been done once |
| A2 | Commit the schema baseline + snapshot script; add a "how migrations work here" note (SQL editor, never `db push`, re-run snapshot after) | 0.5 | Baseline on `staging` |
| A3 | **Clean the legacy rows** (Cassidy's OK needed: permanent): delete the 41 `user_…` rows and 6 orphaned items. Export them to a file first | 0.5 | Every `user_id` matches a real account |
| A4 | **Account-link migration**: convert `items`, `memory`, `mood_log`, `user_xp` `user_id` to `uuid` → `auth.users` **on delete cascade**; recreate their "own rows" policies as `auth.uid() = user_id`; add indexes on `user_id`. Rehearse on a scratch project built from the baseline, then run it on live at a quiet hour, right after a backup | 4 | Live; app reads/writes unchanged; offline queue still syncs |
| A5 | **Delete & export check**: delete a test account and confirm nothing is left in any table or bucket; check `lib/accountData.js` exports every user table (incl. `habit_logs`, `younderstandings`, `dream_patterns`, `projects`) | 2 | Zero rows remain; export contains all tables |
| A6 | Run Supabase **security and performance advisors** (`supabase db advisors`); fix anything critical | 1 | No critical advisor items |

### Phase B · Correct core and RPG foundations (6 h), days 6–8
| # | Task | Hours | Done when |
|---|---|---|---|
| B1 | **Fix double XP** when a sown habit is tended on Today and checked in on PursYOUts the same day | 2 | One XP award per habit per day, tested both orders |
| B2 | **One XP source of truth**: confirm every XP award goes through `lib/xp.js` → a `memory` row (Pillar, amount, source, date). Write `docs/xp-and-rpg-foundation.md`: XP rules, the `memory` ledger as the event log the Realm will read, and the rule that anything of value (coins, gifts) needs a server-side ledger table, never prefs | 1.5 | Doc written; no XP written outside `xp.js` paths |
| B3 | **AI test pass** with a test account, consent on: reflect, dream read, highlights, scan a page, weekly reflection, season, suggest chapters, generate challenges, Ask YOU; allowance moves; refusal and moderation messages read well | 2.5 | Every AI feature tried once on live; issues logged |

### Phase C · Make the core obvious (12 h), days 9–14
| # | Task | Hours | Done when |
|---|---|---|---|
| C1 | **PursYOUts**: quick-add (name, type, life area) with "More"; compact cards that open for detail; a Sow/Harvest card at the top all week; an Add button on the page | 5 | A newcomer adds and checks in a habit in under 30 seconds |
| C2 | **YOUrney · Your Season**: time choice as a dropdown, full-screen read, save / change / delete (open Build Note) | 3 | Season can be read, kept and removed |
| C3 | **YOU · values clarity**: a newcomer understands "choose a few values" and sees Pillars grow from their actions; empty states guide them | 2 | No dead ends on an empty account |
| C4 | **First open**: a slower, more intimate loading screen; welcome tour and Find your way match the final pages | 2 | Tour describes what's really there |

### Phase D · Speed (2 h), day 15
| # | Task | Hours | Done when |
|---|---|---|---|
| D1 | Lazy-load routes and extras so the main bundle drops from 1.7 MB towards ~600 KB | 2 | Build shows the smaller main chunk; app still works offline |

### Phase E · Prove it and launch (6 h), days 16–19
| # | Task | Hours | Done when |
|---|---|---|---|
| E1 | **Phone QA**, iPhone Safari (installed PWA) and Android Chrome: sign up → confirm email → welcome → habit → check-in → journal with photo → memory → Sow/Harvest → AI → airplane mode → export → delete. Light and dark, a small phone | 4 | A written pass/fail list |
| E2 | **Beta kit**: rewrite `TESTER-NOTE.md`; check `/privacy` is true (now that delete is complete); test Send feedback lands in Notion; invite list | 2 | Note sent to the first wave |

### Contingency (6 h), days 20–21
Fixes from E1 and from the first testers' feedback. If unused: delete merged branches and update the stale `web-next/README.md` (1 h).

**Total: 10 + 6 + 12 + 2 + 6 = 36 h planned + 6 h contingency = 42 h.**

---

## 6. Biggest technical risks

| Risk | Why it matters | Mitigation in this plan |
|---|---|---|
| **Migrating live tables with real users on them** (A4) | Staging and production share one database; a mistake hits real journals and habits | A1 backup + restore first; rehearse on a scratch project from the baseline; run at a quiet hour; type change keeps the same values |
| **Account deletion is incomplete today** | Privacy promise is untrue; legal/trust issue once strangers join | A3–A5 fix it before any new invites |
| **Backups unproven** | On Free, a bad migration or bug may be unrecoverable | A1 is the first task |
| **AI untested with real consent** | The headline "Living Biography" value could fail or misbehave in front of testers | B3, with cost caps and moderation already in place |
| **iOS PWA behaviour** | Storage eviction, camera/HEIC, offline queue, install flow differ on iPhone | E1 on a real iPhone |
| **Offline queue during the migration** | A phone holding queued writes to `items`/`memory` replays them after the change | The ids stay identical; uuid text casts cleanly; verify in A4 |
| **Scope creep** | The project has a history of fast new features and redesigns | Feature freeze; everything new goes to Build Notes for after the beta |
| **Solo builder, 2 h/day** | One bad day eats the buffer | 6 h contingency; phases are independent enough to reorder C and D |

---

## 7. Foundations this leaves for the RPG (without building it)

- Every XP event is a `memory` row linked to a real account and deleted with it (A4).
- XP awarded in one place, with no double-counting (B1–B2).
- A written contract for the Realm: read Pillar levels from the XP ledger; keep cosmetic choices in prefs; put anything spendable or giftable (YOU Coins, Crystals, gifts to artists) in a server-side ledger table written only by an Edge Function.
- The `feat/you-rpg` branch stays parked as reference.

---

## 8. Decisions needed from Cassidy before starting

1. **Backups:** Supabase Pro ($25/month) or a scripted export on Free?
2. **Permission to permanently delete** the 41 legacy `user_…` rows and 6 orphaned items (exported to a file first).
3. **A quiet time** to run the account-link migration on the live database.
4. **PursYOUts:** compact cards that open for detail. Yes/no.
