import Fuse from 'fuse.js';
import { toHebrewAreaName } from './areaLookup';
import type {
  AlertSeverity,
  CalendarEvent,
  CalendarAttendee,
  AttendeeMapping,
  AttendeeWithStatus,
  MeetingWithSafety,
  SafetySummary,
} from '@/types';

function buildAlertIndex(alertAreas: string[]): Fuse<string> {
  return new Fuse(alertAreas, {
    threshold: 0.35,
    includeScore: true,
    isCaseSensitive: false,
  });
}

/**
 * Check if a (Hebrew) area name is in the alert zones.
 * Three-stage check:
 *   1. Exact match  (e.g. "עכו" === "עכו")
 *   2. Prefix match (e.g. "עכו" in "עכו - מרכז העיר") — handles sub-areas
 *   3. Fuzzy match  (threshold 0.35) — handles spelling variants
 */
function isAreaInAlert(hebrewArea: string, alertAreas: string[], alertFuse: Fuse<string>): boolean {
  if (alertAreas.includes(hebrewArea)) return true;
  if (alertAreas.some((a) => a.startsWith(hebrewArea) || hebrewArea.startsWith(a))) return true;
  return alertFuse.search(hebrewArea).length > 0;
}

function resolveStatus(
  attendee: CalendarAttendee,
  mappings: AttendeeMapping[],
  alertAreas: string[],
  alertFuse: Fuse<string>,
  severity: AlertSeverity
): AttendeeWithStatus {
  const email = attendee.email.toLowerCase().trim();
  const mapping = mappings.find((m) => m.email === email);

  if (!mapping) {
    return {
      name: attendee.displayName ?? attendee.email,
      email: attendee.email,
      status: 'Location Unknown',
    };
  }

  const hebrewArea = toHebrewAreaName(mapping.area);
  const isInAlertZone = isAreaInAlert(hebrewArea, alertAreas, alertFuse);

  let status: AttendeeWithStatus['status'] = 'Safe';
  if (isInAlertZone) {
    status = severity === 'pre_alert' ? 'Pre-Alert' : 'In Shelter';
  }

  return {
    name: attendee.displayName ?? attendee.email,
    email: attendee.email,
    status,
    area: mapping.area,
  };
}

function buildSummary(attendees: AttendeeWithStatus[]): SafetySummary {
  const inShelterCount = attendees.filter((a) => a.status === 'In Shelter').length;
  const preAlertCount = attendees.filter((a) => a.status === 'Pre-Alert').length;
  const unknownCount = attendees.filter((a) => a.status === 'Location Unknown').length;
  return {
    allSafe: inShelterCount === 0 && preAlertCount === 0 && unknownCount === 0,
    inShelterCount,
    preAlertCount,
    unknownCount,
  };
}

export function enrichEventWithSafety(
  event: CalendarEvent,
  mappings: AttendeeMapping[],
  alertAreas: string[],
  severity: AlertSeverity = 'none'
): MeetingWithSafety {
  const alertFuse = buildAlertIndex(alertAreas);

  const attendees = (event.attendees ?? [])
    .map((a) => resolveStatus(a, mappings, alertAreas, alertFuse, severity));

  return { event, attendees, summary: buildSummary(attendees) };
}
