# Roadmap index

This is an index, not a new plan. The roadmap lives in these docs:

| Doc | What it holds |
|---|---|
| [`SPRINT-ROADMAP-42H.md`](../SPRINT-ROADMAP-42H.md) | **The current plan.** 21-day MVP sprint (4–25 Nov 2026) scoped to 42 hours, phases A–E, progress table, risks |
| [`HANDOVER-FOR-CHATGPT.md`](../HANDOVER-FOR-CHATGPT.md) | §3 what remains, §4 MVP definition, §6 Critical / Important / Future lists |
| [`03-YOU-LIVING-BIOGRAPHY-pivot-brief.md`](../03-YOU-LIVING-BIOGRAPHY-pivot-brief.md) | Living Biography feature set, ecosystem build order, Healing Journey boundary |
| [`web-next/BUILD-BACKLOG.md`](../web-next/BUILD-BACKLOG.md) | Living backlog and past decisions |

Motto: **trust → clarity → polish**. Build order: YOU Core → Empatherapy → Kronk → Elemental Game.

## Next

Taken from the docs above. Check the sprint progress table before starting
any item; some may already be done.

### Trust checks (before inviting the ~12 beta testers)
- [ ] Backup **test restore** into a scratch project (`supabase/backup/restore.mjs`), sprint A1
- [ ] Delete a test account and confirm **nothing is left** in any table or bucket, sprint A5
- [ ] Switch on the leaked-password check in Supabase Auth, sprint A1
- [ ] Run the Supabase security and performance advisors, sprint A6
- [ ] **AI test pass with consent on** (test account): every AI feature, allowance, moderation, sprint B3
- [ ] **Real phones**: iPhone Safari (installed PWA) and Android Chrome, full new-user journey, light and dark, small screen, sprint E1
- [ ] **Airplane-mode offline** on a phone, sprint E1

### Clarity and launch (sprint phases B–E)
- [ ] XP and RPG foundation note (`docs/xp-and-rpg-foundation.md`), sprint B2
- [ ] YOUrney · Your Season controls: time dropdown, full-screen read, save / delete, sprint C2
- [ ] YOU · values clarity for a newcomer, sprint C3
- [ ] First open: slower loading screen; tour and Find your way match the final pages, sprint C4
- [ ] Beta kit: `/privacy` still true, Send feedback lands in Notion, invite list, sprint E2

### Planned, after the sprint
- [ ] **Demo mode ("entry key")**, decided 8 Nov: portfolio visitors try YOU as a blank or example user. Must never touch real user data; needs a separate demo backend first.
- [ ] **Healing Journey**: designed only and hidden; built after Empatherapy exists to feed it.
- [ ] Everything else in the sprint's "Waits (post-beta)" list (YOU Realm, payments, Kronk work, separate staging database, CI, and so on).

### Known risks to keep in view
Shared staging/production database with real journals · paid YOUniversity
course content in the public JS bundle · legacy tables without CREATE
migrations (`supabase/schema/baseline.sql` is the reference) · no CI ·
1.43 MB main JS chunk.
