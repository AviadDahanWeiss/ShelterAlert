'use client';

import { useState, useCallback } from 'react';
import type { CalendarEvent } from '@/types';
import { getDemoEvents } from '@/lib/demoData';

const STORAGE_KEY = 'shelter_manual_meetings';

function load(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CalendarEvent[];
    // First visit — seed with demo events so there's something to look at
    const seed = getDemoEvents();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch {
    return getDemoEvents();
  }
}

function persist(meetings: CalendarEvent[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings)); } catch { /* ignore */ }
}

export function useManualMeetings() {
  const [meetings, setMeetings] = useState<CalendarEvent[]>(load);

  const addMeeting = useCallback((m: CalendarEvent) => {
    setMeetings(prev => {
      const next = [...prev, m];
      persist(next);
      return next;
    });
  }, []);

  const editMeeting = useCallback((id: string, updated: CalendarEvent) => {
    setMeetings(prev => {
      const next = prev.map(m => m.id === id ? { ...updated, id } : m);
      persist(next);
      return next;
    });
  }, []);

  const deleteMeeting = useCallback((id: string) => {
    setMeetings(prev => {
      const next = prev.filter(m => m.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { meetings, addMeeting, editMeeting, deleteMeeting };
}
