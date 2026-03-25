import type { AttendeeWithStatus } from '@/types';

interface Props {
  attendee: AttendeeWithStatus;
  onClick?: () => void;
}

export default function AttendeeRow({ attendee, onClick }: Props) {
  const isInShelter = attendee.status === 'In Shelter';
  const isPreAlert = attendee.status === 'Pre-Alert';
  const isUnknown = attendee.status === 'Location Unknown';

  const Tag = onClick ? 'button' : 'li';

  const rowBg = isInShelter
    ? 'bg-red-50/60 px-3'
    : isPreAlert
    ? 'bg-amber-50/60 px-3'
    : '';

  return (
    <Tag
      className={`w-full flex items-center justify-between py-2.5 px-1 rounded-lg text-left transition-colors ${
        onClick ? 'hover:bg-white cursor-pointer group' : ''
      } ${rowBg}`}
      onClick={onClick}
    >
      <div className="min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isInShelter ? 'text-red-800' : isPreAlert ? 'text-amber-800' : 'text-gray-800'
          }`}
        >
          {isInShelter && <span className="mr-1">🚨</span>}
          {isPreAlert && <span className="mr-1">⚠️</span>}
          {attendee.name}
        </p>
        <p className={`text-xs truncate mt-0.5 ${onClick ? 'text-blue-500 group-hover:underline' : 'text-gray-400'}`}>
          {attendee.email}
        </p>
        {attendee.area && (
          <p className="text-xs text-gray-400 mt-0.5">{attendee.area}</p>
        )}
      </div>

      <div className="ml-3 flex items-center gap-2 shrink-0">
        {isInShelter && (
          <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
            In Shelter
          </span>
        )}
        {isPreAlert && (
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
            Pre-Alert
          </span>
        )}
        {isUnknown && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
            Unknown
          </span>
        )}
        {attendee.status === 'Safe' && (
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Safe
          </span>
        )}
        {onClick && (
          <svg className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )}
      </div>
    </Tag>
  );
}
