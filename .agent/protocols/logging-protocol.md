# Logging Protocol

Every task: PRE → MID → POST in `me/log.md`. No skipping.

## PRE — before touching code

```markdown
### PRE — [TASK-ID] | [Task name] | YYYY-MM-DD

**I understand:** what needs to happen and why

**Plan:** steps, files to touch

**Domains:** learning domains this task touches

**Learnings applied:**
- "[Learning title]" → [what I will do differently because of it]
- (if none apply: state which domains you scanned and why nothing changed your approach)

**Risks:** what could go wrong

**Open questions:** resolve before proceeding
```

## MID — at key milestones

```markdown
### MID — [TASK-ID]

**Status:** what's done

**Decision:** approach taken, why

**Unexpected:** what I didn't anticipate
```

## POST — before spawning Scout

```markdown
### POST — [TASK-ID]

**Outcome:** what was built or fixed

**Files changed:** list

**Tests written:** coverage and edge cases

**Learned:** insight → brain/patterns.md if repeatable

**Next:** what happens after this

**Sprint:** [TASK-ID] → ready for review / blocked
```

## CHECKPOINT — after compaction or mid-flight

```markdown
### CHECKPOINT — [TASK-ID] | [YYYY-MM-DD HH:MM UTC]

**Done (fully):** [file]: [what changed and why]

**In progress:** [file, function, line]: [exact state]

**Next action:** [single specific next step]

**Files changed so far:** [list]

**Tests:** [pass / fail / not yet covered]

**Critical context:** [decisions, ruled-out approaches, gotchas]
```

## Rules

- PRE log is the first write of every task, before any file read or edit
- MID logs happen at key milestones, not batched at the end
- POST log is written before spawning Scout
- No code change starts without a PRE log
- Even a two-line config edit needs a PRE log
