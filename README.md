# LexReport — web client

Next.js 15 (App Router) client for the LexReport law reporting platform.

## Running it

The client reads everything from the LexReport API, so start the server first.

```bash
# in ../lex-report-server — needs a Postgres DATABASE_URL, see its .env.example
npm install
npx prisma migrate dev
npx prisma db seed
npm run start          # http://localhost:3001/api, docs at /docs
```

```bash
# in this directory
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

Sign up (or sign in as a seeded user, e.g. the partner account from `prisma/seed.ts`) — the API
enforces real JWT authentication; there is no placeholder login.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Base URL of the API, including the `/api` prefix |

## How data flows

`lib/api/` is the only place that talks to the network.

- `config.ts` — environment configuration
- `client.ts` — `fetch` wrapper; throws `ApiError` carrying the HTTP status, and turns a
  connection failure into a readable message rather than an unhandled rejection
- `types.ts` — TypeScript mirrors of the API response bodies
- `index.ts` — one object per resource (`casesApi`, `mattersApi`, `draftsApi`, …)
- `hooks.ts` — `useApiQuery(key, fetcher)` and `useApiMutation(fn)`

`useApiQuery` re-runs whenever its `key` changes, so components build the key from their filter
state; a `null` key disables the query. `components/AsyncState.tsx` renders the loading, error and
empty branches so screens do not each reimplement them.

Case lists return summaries and the detail overlay fetches the full judgment by id, so
`DashboardContext` carries `selectedCaseId` rather than a whole case object.

## Sample data

Every screen is backed by the API except Court Watch, which is still local sample data in
`lib/data.ts` because the alerts feature is deliberately out of scope for the API.
