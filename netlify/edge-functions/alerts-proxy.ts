/**
 * Netlify Edge Function — runs on Deno Deploy's global CDN.
 *
 * Because this executes at an edge node geographically close to the user
 * (Frankfurt / Tel Aviv PoP for Israeli users), the outbound request to
 * oref.org.il originates from a non-US IP and is not geo-blocked.
 *
 * This function intercepts GET /api/alerts before it reaches the Next.js
 * server-side handler (which runs in US-east-2 and is geo-blocked).
 */

import type { Config } from '@netlify/edge-functions';

const OREF_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';
const TIMEOUT_MS = 8000;

const ACTIVE_CATS   = new Set(['1', '2', '9', '13']);
const PRE_ALERT_CATS = new Set(['101', '102']);
const ENDED_CATS    = new Set(['103', '104']);

function classifySeverity(cat: string | null, title: string | null): string {
  const c = cat?.trim() ?? '';
  const t = (title ?? '').trim();
  if (ENDED_CATS.has(c) || t.includes('הסתיים'))                                  return 'ended';
  if (PRE_ALERT_CATS.has(c) || t.includes('צפוי') || t.includes('בדקות הקרובות')) return 'pre_alert';
  if (ACTIVE_CATS.has(c))                                                           return 'active';
  if (t.includes('רקטות') || t.includes('טילים') || t.includes('כלי טיס') || t.includes('בלסטי')) return 'active';
  return 'active'; // unknown cat with data → safe side
}

function noAlert() {
  return Response.json({ data: [], severity: 'none', cat: null, title: null });
}

export default async function handler(req: Request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(OREF_URL, {
      signal: controller.signal,
      headers: {
        Referer: 'https://www.oref.org.il/',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timer);

    let text = (await res.text()).replace(/^\uFEFF/, '').trim();

    const EMPTY = new Set(['', '{}', '[]', 'null', 'undefined', 'false']);
    if (EMPTY.has(text) || text.length < 5) return noAlert();

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      if (text.startsWith('<') || text.length < 100) return noAlert();
      return noAlert();
    }

    if (!json || typeof json !== 'object' || Array.isArray(json)) return noAlert();

    const payload  = json as Record<string, unknown>;
    const cat      = (payload.cat   as string | null) ?? null;
    const title    = (payload.title as string | null) ?? null;
    const data     = Array.isArray(payload.data) ? (payload.data as string[]) : [];
    const severity = data.length === 0 ? 'none' : classifySeverity(cat, title);

    return Response.json({ data: severity === 'ended' ? [] : data, severity, cat, title });

  } catch (err: unknown) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return Response.json(
      { data: [], severity: 'none', cat: null, title: null, error: isTimeout ? 'timeout' : 'fetch_failed' },
      { status: 200 }
    );
  }
}

export const config: Config = {
  path: '/api/alerts',
};
