# LexReport Squad Setup

This file is the operating contract for the agent system in this repo.

## Squad Roster

| Name | Role | Primary Focus |
|------|------|---------------|
| Atlas | Chief | Final decisions, sequencing, quality bar |
| Arc | Technical PM | Scope, acceptance criteria, sprint management |
| Iris | Design PM | UX flows, consistency, accessibility |
| Pixel | Frontend Engineer | UI, states, performance, polish |
| Trace | QA Engineer | Verification, test evidence, sign-off |
| Scout | Code Reviewer | Code quality, architecture, security |

## Source-of-Truth Docs

These are the only kept shared docs that define the bar:

- `AGENTS.md`
- `.agent/SQUAD_SETUP.md`
- `.agent/boundaries.md`
- `.agent/design-system.md`
- `.agent/os/work/SPRINT_PROTOCOL.md`

## PR Size Rule

PRs must touch no more than **30 files**. If a change exceeds that, split it into multiple PRs each scoped to a single concern.

## Working Model

We are using a page-by-page sprint system:

1. Every page sprint must be audited against the same seven sections:
   product experience, data truth, reliability, dense data UI, performance,
   design system, and security.
2. The next sprint does not open until the current sprint is signed off.
3. The first active wave is the first page sprints in the dashboard scope.

## Sprint Close Rule

A page sprint closes only when the sprint file contains:

- real owner files for the route
- route-specific API contract notes
- permission matrix for different user roles
- falsifiable known issue candidates from the codebase
- hard acceptance criteria with loaded, empty, loading, and error states
- evidence bundle paths for screenshots, console, network, performance, and accessibility
- Pixel, Trace, Scout, and Atlas sign-off with commit SHA and evidence paths

## Role Flow

1. Arc confirms page priority and the definition of done.
2. Iris sharpens UX, consistency, and accessibility expectations when needed.
3. Pixel executes the page fixes and polish.
4. Trace verifies the route and records evidence.
5. Scout reviews correctness, regressions, and security risks.
6. Atlas closes the sprint and unlocks the next page.

## Local Execution Artifacts

Local-only execution files live under `.agent/os/` and are intentionally
ignored by Git. The important ones now are:

- `.agent/os/notifications/queue.md`
- `.agent/os/work/SPRINT_QUEUE.md`
- `.agent/os/work/sprints/SPRINT-*.md`

## Naming Conventions

- Queue: `SPRINT_QUEUE.md`
- Page sprints: `SPRINT-[NN]-[page-slug].md`
- Example: `SPRINT-01-dashboard-home.md`

## What We Do Not Do

- We do not mark a sprint done without route evidence.
- We do not skip the seven-section audit just because a page looks fine at a glance.
- We do not raise PRs with more than 30 file changes.

## Brain Sync

This squad system syncs with the global brain at `~/.claude/brain/`:

- `~/.claude/brain/shared-learnings.md` — Squad-wide learnings
- `~/.claude/agents/[name]/brain/domain.md` — Agent-specific domain knowledge
- `~/.claude/agents/[name]/brain/patterns.md` — Agent-specific patterns

When you discover a pattern or make a project decision, update both the local `.agent/` files AND the global brain files to keep everything in sync.
