# Agent Instructions (LexReport)

Every agent must read this file before responding to a prompt in this repository.

## Canonical Project Docs (Read First)
- `.agent/SQUAD_SETUP.md` — squad roster and operating contract
- `.agent/boundaries.md` — forbidden and restricted zones
- `.agent/design-system.md` — design system conventions
- `.agent/protocols/` — workflow protocols
- `.agent/workflows/` — feature workflow guides

## Quick Start
- Install deps: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Smoke tests: `npm run smoke`
- Interaction tests: `npm run smoke:interactions`
- Layout audit: `npm run audit:layout`
- Screenshot audit: `npm run audit:shots`

## Architecture
- Next.js 15 App Router in `app/`
- UI components in `components/`
- Shared utilities in `lib/`
- API client in `lib/api/`
- Custom hooks in `hooks/`
- Scripts in `scripts/`
- Styles in `app/styles/` and `app/globals.css`

## Code Placement
- Pages/routes: `app/`
- Reusable UI: `components/`
- Feature-specific components: `components/` (co-located with feature)
- API client & types: `lib/api/`
- Shared helpers/utilities: `lib/`
- Custom hooks: `hooks/`
- Static assets: `public/`
- Scripts: `scripts/`

## Boundaries (Do Not Touch)
- `node_modules/`, `.next/` (build artifacts)
- `package-lock.json` — only changes when deps change intentionally
- `lib/api/config.ts` — environment configuration, restricted zone

## Data Flow
- `lib/api/client.ts` — fetch wrapper; throws `ApiError`
- `lib/api/types.ts` — TypeScript mirrors of API response bodies
- `lib/api/index.ts` — one object per resource (`casesApi`, `mattersApi`, `draftsApi`)
- `lib/api/hooks.ts` — `useApiQuery(key, fetcher)` and `useApiMutation(fn)`
- `components/AsyncState.tsx` — renders loading, error, and empty branches

## Testing Rules
- Smoke tests: `scripts/smoke.mjs`
- Interaction tests: `scripts/interactions.mjs`
- Layout audit: `scripts/audit-layout.mjs`
- Screenshot audit: `scripts/audit-shots.mjs`
- Always run the full test suite before pushing

## Skill Routing (Freebuff / Codebuff)
- Use `testing-workflow` for test planning, implementation, coverage audits
- Use `react-best-practices` for React/Next.js performance and architecture
- Use `web-design-guidelines` for UI/UX or visual design tasks
- Repo skills live in `skills/` and `.agents/skills/`

## Frontend / UI Work (CRITICAL — Read First)
**BEFORE any UI changes, ALWAYS read `.agent/design-system.md`** — component inventory, styling tokens, banned patterns, architecture.

### Design System Compliance (MANDATORY)
- ❌ **NEVER use arbitrary values:** No `bg-[#hex]`, `gap-[8px]`, `px-[24px]`, `h-[36px]`
- ✅ **ALWAYS use design tokens:**
  - Colors: semantic Tailwind classes
  - Spacing: standard Tailwind scale (`gap-2`, `gap-3`, `px-6`, `py-4`)
  - Sizing: standard Tailwind scale (`h-9`, `h-6`, `size-4`)
  - Borders: `rounded-lg`, `rounded-xl`, `rounded`

## Frontend Engineering Principles (Non-Negotiable)

### DRY
- Same logic in two places → extract. Same component shape in three places → abstract.
- Wait for the third real repetition before abstracting.

### Single Responsibility
- One component does one thing. If describing it requires "and", split it.
- One hook owns one concern.

### Composition over Configuration
- Prefer small composable pieces over one mega-component with 15 props.

### Co-location
- A component only used on one page lives next to that page, not in global `components/`.

### Server-first
- Fetch data in Server Components where possible — do not `useEffect` + `useState` to fetch.
- Push `"use client"` to the leaves. The default is server.

### Single Source of Truth
- One place owns each piece of state. Never duplicate state into local `useState`.

### No Waterfalls
- Parallel data fetching with `Promise.all` — never sequential awaits for independent data.

### Lazy Load Below the Fold
- Use `dynamic()` for heavy components not needed on first paint.

### Accessibility (Mandatory)
- Semantic HTML first: `<button>` not `<div onClick>`, `<nav>` not `<div className="nav">`.
- Every interactive element is keyboard reachable.
- Every image has `alt`. Every icon-only button has `aria-label`.

---

## Style & Conventions
- Lint with ESLint (`eslint.config.mjs`)
- TypeScript strict mode
- Tailwind CSS for styling
- Radix UI primitives
- CVA (class-variance-authority) for component variants

## Git & PR Rules
- Never commit directly to `main` — all changes go through a PR
- PRs should be focused on a single concern
- Commit messages should be descriptive

## Project Operating Rules

### Workflow
1. **PM** defines scope and acceptance criteria
2. **Tech Lead** approves spec or clarifies requirements
3. **Frontend Engineer** implements UI tasks
4. **QA Engineer** verifies and records evidence
5. **Code Reviewer** reviews correctness, regressions, and security
6. **Tech Lead** marks Done

### Memory Rules
- Task notes: `.agent/os/tasks/`
- Activity logs: `.agent/os/activity.md`

### Local Team OS (Not Committed)
- Local-only execution artifacts live under `.agent/os/`
- Keep `.agent/os/*` out of commits
