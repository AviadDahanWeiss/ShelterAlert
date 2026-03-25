'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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

/**
 * How long to keep an area "sticky" after the siren stops.
 * Pikud HaOref sirens can be brief; the threat and shelter-time continue.
 * We only clear immediately on an explicit "ended" event.
 */
const STICKY_MS = 30 * 60 * 1000; // 30 minutes

export function useAlerts(): UseAlertsReturn {
  const [alertAreas, setAlertAreas] = useState<string[]>([]);
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>('none');
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  /**
   * Sticky map: area (Hebrew) → timestamp it was last seen as active.
   * Persists across refreshes within the same session.
   */
  const stickyRef = useRef<Map<string, number>>(new Map());

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
      } else if (json.error === 'fetch_failed') {
        setError('Could not reach alert service — showing last known status.');
      } else {
        // parseError is treated as "no data" not a user-visible error —
        // Pikud HaOref returns non-JSON during quiet periods, which is normal.
        setError(null);
      }

      const now = Date.now();

      if (json.severity === 'ended') {
        // Explicit all-clear from Pikud HaOref — wipe everything immediately
        stickyRef.current.clear();
        setAlertAreas([]);
        setAlertSeverity('none');
        setAlertTitle(json.title ?? null);
      } else if (json.data && json.data.length > 0) {
        // Active siren/alert — stamp each area with current time
        for (const area of json.data) {
          stickyRef.current.set(area, now);
        }
        setAlertAreas(Array.from(stickyRef.current.keys()));
        setAlertSeverity(json.severity ?? 'active');
        setAlertTitle(json.title ?? null);
      } else {
        // Siren stopped but no explicit "ended" — keep areas sticky.
        // Only expire areas that have been quiet for > STICKY_MS.
        for (const [area, ts] of Array.from(stickyRef.current.entries())) {
          if (now - ts >= STICKY_MS) stickyRef.current.delete(area);
        }

        if (stickyRef.current.size > 0) {
          // Still within sticky window — keep showing the alerted areas
          setAlertAreas(Array.from(stickyRef.current.keys()));
          // Don't downgrade severity; keep whatever was last active
        } else {
          setAlertAreas([]);
          setAlertSeverity('none');
          setAlertTitle(null);
        }
      }

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

  // Fetch once on mount, then poll every 10 seconds automatically.
  // This ensures the app catches alerts that start after the page loads.
  useEffect(() => {
    refresh();

    const interval = setInterval(() => {
      refresh();
    }, 10_000);

    return () => clearInterval(interval);
  }, [refresh]);

  return { alertAreas, alertSeverity, alertTitle, loading, error, lastFetched, refresh };
}
