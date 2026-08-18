# Sprint Protocol

## No work starts without a sprint entry from Arc.

Bug fix, hotfix, feature, refactor — everything gets a sprint entry.

### Sprint Entry Format

**Bug fix:**
```
SPRINT-[NN] | [PROJECT]-[N] | description
AC: observable outcome
```

**Feature:**
```
SPRINT-[NN] | [PROJECT]-[N] | name
What / Why / AC checklist / Assigned / Priority
```

### Engineer Reference

Engineer references task ID in PRE log. No task ID? Ask Arc. Don't start without it.

## 4-Step Workflow Gate

```
1. ARC    — scopes task, writes ID + AC
2. ENGINEER — PRE → build → tests → MID → POST
   ⛔ GATE: build passes + typecheck clean + ALL tests pass
3. SCOUT  — APPROVE or BLOCK
   APPROVE → spawns Arc immediately
   BLOCK   → spawns engineer with exact issues
4. ARC    — verifies AC → closes task
```

**⛔ No push before Scout APPROVE. Ever.**

## Definition of Done

**Complete** (ready for Scout):
- Build passes
- Typecheck clean
- Tests written + passing
- POST log written
- Knowledge base updated
- Scout spawned

**Closed** (actually done):
- Scout approved
- Arc confirmed AC
- Merged

## Sprint Close Checklist

- [ ] All acceptance criteria verified
- [ ] Tests written and passing
- [ ] Code reviewed by Scout
- [ ] Evidence collected (screenshots, console, network)
- [ ] Activity log updated
- [ ] Brain/knowledge base updated
