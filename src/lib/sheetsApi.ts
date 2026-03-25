import type { AttendeeMapping } from '@/types';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Fetch rows from a Google Sheet and parse them as AttendeeMapping records.
 * Expected column layout (row 1 = headers): Name | Email | Area
 */
export async function fetchSheetMappings(
  accessToken: string,
  spreadsheetId: string,
  range = 'Sheet1!A:C'
): Promise<AttendeeMapping[]> {
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (res.status === 403) throw new Error('FORBIDDEN — check sheet sharing permissions');
  if (res.status === 404) throw new Error('Sheet not found — check the ID or URL');
  if (!res.ok) throw new Error(`Sheets API error: ${res.status}`);

  const json = await res.json();
  const rows: string[][] = json.values ?? [];

  // Row 0 is the header; skip it
  return rows.slice(1).reduce<AttendeeMapping[]>((acc, row) => {
    const [name, email, area] = row;
    if (email?.trim() && area?.trim()) {
      acc.push({
        name: name?.trim() ?? '',
        email: email.toLowerCase().trim(),
        area: area.trim(),
      });
    }
    return acc;
  }, []);
}

/**
 * Accept either a full Google Sheets URL or a bare spreadsheet ID.
 * Returns the extracted ID, or null if the input cannot be parsed.
 */
export function parseSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();

  // Full URL — extract the ID segment
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) return urlMatch[1];

  // Bare ID (alphanumeric + hyphens/underscores, reasonable length)
  if (/^[a-zA-Z0-9-_]{20,80}$/.test(trimmed)) return trimmed;

  return null;
}
