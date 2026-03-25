import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit, getClientIp } from '@/lib/rateLimiter';
import type { AreaAlertStats, AlertHistoryMap } from '@/types';

const HISTORY_BASE = 'https://www.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx';
// Fallback endpoint sometimes used by the official site
const HISTORY_BASE_ALT = 'https://alerts-history.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx';

interface OrefHistoryItem {
  rid: number;          // unique item ID — used for deduplication
  data: string;         // area name (Hebrew)
  alertDate: string;    // ISO local time "2026-03-25T11:06:00" (no timezone suffix)
  category: number;
  category_desc: string; // Hebrew description e.g. "ירי רקטות וטילים", "האירוע הסתיים"
}

// category_desc-based classification (primary signal — more reliable than category number)
const ENDED_KEYWORDS    = ['הסתיים'];
const MISSILE_KEYWORDS  = ['רקטות', 'טילים', 'בלסטי', 'טיל'];
const AIRCRAFT_KEYWORDS = ['כלי טיס', 'מטוס', 'מסוק', 'רחפן'];

// category number fallbacks (only when category_desc is empty/missing)
const MISSILE_CATS_FALLBACK  = new Set([1]);
const AIRCRAFT_CATS_FALLBACK = new Set([2]);
const ENDED_CATS_FALLBACK    = new Set([13]);

type AlertKind = 'missile' | 'aircraft' | 'ended' | 'other';

function classifyItem(item: OrefHistoryItem): AlertKind {
  const desc = (item.category_desc ?? '').trim();
  if (desc) {
    if (ENDED_KEYWORDS.some((k) => desc.includes(k)))    return 'ended';
    if (AIRCRAFT_KEYWORDS.some((k) => desc.includes(k))) return 'aircraft';
    if (MISSILE_KEYWORDS.some((k) => desc.includes(k)))  return 'missile';
  }
  if (ENDED_CATS_FALLBACK.has(item.category))    return 'ended';
  if (AIRCRAFT_CATS_FALLBACK.has(item.category)) return 'aircraft';
  if (MISSILE_CATS_FALLBACK.has(item.category))  return 'missile';
  return 'other';
}

function getHour(alertDate: string): number {
  // Handles both "2026-03-25T11:06:00" (ISO) and legacy "2026-03-25 11:06:00"
  const sep = alertDate.includes('T') ? 'T' : ' ';
  return parseInt(alertDate.split(sep)[1]?.split(':')[0] ?? '0', 10);
}

function isNight(alertDate: string): boolean {
  const h = getHour(alertDate);
  return h >= 23 || h < 6;
}

const HEADERS = {
  Referer: 'https://www.oref.org.il/',
  Origin: 'https://www.oref.org.il',
  'X-Requested-With': 'XMLHttpRequest',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

async function tryFetch(
  url: string,
  signal: AbortSignal
): Promise<{ raw: string; items: OrefHistoryItem[]; url: string; status: number }> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal, cache: 'no-store' });
    const raw = await res.text();
    const cleaned = raw.replace(/^\uFEFF/, '').trim();
    let items: OrefHistoryItem[] = [];
    if (cleaned && cleaned !== 'null' && cleaned !== '[]' && cleaned !== '') {
      try {
        const parsed = JSON.parse(cleaned);
        items = Array.isArray(parsed) ? parsed : [];
      } catch {
        // not JSON — raw preview will show what came back
      }
    }
    return { raw: cleaned.slice(0, 500), items, url, status: res.status };
  } catch (e) {
    return { raw: String(e), items: [], url, status: 0 };
  }
}

async function fetchMode(
  mode: number,
  signal: AbortSignal
): Promise<{ raw: string; items: OrefHistoryItem[]; url: string; status: number }> {
  const primary = await tryFetch(`${HISTORY_BASE}?lang=he&mode=${mode}`, signal);
  // If primary returned no items (connection error or empty), try the alternate domain
  if (primary.items.length === 0 && primary.status !== 200) {
    const alt = await tryFetch(`${HISTORY_BASE_ALT}?lang=he&mode=${mode}`, signal);
    if (alt.items.length > 0) return alt;
  }
  return primary;
}

/** alertDate from Oref is local Israeli time with no timezone suffix.
 *  Format: "2026-03-25T11:06:00" or legacy "2026-03-25 11:06:00".
 *  Append +02:00 (IST) — a 1-hour DST error is irrelevant for a 24h filter window.
 */
function parseAlertTs(alertDate: string): number {
  const iso = alertDate.replace(' ', 'T');
  return new Date(iso + '+02:00').getTime();
}

export async function GET(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 10)) {        // 10 req/min per IP (history is expensive)
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const debug = req.nextUrl.searchParams.get('debug') === '1';

  // Debug endpoint exposes internal API details — require authentication
  if (debug) {
    const jwt = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!jwt) {
      return NextResponse.json({ error: 'Unauthorized — sign in to use debug mode' }, { status: 401 });
    }
  }
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 15000);

  try {
    const [r0, r1] = await Promise.all([
      fetchMode(0, ctrl.signal),
      fetchMode(1, ctrl.signal),
    ]);
    clearTimeout(timeout);

    // Deduplicate by rid — mode=0 and mode=1 can return overlapping items
    const seenRids = new Set<number>();
    const allItems: OrefHistoryItem[] = [];
    for (const item of [...r0.items, ...r1.items]) {
      if (item.rid != null && seenRids.has(item.rid)) continue;
      if (item.rid != null) seenRids.add(item.rid);
      allItems.push(item);
    }

    const since = Date.now() - 24 * 60 * 60 * 1000;

    if (debug) {
      console.log('[alert-history debug] mode=0 url:', r0.url, 'status:', r0.status, 'items:', r0.items.length);
      console.log('[alert-history debug] mode=1 url:', r1.url, 'status:', r1.status, 'items:', r1.items.length);
      // Build category+title breakdown for all items (not time-filtered)
      const breakdown: Record<string, { count: number; sample: string; kind: string }> = {};
      for (const item of allItems) {
        const key = `cat:${item.category} | "${item.category_desc}"`;
        if (!breakdown[key]) breakdown[key] = { count: 0, sample: item.data, kind: classifyItem(item) };
        breakdown[key].count++;
      }
      const inWindow = allItems.filter((item) => {
        const ts = parseAlertTs(item.alertDate);
        return !isNaN(ts) && ts >= since;
      });
      return NextResponse.json({
        serverTime: new Date().toISOString(),
        sinceISO: new Date(since).toISOString(),
        totalItems: allItems.length,
        itemsIn24h: inWindow.length,
        categoryTitleBreakdown: breakdown,
        mode0: { url: r0.url, status: r0.status, itemCount: r0.items.length, rawPreview: r0.raw.slice(0, 1000), firstItem: r0.items[0] ?? null },
        mode1: { url: r1.url, status: r1.status, itemCount: r1.items.length, rawPreview: r1.raw.slice(0, 1000), firstItem: r1.items[0] ?? null },
      });
    }

    if (allItems.length === 0) {
      return NextResponse.json({} as AlertHistoryMap);
    }

    const map: AlertHistoryMap = {};

    for (const item of allItems) {
      if (!item.data || !item.alertDate) continue;
      const ts = parseAlertTs(item.alertDate);
      if (isNaN(ts) || ts < since) continue;

      const area = item.data.trim();
      if (!map[area]) map[area] = { missiles: 0, aircraft: 0, nightMissiles: 0, nightAircraft: 0 };

      const stats: AreaAlertStats = map[area];
      const night = isNight(item.alertDate);
      const kind = classifyItem(item);
      if (kind === 'ended') continue; // all-clear events — don't count
      if (kind === 'missile') { stats.missiles++; if (night) stats.nightMissiles++; }
      else if (kind === 'aircraft') { stats.aircraft++; if (night) stats.nightAircraft++; }
    }

    return NextResponse.json(map);
  } catch (err) {
    clearTimeout(timeout);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.error('[alert-history] error:', err);
    return NextResponse.json({ error: isTimeout ? 'timeout' : 'fetch_failed' });
  }
}
