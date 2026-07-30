/**
 * Base URL of the LexReport API, including the `/api` prefix the server mounts everything under.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3001/api";

/**
 * The API has no authentication yet. Workspace endpoints resolve the caller from this header and
 * fall back to a seeded demo user when it is absent, so leaving this unset is fine in development.
 */
export const API_USER_ID = process.env.NEXT_PUBLIC_API_USER_ID ?? "";
