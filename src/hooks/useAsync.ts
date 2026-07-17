/**
 * Generic async hook for data fetching with error handling
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AsyncState } from '@/types';

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  dependencies?: any[];
}

/**
 * Custom hook for managing async operations
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {},
): AsyncState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const isMountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await asyncFunction();
      if (isMountedRef.current) {
        setState({ data: result, loading: false, error: null });
        options.onSuccess?.(result);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (isMountedRef.current) {
        setState({ data: null, loading: false, error: err });
        options.onError?.(err);
      }
    }
  }, [asyncFunction, options]);

  useEffect(() => {
    isMountedRef.current = true;
    execute();

    return () => {
      isMountedRef.current = false;
    };
  }, options.dependencies || []);

  const refetch = useCallback(execute, [execute]);

  return { ...state, refetch };
}

/**
 * Hook for mutation operations (POST, PUT, DELETE)
 */
export function useMutation<TData, TError = Error>(
  mutationFn: (data: TData) => Promise<any>,
) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null as TError | null,
  });

  const mutate = useCallback(
    async (data: TData) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await mutationFn(data);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const err = (error instanceof Error ? error : new Error(String(error))) as TError;
        setState({ data: null, loading: false, error: err });
        throw err;
      }
    },
    [mutationFn],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, mutate, reset };
}
