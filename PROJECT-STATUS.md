# YOU — Living Biography beta sprint status

**Last updated:** 4 November 2026  
**Active repository:** `Kashka-25/you-app-build`  
**Active branch:** `feature/living-biography-ui`  
**Active application:** `web-next/`  
**Sprint budget:** 42 hours (36 planned + 6 contingency)

## Sprint outcome

Prepare YOU for a real-user private beta: people can create accounts, record and develop their lives, use the core Living Biography experience, and send feedback. This sprint establishes reliable foundations for a future RPG system; it does not build the RPG.

## Confirmed decisions from Cassidy

| Area | Decision | Guardrail |
|---|---|---|
| Backups | Stay on Supabase Free; use scripted backups | Verify database **and storage** backup, then complete a scratch-project test restore before migration |
| Legacy data | Review first | Export the 41 legacy rows and 6 orphaned items; Cassidy must inspect the export and explicitly approve deletion |
| Live migration | Quiet period | Rehearse on scratch, document rollback, back up immediately beforehand, and obtain explicit approval for the exact live operation |
| PursYOUts | Compact expandable cards | Essential information visible at a glance; detail expands on demand |

## Current product baseline

The React + Vite + Tailwind rebuild lives in `web-next/` on this branch. The vanilla app at the repository root remains live and must not be changed as part of this sprint.

**Reported as functional with real Supabase read/write:** Pursue add/complete/un-achieve/delete, tags, milestones, intention reflection, habit day tracking/streaks/idempotent check-in XP, Values progression/challenges/breakthroughs, and Pillars levels. Home, Journey and the navigation shell have built-out UI.

**Reported as structural/local-state only, not persistence-wired:** Events, CommYOUnity mock feed, Healing, Therapists, Challenges, Saved, Review, Shop, Living Atlas, Tree of YOU detail and Constellations. Parked stubs include Empatherapy bridge, Settings/Account and Legacy Mode.

Use `web-next/README.md` and the live code as the source of truth; verify before treating any feature as complete.

## Agreed MVP priorities and allocation

| Phase | Work | Planned hours |
|---|---|---:|
| A — Data trust | Scripted database/storage backups; test restore; commit schema baseline and migration notes; export legacy/orphaned rows for review; account-link migration after approval; verify account deletion/export; security/performance advisors | 10 |
| B — Correctness | Fix duplicate XP; document one XP source of truth and future RPG ledger rules; test every AI feature with consent, caps and safe outputs | 6 |
| C — Core clarity | PursYOUts quick-add and expandable cards; YOUrney season controls; Values/Pillars clarity and empty states; first-open loading and welcome-tour copy | 12 |
| D — Performance | Lazy-load routes/extras; target a materially smaller main bundle without breaking offline use | 2 |
| E — Beta proof | iPhone Safari PWA and Android Chrome QA, including offline; beta tester note, privacy page verification, feedback-to-Notion check and first invites | 6 |
| Contingency | Fixes from QA and first tester feedback | 6 |
| **Total** | **36 planned + 6 contingency** | **42** |

### Acceptance gates

- **A1 — Backup/restore:** scripted export covers database data and storage; restore has actually succeeded in a separate scratch Supabase project.
- **A3 — Legacy review:** export is readable and complete; no deletion until Cassidy approves after review.
- **A4 — Account-link migration:** rehearsal and rollback documented; live migration only after explicit approval; app reads/writes and offline queue verified.
- **A5 — Privacy:** test account deletion leaves no user rows or storage objects; export covers every user table.
- **B1/B2 — XP:** one award per habit/day, no duplicate XP regardless of check-in order; all awards flow through the single XP module/ledger.
- **B3 — AI:** each shipped AI path tested with consent enabled; caps, refusal/moderation and allowance behaviour checked.
- **C — Core UX:** a newcomer can add and check in a habit quickly; season can be read/saved/changed/deleted; no dead ends on empty accounts; tour matches actual screens.
- **D — Performance:** main chunk reduced materially and offline behaviour still works.
- **E — Beta:** written pass/fail phone QA, accurate privacy wording, feedback path tested, tester note and invites ready.

## Explicitly post-beta

YOU Realm/RPG UI; payments/YOU Premium; Kronk/CommYOUnity integration; Web Push; Living Atlas; Healing Journey; Events; Therapists; Shop; Challenges; Saved; separate staging database; automated end-to-end tests/CI; broad refactors; extra Arcana; visual redesigns of already-finished pages.

## Immediate next task

**A1 — Build and verify scripted backups on Supabase Free.**

Before implementation, Claude should inspect current Supabase backup/export capabilities and existing scripts, propose a safe database + storage backup approach, identify required local tools/permissions, and then implement it without touching production data. Complete a restore into a separate scratch project and record the evidence. Do not proceed to migration until this gate is met.

## Approval queue

- [ ] Cassidy reviews the exported 41 legacy rows and 6 orphaned items.
- [ ] Cassidy explicitly approves or rejects permanent deletion after review.
- [ ] Cassidy selects a quiet time for the live migration.
- [ ] Cassidy explicitly approves the exact live migration after backup, scratch rehearsal and rollback review.

## Session log

| Date | Work completed | Commit | Hours used (estimate) | Next |
|---|---|---|---:|---|
| 2026-11-04 | Shared AI workflow and sprint baseline documented | See GitHub commit history | 0 | A1 — backup/restore plan and implementation |
