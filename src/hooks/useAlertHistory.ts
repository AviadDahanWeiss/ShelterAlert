'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AlertHistoryMap } from '@/types';

interface UseAlertHistoryReturn {
  map: AlertHistoryMap;
  loaded: boolean;
  error: string | null;
  areaCount: number;
  retry: () => void;
}

export function useAlertHistory(): UseAlertHistoryReturn {
  const [map, setMap] = useState<AlertHistoryMap>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(0);

  const doFetch = useCallback(() => {
    const id = ++fetchRef.current;
    setLoaded(false);
    setError(null);

    fetch('/api/alert-history')
      .then(async (r) => {
        const data = await r.json();
        if (fetchRef.current !== id) return;
        if (data && typeof data === 'object' && 'error' in data) {
          setError(`API error: ${data.error}`);
          setMap({});
        } else {
          setMap(data as AlertHistoryMap);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (fetchRef.current !== id) return;
        setError(err instanceof Error ? err.message : 'Network error');
        setMap({});
      })
      .finally(() => {
        if (fetchRef.current === id) setLoaded(true);
      });
  }, []);

  useEffect(() => { doFetch(); }, [doFetch]);

  return { map, loaded, error, areaCount: Object.keys(map).length, retry: doFetch };
}
