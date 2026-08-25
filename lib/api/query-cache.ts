// Module-level (not React state) so cached query results survive component unmount/remount —
// landing back on a page like Research after opening a case, or after a browser-back, shows the
// previous results instantly instead of a full loading flash. Kept in its own module (rather than
// inline in hooks.ts) so axios.ts can clear it on logout without importing a "use client" hook file.
const CACHE_LIMIT = 100;
const queryCache = new Map<string, unknown>();

export function cacheGet<T>(key: string): T | undefined {
  if (!queryCache.has(key)) return undefined;
  const value = queryCache.get(key) as T;
  // Re-insert to mark as most-recently-used (Map preserves insertion order).
  queryCache.delete(key);
  queryCache.set(key, value);
  return value;
}

export function cacheSet<T>(key: string, value: T): void {
  queryCache.delete(key);
  queryCache.set(key, value);
  if (queryCache.size > CACHE_LIMIT) {
    const oldest = queryCache.keys().next().value;
    if (oldest !== undefined) queryCache.delete(oldest);
  }
}

export function clearApiQueryCache(): void {
  queryCache.clear();
}
