# YOU — Claude Code project instructions

## Project identity and source of truth
- This repository is `Kashka-25/you-app-build`.
- The active Living Biography rebuild is `web-next/` on `feature/living-biography-ui`.
- The vanilla application at the repository root remains live and must stay untouched unless Cassidy explicitly approves a specific change.
- This is not the separate `YOUrigin` Creative Codex repository. Do not confuse the two projects.
- Before work, read `PROJECT-STATUS.md`, `AI-WORKFLOW.md`, `03-YOU-LIVING-BIOGRAPHY-pivot-brief.md`, `web-next/README.md`, `web-next/PHASE-0-DECISIONS.md`, and `web-next/BUILD-BACKLOG.md`.

## Sprint objective
Prepare YOU for a real-user private beta: secure and trustworthy data, correct XP, reliable AI features, clear core screens, acceptable performance, tested mobile/offline behaviour, and a usable beta onboarding/feedback path.

Time budget: 42 hours total (36 planned + 6 contingency). Do not expand scope to fill the time.

## Scope discipline
Prioritise the agreed beta work in `PROJECT-STATUS.md`. The RPG/Realm, payments, Kronk/CommYOUnity integration, Living Atlas, Healing Journey, Events, Therapists, Shop, Challenges, Saved, Web Push, and broad redesigns are post-beta unless Cassidy explicitly changes scope.

Do not add features, redesign completed screens, or alter product decisions without first explaining the impact and getting Cassidy's approval.

## Safety and production data
- Never run destructive SQL, delete user data, change production schema, or execute a live database migration without Cassidy's explicit approval for that exact operation.
- Before any migration: verify a database and storage backup, complete a test restore into a separate scratch Supabase project, rehearse the migration against that scratch project, and document rollback steps.
- Legacy/orphaned records must be exported and presented for Cassidy's review. Do not delete them until he explicitly approves after reviewing the export.
- Schedule any approved live migration during a quiet period.
- Do not expose secrets, tokens, service-role keys, private user data, or credentials in code, logs, commits, issues, or documentation.
- Never point test scripts or scratch-project work at production by accident. Verify project identifiers before running commands.
- Do not deploy or merge into the live vanilla application as part of this sprint.

## Development workflow
- Stay on `feature/living-biography-ui`; do not create another branch unless Cassidy explicitly approves.
- Make small, focused changes. Explain intended files and risks before high-impact changes.
- Run relevant checks from `web-next/` and report exact commands/results. Do not claim a test passed if it was not run.
- Keep the existing architectural boundaries. In particular, isolate integrations and avoid spreading external-service calls across unrelated components.
- Update `PROJECT-STATUS.md` at the end of each work session: status, completed items, files changed, checks run, blockers/decisions needed, hours used/remaining, and the next task.
- Update `web-next/BUILD-BACKLOG.md` when implementation scope or feature status changes.
- Do not silently overwrite another person's work. Fetch/pull before starting and resolve conflicts carefully.

## Completion standard
A task is complete only when its acceptance criteria are met, relevant checks pass, the change is committed, and the handover documents are updated. Distinguish implemented, tested, and production-verified states.
