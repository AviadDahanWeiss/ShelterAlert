/**
 * Server-side Google Calendar proxy.
 *
 * The Google access token NEVER leaves the server — it stays in the
 * encrypted NextAuth JWT cookie and is read here via getToken().
 * The client only receives the calendar event data, not the token.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit, getClientIp } from '@/lib/rateLimiter';
import type { CalendarEvent } from '@/types';

const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
const TIMEOUT_MS = 10_000;

export async function GET(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 30)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Read the access token directly from the encrypted JWT — never exposed to the browser
  const jwt = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay   = new Date(now); endOfDay.setHours(23, 59, 59, 999);

  const params = new URLSearchParams({
    timeMin:      startOfDay.toISOString(),
    timeMax:      endOfDay.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '50',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS);

  try {
    const res = await fetch(`${CALENDAR_BASE}/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 401) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Calendar API error: ${res.status}` }, { status: 502 });
    }

    const json = await res.json();
    const items: CalendarEvent[] = ((json.items ?? []) as CalendarEvent[]).filter(
      (e) => !!e.start?.dateTime
    );

    return NextResponse.json({ items });
  } catch (err: unknown) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'timeout' : 'fetch_failed' },
      { status: 502 }
    );
  }
}
