'use client';

import { useState } from 'react';
import CsvUploader from './CsvUploader';
import SheetConnector from './SheetConnector';
import type { AttendeeMapping } from '@/types';

interface Props {
  mappings: AttendeeMapping[];
  onAdd: (m: AttendeeMapping) => void;
  onEdit: (originalEmail: string, updated: AttendeeMapping) => void;
  onDelete: (email: string) => void;
  onMerge: (incoming: AttendeeMapping[]) => void;
  onReplace: (incoming: AttendeeMapping[]) => void;
  onClear: () => void;
}

// ── Inline form (used for both Add and Edit rows) ─────────────────────────────

interface RowFormProps {
  initial?: AttendeeMapping;
  onSave: (m: AttendeeMapping) => void;
  onCancel: () => void;
}

function RowForm({ initial, onSave, onCancel }: RowFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [area, setArea] = useState(initial?.area ?? '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!area.trim()) { setError('Area is required.'); return; }
    onSave({ name: name.trim(), email: email.trim(), area: area.trim() });
  };

  const inputCls = 'w-full border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white';

  return (
    <tr className="bg-blue-50">
      <td className="px-3 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className={inputCls}
          autoFocus
        />
        {/* Email shown below name on mobile (column is hidden) */}
        <input
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="email@example.com"
          type="email"
          className={`${inputCls} mt-1.5 sm:hidden`}
          disabled={!!initial}
        />
      </td>
      <td className="px-3 py-2 hidden sm:table-cell">
        <input
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="email@example.com"
          type="email"
          className={inputCls}
          disabled={!!initial} // email is the key — don't allow changing it on edit
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={area}
          onChange={(e) => { setArea(e.target.value); setError(''); }}
          placeholder="e.g. Tel Aviv"
          className={inputCls}
        />
      </td>
      <td className="px-2 sm:px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </td>
    </tr>
  );
}

// ── Delete confirmation inline ─────────────────────────────────────────────────

interface DeleteRowProps {
  mapping: AttendeeMapping;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteRow({ mapping, onConfirm, onCancel }: DeleteRowProps) {
  return (
    <tr className="bg-red-50">
      <td colSpan={3} className="px-3 py-3">
        <p className="text-sm text-red-700">
          Remove <span className="font-semibold">{mapping.name || mapping.email}</span>?
        </p>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
          >
            Remove
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type ActiveAction =
  | { type: 'add' }
  | { type: 'edit'; email: string }
  | { type: 'delete'; email: string }
  | null;

export default function AttendeeManager({
  mappings,
  onAdd,
  onEdit,
  onDelete,
  onMerge,
  onReplace,
  onClear,
}: Props) {
  const [action, setAction] = useState<ActiveAction>(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = mappings.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.area.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (m: AttendeeMapping) => {
    onAdd(m);
    setAction(null);
  };

  const handleEdit = (originalEmail: string, updated: AttendeeMapping) => {
    onEdit(originalEmail, updated);
    setAction(null);
  };

  const handleDelete = (email: string) => {
    onDelete(email);
    setAction(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-white">
        <div className="flex items-start justify-between mb-4 gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Attendees</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Map colleagues to their Pikud HaOref area. Stored in your browser only.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowImport((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
            <button
              onClick={() => { setAction({ type: 'add' }); setShowImport(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Person
            </button>
          </div>
        </div>

        {/* Import panel */}
        {showImport && (
          <div className="border border-gray-200 bg-gray-50 p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                CSV file <span className="normal-case font-normal text-gray-400">— merges with existing</span>
              </p>
              <CsvUploader onParsed={(rows) => { onMerge(rows); setShowImport(false); }} />
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Google Sheets <span className="normal-case font-normal text-gray-400">— replaces all</span>
              </p>
              <SheetConnector
                onLoaded={(rows) => { onReplace(rows); setShowImport(false); }}
              />
            </div>
            {mappings.length > 0 && (
              <div className="border-t border-gray-200 pt-3">
                <button
                  onClick={() => { onClear(); setShowImport(false); }}
                  className="text-xs text-red-400 hover:text-red-600 hover:underline"
                >
                  Clear all mappings
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        {mappings.length > 0 && (
          <div className="relative mt-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or area…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto overflow-x-auto pb-24 sm:pb-0">
        {mappings.length === 0 && action?.type !== 'add' ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-2xl">
              👥
            </div>
            <p className="text-gray-600 font-medium mb-1">No attendees yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Add people manually or import from a CSV file or Google Sheet.
            </p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Area</th>
                <th className="px-3 py-3 w-20 sm:w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {/* Add new row at top */}
              {action?.type === 'add' && (
                <RowForm
                  onSave={handleAdd}
                  onCancel={() => setAction(null)}
                />
              )}

              {filtered.map((m) => {
                if (action?.type === 'edit' && action.email === m.email) {
                  return (
                    <RowForm
                      key={m.email}
                      initial={m}
                      onSave={(updated) => handleEdit(m.email, updated)}
                      onCancel={() => setAction(null)}
                    />
                  );
                }
                if (action?.type === 'delete' && action.email === m.email) {
                  return (
                    <DeleteRow
                      key={m.email}
                      mapping={m}
                      onConfirm={() => handleDelete(m.email)}
                      onCancel={() => setAction(null)}
                    />
                  );
                }
                return (
                  <tr key={m.email} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 sm:py-3 text-sm text-gray-800 font-medium">
                      {m.name || <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-3 py-2.5 sm:py-3 text-sm text-gray-500 font-mono hidden sm:table-cell max-w-[12rem] truncate">{m.email}</td>
                    <td className="px-3 py-2.5 sm:py-3">
                      <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium">
                        {m.area}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3">
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setAction({ type: 'edit', email: m.email })}
                          className="p-2 sm:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setAction({ type: 'delete', email: m.email })}
                          className="p-2 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && search && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                    No results for &ldquo;{search}&rdquo;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      {mappings.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          {filtered.length === mappings.length
            ? `${mappings.length} ${mappings.length === 1 ? 'person' : 'people'}`
            : `${filtered.length} of ${mappings.length} shown`}
        </div>
      )}
    </div>
  );
}
