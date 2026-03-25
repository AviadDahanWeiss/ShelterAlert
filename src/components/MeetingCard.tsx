'use client';

import { useState } from 'react';
import type { AttendeeWithStatus, AttendeeMapping, MeetingWithSafety } from '@/types';
import SafetyBadge from './SafetyBadge';
import AttendeeRow from './AttendeeRow';
import AttendeeQuickEdit from './AttendeeQuickEdit';

interface Props {
  meeting: MeetingWithSafety;
  mappings: AttendeeMapping[];
  onAddOrUpdateMapping: (m: AttendeeMapping) => void;
}

function fmt24(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function MeetingCard({ meeting, mappings, onAddOrUpdateMapping }: Props) {
  const { event, attendees, summary } = meeting;
  const [expanded, setExpanded] = useState(summary.inShelterCount > 0);
  const [quickEditAttendee, setQuickEditAttendee] = useState<AttendeeWithStatus | null>(null);

  const start = fmt24(event.start.dateTime);
  const end = fmt24(event.end.dateTime);

  // Derive timezone abbreviation from the event's timeZone field or the browser
  const timeZone =
    event.start.timeZone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzAbbr = new Intl.DateTimeFormat('en', {
    timeZone,
    timeZoneName: 'short',
  })
    .formatToParts(new Date(event.start.dateTime))
    .find((p) => p.type === 'timeZoneName')?.value ?? timeZone;

  const durationMs =
    new Date(event.end.dateTime).getTime() -
    new Date(event.start.dateTime).getTime();
  const durationMin = Math.round(durationMs / 60000);
  const durationLabel =
    durationMin < 60
      ? `${durationMin}m`
      : `${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}m` : ''}`;

  const sortedAttendees = [...attendees].sort((a, b) => {
    const order: Record<string, number> = { 'In Shelter': 0, 'Pre-Alert': 1, 'Location Unknown': 2, Safe: 3 };
    return order[a.status] - order[b.status];
  });

  const isAlert = summary.inShelterCount > 0;
  const isWarning = !isAlert && (summary.preAlertCount > 0 || summary.unknownCount > 0);

  const selectedMapping = quickEditAttendee
    ? mappings.find((m) => m.email === quickEditAttendee.email.toLowerCase()) ?? null
    : null;

  return (
    <>
      <div
        className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
          isAlert ? 'border-red-200' : isWarning ? 'border-yellow-200' : 'border-gray-100'
        }`}
      >
        {/* Accent bar */}
        <div
          className={`h-1 w-full ${
            isAlert ? 'bg-red-400' : isWarning ? 'bg-yellow-400' : 'bg-emerald-400'
          }`}
        />

        {/* Clickable header */}
        <button
          className="w-full text-left px-4 py-3.5 flex items-center gap-3"
          onClick={() => setExpanded((v) => !v)}
        >
          {/* Time column */}
          <div className="shrink-0 text-center w-16">
            <p className="text-sm font-semibold text-gray-800 leading-tight tabular-nums">{start}</p>
            <p className="text-xs text-gray-400 leading-tight">{durationLabel}</p>
            <p className="text-xs text-gray-300 leading-tight">{tzAbbr}</p>
          </div>

          <div className="w-px self-stretch bg-gray-100 shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {event.summary ?? '(No title)'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
              {start} – {end} · {tzAbbr}
              {attendees.length > 0 && (
                <>
                  <span className="mx-1.5">·</span>
                  {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <SafetyBadge summary={summary} />
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Expandable attendee list */}
        {expanded && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2">
            {attendees.length === 0 ? (
              <p className="text-sm text-gray-400 py-2 text-center">No attendees.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sortedAttendees.map((a) => (
                  <AttendeeRow
                    key={a.email}
                    attendee={a}
                    onClick={() => setQuickEditAttendee(a)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Quick edit modal */}
      {quickEditAttendee && (
        <AttendeeQuickEdit
          attendee={quickEditAttendee}
          existingMapping={selectedMapping}
          onSave={(m) => {
            onAddOrUpdateMapping(m);
            setQuickEditAttendee(null);
          }}
          onClose={() => setQuickEditAttendee(null)}
        />
      )}
    </>
  );
}
