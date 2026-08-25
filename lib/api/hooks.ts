"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./client";
import { cacheGet, cacheSet } from "./query-cache";
export { clearApiQueryCache } from "./query-cache";

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

type QueryState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

export type QueryResult<T> = QueryState<T> & {
  refetch: () => void;
  setData: (updater: T) => void;
};

/**
 * Runs `fetcher` whenever `key` changes. The key is what identifies the request, so callers can
 * build it from their filter state without having to memoise the fetcher itself. Passing a null
 * key disables the query.
 *
 * Stale-while-revalidate: a key seen before in this session renders its cached data immediately
 * (no loading flash) while a fresh fetch runs quietly in the background and replaces it on
 * success. A brand-new key still shows the normal loading state.
 */
export function useApiQuery<T>(key: string | null, fetcher: () => Promise<T>): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>(() => {
    const cached = key !== null ? cacheGet<T>(key) : undefined;
    return { data: cached ?? null, error: null, loading: key !== null && cached === undefined };
  });
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (key === null) {
      setState({ data: null, error: null, loading: false });
      return;
    }

    let cancelled = false;
    const hasCached = cacheGet<T>(key) !== undefined;
    setState((prev) => ({
      data: hasCached ? (cacheGet<T>(key) as T) : prev.data,
      error: null,
      loading: !hasCached,
    }));

    fetcherRef
      .current()
      .then((data) => {
        if (cancelled) return;
        cacheSet(key, data);
        setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState((prev) => ({ data: prev.data, error: errorMessage(error), loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (data: T) => {
      if (key !== null) cacheSet(key, data);
      setState({ data, error: null, loading: false });
    },
    [key],
  );

  return { ...state, refetch, setData };
}

/**
 * Wraps a write call so components get pending/error state without repeating try/catch.
 */
export function useApiMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  const mutate = useCallback(async (...args: TArgs): Promise<TResult | null> => {
    setPending(true);
    setError(null);
    try {
      return await fnRef.current(...args);
    } catch (err: unknown) {
      setError(errorMessage(err));
      return null;
    } finally {
      setPending(false);
    }
  }, []);

  return { mutate, pending, error };
}
