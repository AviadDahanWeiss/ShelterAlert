import type { CalendarEvent } from '@/types';

const BASE = 'https://www.googleapis.com/calendar/v3';

/** Fetch all events from the user's primary calendar for today (midnight → 23:59:59). */
export async function fetchTodaysEvents(
  accessToken: string
): Promise<CalendarEvent[]> {
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const params = new URLSearchParams({
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const res = await fetch(
    `${BASE}/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);

  const json = await res.json();
  // Filter out all-day events (they have `date` not `dateTime`)
  return ((json.items as CalendarEvent[]) ?? []).filter(
    (e) => !!e.start?.dateTime
  );
}
