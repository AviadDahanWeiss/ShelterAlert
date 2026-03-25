'use client';

import { useEffect, useRef, useState } from 'react';
import type { AttendeeMapping, AttendeeWithStatus } from '@/types';

interface Props {
  /** The attendee as seen in the calendar event */
  attendee: AttendeeWithStatus;
  /** Existing mapping for this email, if any */
  existingMapping: AttendeeMapping | null;
  onSave: (mapping: AttendeeMapping) => void;
  onClose: () => void;
}

export default function AttendeeQuickEdit({
  attendee,
  existingMapping,
  onSave,
  onClose,
}: Props) {
  const isNew = existingMapping === null;

  const [name, setName] = useState(
    existingMapping?.name ?? attendee.name ?? ''
  );
  const [area, setArea] = useState(existingMapping?.area ?? '');
  const [error, setError] = useState('');

  const areaRef = useRef<HTMLInputElement>(null);

  // Focus area input on open
  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = () => {
    if (!area.trim()) {
      setError('Area is required.');
      return;
    }
    onSave({
      name: name.trim(),
      email: attendee.email.toLowerCase().trim(),
      area: area.trim(),
    });
    onClose();
  };

  const statusColors: Record<string, string> = {
    'In Shelter': 'bg-red-100 text-red-700 border-red-200',
    'Location Unknown': 'bg-gray-100 text-gray-600 border-gray-200',
    Safe: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-base shrink-0">
                {(attendee.name?.[0] ?? attendee.email[0]).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-tight">
                  {attendee.name || attendee.email}
                </p>
                <p className="text-xs text-gray-400 font-mono truncate">{attendee.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0 ml-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Current status badge */}
          <div className="mt-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                statusColors[attendee.status]
              }`}
            >
              {attendee.status === 'In Shelter' && '🚨 '}
              {attendee.status === 'Safe' && '✓ '}
              {attendee.status}
            </span>
            {attendee.area && (
              <span className="ml-2 text-xs text-gray-400">in {attendee.area}</span>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          {isNew && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-sm text-blue-700 flex items-start gap-2">
              <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Not in your attendee list yet. Add them to track their safety status.</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Email — read only */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Email <span className="font-normal text-gray-400">(cannot be changed)</span>
            </label>
            <div className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 font-mono truncate">
              {attendee.email}
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Pikud HaOref area <span className="text-red-400">*</span>
            </label>
            <input
              ref={areaRef}
              type="text"
              value={area}
              onChange={(e) => { setArea(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Tel Aviv, Be'er Sheva, Ashkelon"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            <p className="text-xs text-gray-400 mt-1">
              Must match the area name used in Pikud HaOref alerts.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            {isNew ? 'Add to attendees' : 'Save changes'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
