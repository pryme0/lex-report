# Feature Workflow

## Overview

This workflow guides feature development from scoping to deployment.

## Steps

### 1. Scoping (Arc)

- Define the problem and desired outcome
- Write acceptance criteria
- Create sprint entry
- Assign to engineer

### 2. Design Review (Iris)

- Review UX flows
- Check design system compliance
- Validate accessibility
- Approve or request changes

### 3. Implementation (Pixel/Forge)

- Read PRE learnings
- Implement changes
- Write tests
- Run build + lint + typecheck
- Write MID logs at milestones
- Write POST log

### 4. Code Review (Scout)

- Review for correctness
- Check design system compliance
- Verify tests
- Check security
- APPROVE or BLOCK

### 5. QA Verification (Trace)

- Run smoke tests
- Check edge cases
- Verify accessibility
- Collect evidence
- Sign off

### 6. Sprint Close (Atlas/Arc)

- Verify all AC met
- Confirm Scout APPROVE
- Update activity log
- Close sprint
- Unlock next page

## File Conventions

- Sprint files: `.agent/os/work/sprints/SPRINT-[NN]-[page-slug].md`
- Activity log: `.agent/os/activity.md`
- Notifications: `.agent/os/notifications/queue.md`
