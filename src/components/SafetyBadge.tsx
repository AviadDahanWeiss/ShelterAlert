import type { SafetySummary } from '@/types';

export default function SafetyBadge({ summary }: { summary: SafetySummary }) {
  if (summary.inShelterCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        {summary.inShelterCount} In Shelter
      </span>
    );
  }
  if (summary.preAlertCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        {summary.preAlertCount} Pre-Alert
      </span>
    );
  }
  if (summary.unknownCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        {summary.unknownCount} Unknown
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      All Safe
    </span>
  );
}
