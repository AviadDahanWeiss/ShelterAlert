'use client';

import { useState } from 'react';
import type { AttendeeWithStatus, AttendeeMapping, MeetingWithSafety, MeetingStatus } from '@/types';
import SafetyBadge from './SafetyBadge';
import AttendeeRow from './AttendeeRow';
import AttendeeQuickEdit from './AttendeeQuickEdit';

interface Props {
  meeting: MeetingWithSafety;
  mappings: AttendeeMapping[];
  onAddOrUpdateMapping: (m: AttendeeMapping) => void;
  status?: MeetingStatus;
}

function fmt24(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function MeetingCard({ meeting, mappings, onAddOrUpdateMapping, status = 'future' }: Props) {
  const { event, attendees, summary } = meeting;
  const [expanded, setExpanded] = useState(summary.inShelterCount > 0);
  const [quickEditAttendee, setQuickEditAttendee] = useState<AttendeeWithStatus | null>(null);

  const start = fmt24(event.start.dateTime);
  const end = fmt24(event.end.dateTime);

  const timeZone = event.start.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzAbbr = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'short' })
    .formatToParts(new Date(event.start.dateTime))
    .find((p) => p.type === 'timeZoneName')?.value ?? timeZone;

  const durationMs = new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime();
  const durationMin = Math.round(durationMs / 60000);
  const durationLabel =
    durationMin < 60 ? `${durationMin}m` : `${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}m` : ''}`;

  const sortedAttendees = [...attendees].sort((a, b) => {
    const order: Record<string, number> = { 'In Shelter': 0, 'Pre-Alert': 1, 'Location Unknown': 2, Safe: 3 };
    return order[a.status] - order[b.status];
  });

  const isAlert = summary.inShelterCount > 0;
  const isPreAlert = !isAlert && summary.preAlertCount > 0;
  const isPast = status === 'past';
  const isCurrent = status === 'current';
  const isNext = status === 'next';

  // Left border accent colour
  const accentBorder = isAlert
    ? 'border-l-red-400'
    : isPreAlert
    ? 'border-l-amber-400'
    : isPast
    ? 'border-l-gray-200'
    : isCurrent
    ? 'border-l-blue-400'
    : isNext
    ? 'border-l-amber-300'
    : 'border-l-gray-200';

  const cardBg = isPast ? 'bg-gray-50' : 'bg-white';
  const titleCls = isPast ? 'text-gray-400' : 'text-gray-900';
  const subCls = isPast ? 'text-gray-300' : 'text-gray-400';

  const selectedMapping = quickEditAttendee
    ? mappings.find((m) => m.email === quickEditAttendee.email.toLowerCase()) ?? null
    : null;

  return (
    <>
      <div className={`border border-gray-200 border-l-4 ${accentBorder} ${cardBg} overflow-hidden`}>
        {/* Timing badge row */}
        {(isCurrent || isNext) && (
          <div className="px-4 pt-2">
            {isCurrent ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Now
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 uppercase tracking-wide">
                Next
              </span>
            )}
          </div>
        )}

        {/* Clickable header */}
        <button
          className="w-full text-left px-4 py-3 flex items-center gap-3"
          onClick={() => setExpanded((v) => !v)}
        >
          {/* Time column */}
          <div className="shrink-0 w-14 text-right">
            <p className={`text-sm font-semibold tabular-nums ${isPast ? 'text-gray-400' : 'text-gray-800'}`}>{start}</p>
            <p className={`text-[11px] tabular-nums ${subCls}`}>{durationLabel}</p>
          </div>

          <div className={`w-px self-stretch ${isPast ? 'bg-gray-200' : 'bg-gray-150'}`} style={{ backgroundColor: isPast ? '#e5e7eb' : '#f3f4f6' }} />

          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${titleCls}`}>
              {event.summary ?? '(No title)'}
            </p>
            <p className={`text-[11px] mt-0.5 tabular-nums ${subCls}`}>
              {start}–{end} · {tzAbbr}
              {attendees.length > 0 && <> · {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}</>}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isPast && <SafetyBadge summary={summary} />}
            <svg
              className={`h-4 w-4 transition-transform duration-150 ${isPast ? 'text-gray-300' : 'text-gray-400'} ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Expandable attendee list */}
        {expanded && (
          <div className="border-t border-gray-100 py-0.5">
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
