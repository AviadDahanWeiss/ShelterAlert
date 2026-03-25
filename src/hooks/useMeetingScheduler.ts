'use client';

import { useEffect, useRef } from 'react';
import type { CalendarEvent } from '@/types';

const PRE_ALERT_SECONDS = 90;

interface UseMeetingSchedulerProps {
  events: CalendarEvent[];
  /**
   * Called when we enter the 90-second pre-meeting window for a given event.
   * Typically used to trigger an alert refresh.
   */
  onTrigger: (eventId: string) => void;
}

/**
 * Sets a timer for each of today's meetings that fires exactly 90 seconds before
 * the meeting starts. If we're already inside the 90-second window when this hook
 * runs, the trigger fires immediately. Events that have already started are skipped.
 *
 * All timers are cleared and re-created whenever `events` changes.
 */
export function useMeetingScheduler({
  events,
  onTrigger,
}: UseMeetingSchedulerProps): void {
  // Use a ref so the cleanup function always has access to the current timer map.
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  useEffect(() => {
    // Clear any previously scheduled timers.
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();

    const now = Date.now();

    events.forEach((event) => {
      const startMs = new Date(event.start.dateTime).getTime();
      const triggerMs = startMs - PRE_ALERT_SECONDS * 1000;
      const delay = triggerMs - now;

      if (delay > 0) {
        // Meeting hasn't started and we're more than 90 s away → schedule.
        const timer = setTimeout(() => onTrigger(event.id), delay);
        timersRef.current.set(event.id, timer);
      } else if (now < startMs) {
        // We're inside the 90-second window but the meeting hasn't started → fire immediately.
        onTrigger(event.id);
      }
      // Meeting already started → do nothing.
    });

    // Capture the map reference so the cleanup uses the same object even if the ref changes.
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]); // onTrigger is intentionally excluded — see note below.
  // NOTE: onTrigger is excluded from deps to prevent re-scheduling on every render.
  // The dashboard memoises the callback with useCallback so its identity is stable.
}
