"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./client";

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
 */
export function useApiQuery<T>(key: string | null, fetcher: () => Promise<T>): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    error: null,
    loading: key !== null,
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
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ data: null, error: errorMessage(error), loading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (data: T) => setState({ data, error: null, loading: false }),
    [],
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
