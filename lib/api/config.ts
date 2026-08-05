/**
 * Base URL of the LexReport API, including the `/api` prefix the server mounts everything under.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3001/api";
