'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { parseSpreadsheetId } from '@/lib/sheetsApi';
import type { AttendeeMapping } from '@/types';

interface Props {
  onLoaded: (mappings: AttendeeMapping[]) => void;
}

/** All scopes needed when the user wants to connect a Google Sheet */
const FULL_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
].join(' ');

type Status = 'idle' | 'loading' | 'success' | 'error' | 'needs_auth';

export default function SheetConnector({ onLoaded }: Props) {
  const [input, setInput]     = useState('');
  const [status, setStatus]   = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleConnect = async () => {
    const spreadsheetId = parseSpreadsheetId(input);
    if (!spreadsheetId) {
      setStatus('error');
      setMessage('Could not extract a spreadsheet ID. Paste the full URL or the bare ID.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      // Token stays server-side — call our proxy route
      const res = await fetch(`/api/sheets?id=${encodeURIComponent(input.trim())}`);

      if (res.status === 401) {
        const data = await res.json();
        if (data.error === 'needs_auth') {
          setStatus('needs_auth');
        } else {
          setStatus('error');
          setMessage('Session expired — please sign out and sign in again.');
        }
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setStatus('error');
        setMessage(data.error || `Error ${res.status}`);
        return;
      }

      const data: { mappings: AttendeeMapping[] } = await res.json();
      if (data.mappings.length === 0) {
        setStatus('error');
        setMessage('Sheet loaded but no valid rows found. Columns must be: Name, Email, Area.');
        return;
      }

      onLoaded(data.mappings);
      setStatus('success');
      setMessage(`Loaded ${data.mappings.length} mapping${data.mappings.length !== 1 ? 's' : ''}.`);
    } catch {
      setStatus('error');
      setMessage('Failed to load sheet. Check your connection.');
    }
  };

  if (status === 'needs_auth') {
    return (
      <div className="mt-4 border border-amber-200 bg-amber-50 px-3 py-3 text-sm">
        <p className="text-amber-800 font-medium mb-2">Google Sheets access needed</p>
        <p className="text-amber-700 text-xs mb-3">
          Your current sign-in doesn&apos;t include Google Sheets permission.
          Click below to grant it — you&apos;ll be taken back here immediately.
        </p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' }, { scope: FULL_SCOPES })}
          className="inline-flex items-center gap-2 bg-white border border-amber-300 text-amber-800 text-xs font-semibold px-3 py-2 hover:bg-amber-50 transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Grant Google Sheets access
        </button>
        <button onClick={() => setStatus('idle')} className="ml-2 text-xs text-amber-600 hover:underline">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && input.trim() && handleConnect()}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleConnect}
          disabled={status === 'loading' || !input.trim()}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {status === 'loading' ? 'Loading…' : 'Connect'}
        </button>
      </div>

      {status === 'success' && <p className="mt-1.5 text-sm text-green-600">{message}</p>}
      {status === 'error'   && <p className="mt-1.5 text-sm text-red-500">{message}</p>}

      <p className="mt-1.5 text-xs text-gray-400">Sheet must have columns: Name, Email, Area.</p>
    </div>
  );
}
