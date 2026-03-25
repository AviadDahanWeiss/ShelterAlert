import { NextResponse } from 'next/server';
import type { AlertSeverity, AlertsPayload } from '@/types';

const OREF_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';
const TIMEOUT_MS = 8000;

/**
 * Determine alert severity from the Pikud HaOref `cat` (category) and `title` fields.
 *
 * Active RED categories (confirmed by Pikud HaOref protocol):
 *   1  = ירי רקטות וטילים  (Rocket and Missile Attacks)
 *   2  = חדירת כלי טיס עוין (Hostile Aircraft Intrusion)
 *   9  = טיל בלסטי          (Ballistic Missile)
 *   13 = טיל בלסטי
 *
 * Pre-alert YELLOW (advance warning — "expected in your area in a few minutes"):
 *   101 = בדקות הקרובות צפוי ירי רקטות
 *
 * Ended / all-clear (removes affected areas from active state):
 *   103 = האירוע הסתיים
 */
const ACTIVE_CATS = new Set(['1', '2', '9', '13']);
const PRE_ALERT_CATS = new Set(['101', '102']);
const ENDED_CATS = new Set(['103', '104']);

function classifySeverity(cat: string | null, title: string | null): AlertSeverity {
  const c = cat?.trim() ?? '';
  const t = (title ?? '').trim();

  if (ENDED_CATS.has(c) || t.includes('הסתיים')) return 'ended';
  if (PRE_ALERT_CATS.has(c) || t.includes('צפוי') || t.includes('בדקות הקרובות')) return 'pre_alert';
  if (ACTIVE_CATS.has(c)) return 'active';

  // Fallback: classify by known title keywords for robustness
  if (
    t.includes('רקטות') ||
    t.includes('טילים') ||
    t.includes('כלי טיס') ||
    t.includes('בלסטי')
  ) return 'active';

  // Unknown category with data → treat as active to be safe
  return 'active';
}

export async function GET() {
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    controller = new AbortController();
    timer = setTimeout(() => controller!.abort('timeout'), TIMEOUT_MS);

    const res = await fetch(OREF_URL, {
      signal: controller.signal,
      headers: {
        Referer: 'https://www.oref.org.il/',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    clearTimeout(timer);
    timer = null;

    let text = (await res.text()).replace(/^\uFEFF/, '').trim();

    if (!text || text === '{}' || text === '[]') {
      return NextResponse.json({ data: [], severity: 'none', cat: null, title: null } satisfies AlertsPayload);
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      console.error('[/api/alerts] JSON parse error, raw:', text.slice(0, 200));
      return NextResponse.json({ data: [], severity: 'none', cat: null, title: null, parseError: true } satisfies AlertsPayload);
    }

    const payload = json as Record<string, unknown>;
    const cat = (payload.cat as string | null) ?? null;
    const title = (payload.title as string | null) ?? null;
    const data = Array.isArray(payload.data) ? (payload.data as string[]) : [];
    const severity = data.length === 0 ? 'none' : classifySeverity(cat, title);

    // "ended" means these areas are NOW CLEAR — return them with severity so client knows to clear
    const response: AlertsPayload = { data: severity === 'ended' ? [] : data, severity, cat, title };
    return NextResponse.json(response);

  } catch (err: unknown) {
    if (timer) clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.error(`[/api/alerts] ${isTimeout ? 'TIMEOUT' : 'fetch error'}:`, err);
    return NextResponse.json(
      { data: [], severity: 'none', cat: null, title: null, error: isTimeout ? 'timeout' : 'fetch_failed' } satisfies AlertsPayload,
      { status: 200 }
    );
  }
}
