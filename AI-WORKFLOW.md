# YOU — Shared AI development workflow

## Purpose
Use one shared source of truth so Cassidy, Claude Code, and ChatGPT can coordinate without repeatedly reconstructing project context.

## Roles
- **Cassidy — product owner and final approver:** sets priorities, approves product decisions, and explicitly authorises consequential production or data operations.
- **Claude Code — implementation lead:** inspects the local repository, writes code, runs tests, commits changes, and maintains the project handover.
- **ChatGPT — product architect and independent reviewer:** helps scope work, turns goals into acceptance criteria, reviews GitHub-visible code/docs/commits/PRs, identifies risks, and recommends next steps. ChatGPT cannot see Claude's uncommitted local changes.

## Shared source of truth
1. The current GitHub branch `feature/living-biography-ui`.
2. `PROJECT-STATUS.md` — current state, sprint progress, decisions and next task.
3. `CLAUDE.md` — persistent implementation and safety instructions.
4. `03-YOU-LIVING-BIOGRAPHY-pivot-brief.md`, `web-next/README.md`, `web-next/PHASE-0-DECISIONS.md`, and `web-next/BUILD-BACKLOG.md` — product and technical context.

Claude should commit and push completed work so ChatGPT can review it. If work is still uncommitted, Claude must provide a summary or diff for Cassidy to share.

## Standard task loop
1. **Plan:** ChatGPT and Cassidy agree the outcome, constraints, and acceptance criteria.
2. **Implement:** Claude inspects the current branch and relevant files, then makes the smallest coherent change.
3. **Verify:** Claude runs relevant tests/build/lint/type checks and reports exact results, including failures and checks not run.
4. **Handover:** Claude updates `PROJECT-STATUS.md` and `web-next/BUILD-BACKLOG.md` as appropriate, then commits and pushes.
5. **Review:** ChatGPT reviews the pushed changes against the task and acceptance criteria.
6. **Refine:** Claude addresses review findings. Cassidy approves product changes and any consequential production operation.

## Task brief template
Every implementation task should state:
- **Outcome:** what should be true when finished.
- **Why now:** sprint priority and dependency.
- **Scope:** files/features included.
- **Out of scope:** what must not be changed.
- **Acceptance criteria:** observable pass/fail conditions.
- **Safety:** data, auth, privacy, migration, deployment or rollback concerns.
- **Verification:** commands and manual checks to run.

## Session handover template
At the end of each Claude Code session, update `PROJECT-STATUS.md` with:
- Date and branch.
- Tasks completed and acceptance criteria met.
- Files changed and commit SHA.
- Commands run and their actual results.
- Known issues, blockers and decisions needed from Cassidy.
- Sprint hours used and remaining (estimates clearly labelled).
- The single recommended next task.

## Review and merge rules
- No silent scope expansion.
- No claim of completion based on a visual placeholder or local component state when persistence/backend wiring is required.
- No merge to `main`, production deployment, destructive data cleanup, or live database migration without Cassidy's explicit approval.
- Keep the vanilla app at repository root untouched during the Living Biography rebuild.
- If a change cannot be reviewed from GitHub because it is uncommitted, ask Claude for the diff or a pushed commit before giving a code-level verdict.

## Communication
Use concise, actionable handovers. Separate facts observed in code from assumptions and recommendations. Raise blockers early rather than inventing product or data-model decisions.
