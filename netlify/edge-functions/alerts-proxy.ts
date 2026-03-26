/**
 * Netlify Edge Function — runs on Deno Deploy's global CDN.
 *
 * Because this executes at an edge node geographically close to the user
 * (Frankfurt / Tel Aviv PoP for Israeli users), the outbound request to
 * oref.org.il originates from a non-US IP and is not geo-blocked.
 *
 * Strategy (based on popular Pikud HaOref open-source clients):
 *  1. Fetch the live alerts endpoint with cache-busting timestamp.
 *  2. If the live endpoint returns empty / "Access Denied" (geo-block signal),
 *     fall back to the alerts-history subdomain and treat items from the last
 *     3 minutes as an active alert.
 */

import type { Config } from '@netlify/edge-functions';

// Live alert — only active during the ~90-second siren window
const OREF_LIVE_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';

// History — different subdomain, returns last ~24h of alerts; may bypass geo-block
const OREF_HISTORY_URL = 'https://alerts-history.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx?lang=he&mode=1';

const TIMEOUT_MS = 8000;

// How recent a history entry must be to count as "active" (3 min)
const HISTORY_ACTIVE_WINDOW_MS = 3 * 60 * 1000;

const OREF_HEADERS = {
  Referer: 'https://www.oref.org.il/',
  'X-Requested-With': 'XMLHttpRequest',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'he,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const ACTIVE_CATS    = new Set(['1', '2', '9', '13']);
const PRE_ALERT_CATS = new Set(['101', '102']);
const ENDED_CATS     = new Set(['103', '104']);

function classifySeverity(cat: string | null | number, title: string | null): string {
  const c = String(cat ?? '').trim();
  const t = (title ?? '').trim();
  if (ENDED_CATS.has(c) || t.includes('הסתיים'))                                   return 'ended';
  if (PRE_ALERT_CATS.has(c) || t.includes('צפוי') || t.includes('בדקות הקרובות')) return 'pre_alert';
  if (ACTIVE_CATS.has(c))                                                            return 'active';
  if (t.includes('רקטות') || t.includes('טילים') || t.includes('כלי טיס') || t.includes('בלסטי')) return 'active';
  return 'active'; // unknown category with data → err on the safe side
}

function noAlert() {
  return Response.json({ data: [], severity: 'none', cat: null, title: null });
}

function stripBom(text: string): string {
  // Remove UTF-8 BOM (U+FEFF) and NUL bytes that oref.org.il sometimes sends
  return text.replace(/^\uFEFF/, '').replace(/\x00/g, '').trim();
}

/** Fetch the live alerts endpoint. Returns null if empty / blocked / error. */
async function fetchLive(): Promise<{ data: string[]; cat: string | null; title: string | null; severity: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Cache-bust with timestamp (eladnava/pikud-haoref-api technique)
    const res = await fetch(`${OREF_LIVE_URL}?${Date.now()}`, {
      signal: controller.signal,
      headers: OREF_HEADERS,
    });
    clearTimeout(timer);

    const text = stripBom(await res.text());

    // Detect geo-block ("Access Denied" HTML page)
    if (text.includes('Access Denied') || text.includes('access denied')) return null;

    const EMPTY = new Set(['', '{}', '[]', 'null', 'undefined', 'false']);
    if (EMPTY.has(text) || text.length < 5) return null;

    let json: unknown;
    try { json = JSON.parse(text); } catch { return null; }

    if (!json || typeof json !== 'object' || Array.isArray(json)) return null;

    const payload = json as Record<string, unknown>;
    const cat     = (payload.cat   as string | null) ?? null;
    const title   = (payload.title as string | null) ?? null;
    const data    = Array.isArray(payload.data) ? (payload.data as string[]) : [];

    if (data.length === 0) return null;

    const severity = classifySeverity(cat, title);
    return { data, cat, title, severity };

  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Fallback: fetch the alerts-history endpoint and treat any entry from the
 * last HISTORY_ACTIVE_WINDOW_MS milliseconds as an active alert.
 *
 * History item format: { alertDate: "2024-01-01 10:00:00", data: "city",
 *                        category: 1, title: "ירי רקטות וטילים" }
 */
async function fetchHistory(): Promise<{ data: string[]; cat: string | null; title: string | null; severity: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(OREF_HISTORY_URL, {
      signal: controller.signal,
      headers: OREF_HEADERS,
    });
    clearTimeout(timer);

    const text = stripBom(await res.text());
    if (!text || text.length < 5) return null;

    let items: unknown;
    try { items = JSON.parse(text); } catch { return null; }

    if (!Array.isArray(items)) return null;

    const now = Date.now();
    const recent: string[] = [];
    let cat: string | null = null;
    let title: string | null = null;

    for (const item of items as Record<string, unknown>[]) {
      const dateStr = item.alertDate as string | undefined;
      if (!dateStr) continue;

      // alertDate is in Israel time (UTC+3 / UTC+2 DST), no timezone suffix
      const alertMs = new Date(dateStr.replace(' ', 'T') + '+03:00').getTime();
      if (isNaN(alertMs)) continue;

      if (now - alertMs <= HISTORY_ACTIVE_WINDOW_MS) {
        const city = item.data as string | undefined;
        if (city && !city.includes('בדיקה')) { // skip test alerts
          recent.push(city);
          if (!cat) cat = String(item.category ?? '');
          if (!title) title = (item.title as string | undefined) ?? null;
        }
      }
    }

    if (recent.length === 0) return null;

    const severity = classifySeverity(cat, title);
    return { data: Array.from(new Set(recent)), cat, title, severity };

  } catch {
    clearTimeout(timer);
    return null;
  }
}

export default async function handler(req: Request) {
  // Try live endpoint first; fall back to history if empty/blocked
  const [live, history] = await Promise.all([fetchLive(), fetchHistory()]);
  const result = live ?? history;

  if (!result) return noAlert();

  return Response.json({
    data: result.severity === 'ended' ? [] : result.data,
    severity: result.severity,
    cat: result.cat,
    title: result.title,
  });
}

export const config: Config = {
  path: '/api/alerts',
};
