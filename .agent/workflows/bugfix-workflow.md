# Bug Fix Workflow

## Overview

This workflow guides bug fixes from identification to resolution.

## Steps

### 1. Reproduce

- Confirm the bug exists
- Document steps to reproduce
- Note the expected vs actual behavior

### 2. Root Cause Analysis

- Trace the call chain
- Identify the root cause
- Document in PRE log

### 3. Fix

- Implement the root cause fix (not a patch)
- Write tests that would have caught this bug
- Run build + lint + typecheck

### 4. Verification

- Confirm the fix works
- Run affected tests
- Check for regressions

### 5. Review

- Submit for Scout review
- Include reproduction steps in PR
- Include test evidence

## Rules

- **Root cause only** — patches are not acceptable
- **Test required** — every bug fix must have a test
- **No scope creep** — fix the bug, nothing else
- **Document the lesson** — update shared-learnings.md if the pattern is reusable

## Definition of Done

- [ ] Bug reproduced and documented
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Test written and passing
- [ ] No regressions
- [ ] Scout approved
- [ ] Lesson documented (if reusable)
