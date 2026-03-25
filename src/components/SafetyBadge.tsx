import type { SafetySummary } from '@/types';

export default function SafetyBadge({ summary }: { summary: SafetySummary }) {
  if (summary.inShelterCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shrink-0">
        🔴 {summary.inShelterCount} In Shelter
      </span>
    );
  }
  if (summary.preAlertCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
        🟠 {summary.preAlertCount} Pre-Alert
      </span>
    );
  }
  if (summary.unknownCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200 shrink-0">
        🟡 {summary.unknownCount} Unknown
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 shrink-0">
      🟢 All Safe
    </span>
  );
}
