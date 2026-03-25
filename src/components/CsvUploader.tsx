'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import type { AttendeeMapping } from '@/types';

interface Props {
  onParsed: (mappings: AttendeeMapping[]) => void;
}

interface CsvRow {
  Name?: string;
  Email?: string;
  Area?: string;
  // Handle lowercase variants too
  name?: string;
  email?: string;
  area?: string;
}

export default function CsvUploader({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFile = (file: File) => {
    setStatus('idle');
    setMessage('');

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const mappings: AttendeeMapping[] = results.data
          .map((row) => ({
            name: (row.Name ?? row.name ?? '').trim(),
            email: (row.Email ?? row.email ?? '').toLowerCase().trim(),
            area: (row.Area ?? row.area ?? '').trim(),
          }))
          .filter((m) => m.email && m.area);

        if (mappings.length === 0) {
          setStatus('error');
          setMessage('No valid rows found. Make sure the CSV has Name, Email, and Area columns.');
          return;
        }

        onParsed(mappings);
        setStatus('success');
        setMessage(`Loaded ${mappings.length} mapping${mappings.length !== 1 ? 's' : ''} from CSV.`);
      },
      error: () => {
        setStatus('error');
        setMessage('Failed to parse the CSV file. Please check the format.');
      },
    });
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so the same file can be re-selected.
          e.target.value = '';
        }}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload CSV
        </button>
        <a
          href="/template.csv"
          download="shelteralert-template.csv"
          className="text-sm text-blue-500 hover:text-blue-700 underline underline-offset-2"
        >
          Download template
        </a>
      </div>

      {status === 'success' && (
        <p className="mt-2 text-sm text-green-600">{message}</p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-500">{message}</p>
      )}
    </div>
  );
}
