'use client';

import { useState } from 'react';
import { fetchSheetMappings, parseSpreadsheetId } from '@/lib/sheetsApi';
import type { AttendeeMapping } from '@/types';

interface Props {
  accessToken: string;
  onLoaded: (mappings: AttendeeMapping[]) => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function SheetConnector({ accessToken, onLoaded }: Props) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleConnect = async () => {
    const spreadsheetId = parseSpreadsheetId(input);

    if (!spreadsheetId) {
      setStatus('error');
      setMessage('Could not extract a spreadsheet ID from that input. Paste the full URL or the bare ID.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const mappings = await fetchSheetMappings(accessToken, spreadsheetId);

      if (mappings.length === 0) {
        setStatus('error');
        setMessage('The sheet was loaded but no valid rows were found. Ensure columns are: Name, Email, Area.');
        return;
      }

      onLoaded(mappings);
      setStatus('success');
      setMessage(`Loaded ${mappings.length} mapping${mappings.length !== 1 ? 's' : ''} from Google Sheets.`);
    } catch (err: unknown) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Failed to load sheet.';
      setMessage(msg);
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Connect Google Sheet
        <span className="ml-1 text-xs font-normal text-gray-400">(paste URL or Sheet ID)</span>
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && input.trim() && handleConnect()}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleConnect}
          disabled={status === 'loading' || !input.trim()}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {status === 'loading' ? 'Loading…' : 'Connect'}
        </button>
      </div>

      {status === 'success' && (
        <p className="mt-1.5 text-sm text-green-600">{message}</p>
      )}
      {status === 'error' && (
        <p className="mt-1.5 text-sm text-red-500">{message}</p>
      )}

      <p className="mt-1.5 text-xs text-gray-400">
        The sheet must be accessible by your Google account and have columns: Name, Email, Area.
      </p>
    </div>
  );
}
