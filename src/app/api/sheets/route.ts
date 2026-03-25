/**
 * Server-side Google Sheets proxy.
 *
 * Like /api/calendar, the access token stays in the JWT cookie and is
 * never exposed to the browser.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit, getClientIp } from '@/lib/rateLimiter';
import { parseSpreadsheetId } from '@/lib/sheetsApi';
import type { AttendeeMapping } from '@/types';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const TIMEOUT_MS = 10_000;

export async function GET(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 10)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const jwt = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawId = req.nextUrl.searchParams.get('id') ?? '';
  const spreadsheetId = parseSpreadsheetId(rawId);

  if (!spreadsheetId) {
    return NextResponse.json({ error: 'Invalid spreadsheet ID' }, { status: 400 });
  }

  const range = 'Sheet1!A:C';
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 401) return NextResponse.json({ error: 'needs_auth' }, { status: 401 });
    if (res.status === 403) return NextResponse.json({ error: 'FORBIDDEN — check sheet sharing permissions' }, { status: 403 });
    if (res.status === 404) return NextResponse.json({ error: 'Sheet not found — check the ID or URL' }, { status: 404 });
    if (!res.ok) return NextResponse.json({ error: `Sheets API error: ${res.status}` }, { status: 502 });

    const json = await res.json();
    const rows: string[][] = json.values ?? [];

    const mappings: AttendeeMapping[] = rows.slice(1).reduce<AttendeeMapping[]>((acc, row) => {
      const [name, email, area] = row;
      if (email?.trim() && area?.trim()) {
        acc.push({ name: name?.trim() ?? '', email: email.toLowerCase().trim(), area: area.trim() });
      }
      return acc;
    }, []);

    return NextResponse.json({ mappings });
  } catch (err: unknown) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'Request timed out — try again' : 'Failed to reach Google Sheets' },
      { status: 502 }
    );
  }
}
