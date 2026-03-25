import type { Session } from 'next-auth';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface ExtendedSession extends Session {
  accessToken: string;
}

// ─── Google Calendar ───────────────────────────────────────────────────────────

export interface CalendarAttendee {
  displayName?: string;
  email: string;
  self?: boolean;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: CalendarAttendee[];
}

// ─── Attendee Mapping ──────────────────────────────────────────────────────────

export interface AttendeeMapping {
  name: string;
  email: string;
  area: string;
}

// ─── Pikud HaOref Alerts ───────────────────────────────────────────────────────

/**
 * Severity levels returned by the /api/alerts proxy.
 *
 * "active"    — live siren / rockets / aircraft intrusion (RED)
 * "pre_alert" — advance warning, "expected in your area in a few minutes" (YELLOW)
 * "ended"     — Pikud HaOref confirmed the event is over; clear these areas
 * "none"      — no active alerts at all
 */
export type AlertSeverity = 'active' | 'pre_alert' | 'ended' | 'none';

export interface AlertsPayload {
  data: string[];          // affected area names (Hebrew)
  severity: AlertSeverity;
  cat: string | null;
  title: string | null;
  error?: 'timeout' | 'fetch_failed';
  parseError?: boolean;
}

// ─── Safety ───────────────────────────────────────────────────────────────────

/**
 * "In Shelter"      — area is under an active (red) alert right now
 * "Pre-Alert"       — area has an advance warning (yellow), shelter expected soon
 * "Location Unknown"— email not in the attendee mapping
 * "Safe"            — mapped area has no current alert
 */
export type SafetyStatus = 'Safe' | 'In Shelter' | 'Pre-Alert' | 'Location Unknown';

export interface AttendeeWithStatus {
  name: string;
  email: string;
  status: SafetyStatus;
  area?: string;
}

export interface SafetySummary {
  allSafe: boolean;
  inShelterCount: number;
  preAlertCount: number;
  unknownCount: number;
}

export interface MeetingWithSafety {
  event: CalendarEvent;
  attendees: AttendeeWithStatus[];
  summary: SafetySummary;
}
