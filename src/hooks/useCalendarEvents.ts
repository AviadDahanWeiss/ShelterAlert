'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { fetchTodaysEvents } from '@/lib/calendarApi';
import type { CalendarEvent, ExtendedSession } from '@/types';

const AUTO_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  refresh: () => Promise<void>;
}

export function useCalendarEvents(): UseCalendarEventsReturn {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Ref so the refresh callback always reads the latest token without being recreated.
  const tokenRef = useRef<string>('');
  tokenRef.current = (session as ExtendedSession | null)?.accessToken ?? '';

  const refresh = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchTodaysEvents(token);
      setEvents(data);
      setLastFetched(new Date());
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        setError('Session expired. Please sign out and sign in again.');
      } else {
        setError('Could not load calendar events. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch once the session is ready.
  useEffect(() => {
    if (status !== 'authenticated') {
      if (status === 'unauthenticated') setLoading(false);
      return;
    }
    refresh();
  }, [status, refresh]);

  // 30-minute auto-refresh.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const interval = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [status, refresh]);

  return { events, loading, error, lastFetched, refresh };
}
