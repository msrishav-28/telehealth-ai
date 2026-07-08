import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface RetryableQueryOptions<T> extends Omit<UseQueryOptions<T>, 'retry'> {
  maxRetries?: number;
  retryDelay?: (attempt: number) => number;
  onRetry?: (attempt: number, error: Error) => void;
  showErrorToast?: boolean;
}

export function useRetryableQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options: RetryableQueryOptions<T> = {}
) {
  const {
    maxRetries = 3,
    retryDelay = (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000),
    onRetry,
    showErrorToast = true,
    ...queryOptions
  } = options;

  const [retryCount, setRetryCount] = useState(0);

  const query = useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      if (failureCount >= maxRetries) {
        if (showErrorToast) {
          toast.error(`Failed after ${maxRetries} attempts: ${err.message}`);
        }
        return false;
      }

      const delay = retryDelay(failureCount);
      onRetry?.(failureCount + 1, err);
      
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, delay);

      return true;
    },
    retryDelay,
    ...queryOptions,
  });

  const manualRetry = useCallback(() => {
    setRetryCount(0);
    query.refetch();
  }, [query]);

  return {
    ...query,
    retryCount,
    manualRetry,
    isRetrying: query.isLoading && retryCount > 0,
  };
}