'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { CalendarEvent } from '@/types';

const AUTO_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  refresh: () => Promise<void>;
}

export function useCalendarEvents(): UseCalendarEventsReturn {
  const { status } = useSession();
  const [events, setEvents]           = useState<CalendarEvent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The access token stays on the server — we call our own proxy route
      const res = await fetch('/api/calendar');
      if (res.status === 401) {
        setError('Session expired. Please sign out and sign in again.');
        return;
      }
      if (!res.ok) {
        setError('Could not load calendar events. Check your connection and try again.');
        return;
      }
      const data: { items: CalendarEvent[]; error?: string } = await res.json();
      if (data.error === 'UNAUTHORIZED') {
        setError('Session expired. Please sign out and sign in again.');
        return;
      }
      setEvents(data.items ?? []);
      setLastFetched(new Date());
    } catch {
      setError('Could not load calendar events. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch once the session is ready
  useEffect(() => {
    if (status !== 'authenticated') {
      if (status === 'unauthenticated') setLoading(false);
      return;
    }
    refresh();
  }, [status, refresh]);

  // 30-minute auto-refresh
  useEffect(() => {
    if (status !== 'authenticated') return;
    const interval = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [status, refresh]);

  return { events, loading, error, lastFetched, refresh };
}
