# Agent Boundaries

## Forbidden Zones (Require Human Approval)
- `node_modules/`, `.next/`, `coverage/` (build/output artifacts)
- `package-lock.json` — only changes when deps change intentionally

## Restricted Zones (Write tests/docs only)
- `app/` and `components/` when changes affect auth flows (confirm with owner)
- `lib/api/config.ts` — environment configuration, request lifecycle logic

## Allowed Zones (Safe for Agent Work)
- `lib/` (helpers/utilities, API client)
- `hooks/` (custom React hooks)
- `scripts/` (automation scripts, tests)
- `components/` (UI components — follow design system)
- `app/` (routes and pages — follow Next.js conventions)

## Notes
- If unsure whether a file is sensitive, pause and ask for approval.

## Global Rules
- All monetary arithmetic must use minor units (cents) — never raw floats
- Convert to formatted currency strings only at display boundaries
- Unknown monetary values must stay explicit (`--` / `No data`) — never coerce to `0`
