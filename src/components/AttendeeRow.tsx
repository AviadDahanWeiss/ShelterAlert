'use client';

import type { AttendeeWithStatus } from '@/types';

interface Props {
  attendee: AttendeeWithStatus;
  onClick?: () => void;
}

export default function AttendeeRow({ attendee, onClick }: Props) {
  const isInShelter = attendee.status === 'In Shelter';
  const isPreAlert  = attendee.status === 'Pre-Alert';
  const isUnknown   = attendee.status === 'Location Unknown';

  const Tag = onClick ? 'button' : 'li';

  return (
    <Tag
      className={`w-full flex items-center justify-between py-2.5 sm:py-1.5 px-3 text-left transition-colors ${
        isInShelter
          ? 'bg-red-50 border-l-2 border-red-400'
          : isPreAlert
          ? 'bg-amber-50 border-l-2 border-amber-300'
          : onClick
          ? 'hover:bg-gray-50'
          : ''
      } ${onClick && !isInShelter && !isPreAlert ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      {/* Name + area on one line */}
      <div className="min-w-0 flex-1 flex items-baseline gap-1.5">
        <span className={`text-sm font-medium truncate shrink-0 ${
          isInShelter ? 'text-red-800' : isPreAlert ? 'text-amber-800' : 'text-gray-800'
        }`}>
          {isInShelter && <span className="mr-1 text-red-500">!</span>}
          {attendee.name}
        </span>
        {attendee.area && (
          <span className="text-[11px] text-gray-400 truncate">· {attendee.area}</span>
        )}
      </div>

      {/* Status badge */}
      <div className="ml-2 flex items-center gap-1 shrink-0">
        {isInShelter && (
          <span className="text-[11px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 border border-red-200">
            In Shelter
          </span>
        )}
        {isPreAlert && (
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 border border-amber-200">
            Pre-Alert
          </span>
        )}
        {isUnknown && (
          <span className="text-[11px] text-gray-400">?</span>
        )}
        {attendee.status === 'Safe' && (
          <span className="text-[11px] text-emerald-600">✓</span>
        )}
        {onClick && (
          <svg className="h-3 w-3 text-gray-300 group-hover:text-gray-500 shrink-0 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )}
      </div>
    </Tag>
  );
}
