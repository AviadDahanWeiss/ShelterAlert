'use client';

import CsvUploader from './CsvUploader';
import SheetConnector from './SheetConnector';
import type { AttendeeMapping } from '@/types';

interface Props {
  mappings: AttendeeMapping[];
  onUpdate: (m: AttendeeMapping[]) => void;
  onReplace: (m: AttendeeMapping[]) => void;
  onClear: () => void;
}

export default function MappingManager({
  mappings,
  onUpdate,
  onReplace,
  onClear,
}: Props) {
  return (
    <section className="border-t border-gray-200 pt-8 mt-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Attendee Location Mapping</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Maps attendee emails to their Pikud HaOref alert area. Stored locally in your browser.
          </p>
        </div>
        <span className="text-sm text-gray-400 shrink-0">
          {mappings.length} {mappings.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* CSV upload — merges into existing mapping */}
      <div className="mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          From CSV file <span className="normal-case font-normal text-gray-400">(merges with existing)</span>
        </p>
        <CsvUploader onParsed={onUpdate} />
      </div>

      {/* Google Sheets — replaces entire mapping */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          From Google Sheets <span className="normal-case font-normal text-gray-400">(replaces existing)</span>
        </p>
        <SheetConnector onLoaded={onReplace} />
      </div>

      {/* Current mapping table */}
      {mappings.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Current mapping</p>
            <button
              onClick={onClear}
              className="text-xs text-red-400 hover:text-red-600 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">Area</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mappings.map((m) => (
                  <tr key={m.email} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">{m.name || '—'}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono">{m.email}</td>
                    <td className="px-3 py-2 text-gray-700">{m.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mappings.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-400">
            No mappings yet. Upload a CSV or connect a Google Sheet to get started.
          </p>
        </div>
      )}
    </section>
  );
}
