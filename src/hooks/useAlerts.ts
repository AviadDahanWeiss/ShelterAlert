'use client';

import { useState, useCallback, useEffect } from 'react';
import type { AlertsPayload, AlertSeverity } from '@/types';

interface UseAlertsReturn {
  alertAreas: string[];
  alertSeverity: AlertSeverity;
  alertTitle: string | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  refresh: () => Promise<void>;
}

const CLIENT_TIMEOUT_MS = 12000;

export function useAlerts(): UseAlertsReturn {
  const [alertAreas, setAlertAreas] = useState<string[]>([]);
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>('none');
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const res = await fetch('/api/alerts', { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json: AlertsPayload = await res.json();

      if (json.error === 'timeout') {
        setError('Alert service timed out — showing last known status.');
      } else if (json.error === 'fetch_failed' || json.parseError) {
        setError('Could not read alert data — showing last known status.');
      } else {
        setError(null);
      }

      // "ended" severity means the API confirmed the event is over — clear all areas
      if (json.severity === 'ended') {
        setAlertAreas([]);
        setAlertSeverity('none');
      } else {
        setAlertAreas(json.data ?? []);
        setAlertSeverity(json.severity ?? 'none');
      }

      setAlertTitle(json.title ?? null);
      setLastFetched(new Date());
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      setError(
        isAbort
          ? 'Request timed out — showing last known status.'
          : 'Could not reach alert service — showing last known status.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { alertAreas, alertSeverity, alertTitle, loading, error, lastFetched, refresh };
}
