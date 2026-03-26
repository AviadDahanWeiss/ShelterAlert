'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useAlerts } from '@/hooks/useAlerts';
import { useLocationMapping } from '@/hooks/useLocationMapping';
import { useMeetingScheduler } from '@/hooks/useMeetingScheduler';
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications';
import { enrichEventWithSafety } from '@/lib/safety';
import { toEnglishAreaName } from '@/lib/areaLookup';
import { DEMO_MAPPINGS } from '@/lib/demoData';
import { useManualMeetings } from '@/hooks/useManualMeetings';
import AuthGuard from '@/components/AuthGuard';
import Sidebar, { type View } from '@/components/Sidebar';
import MeetingCard from '@/components/MeetingCard';
import AddMeetingModal from '@/components/AddMeetingModal';
import AttendeeManager from '@/components/AttendeeManager';
import ShelterAlertToast from '@/components/ShelterAlertToast';
import type { ShelterAlert } from '@/hooks/useDesktopNotifications';
import type { AttendeeMapping, CalendarEvent, MeetingStatus } from '@/types';

function Spinner({ className = 'h-5 w-5 text-gray-400' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function RefreshBtn({
  label,
  loading,
  lastFetched,
  onClick,
}: {
  label: string;
  loading: boolean;
  lastFetched: Date | null;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        title={label}
      >
        {loading ? <Spinner className="h-4 w-4 text-gray-400" /> : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        <span className="hidden sm:inline">{loading ? 'Refreshing…' : label}</span>
      </button>
      {lastFetched && (
        <span className="text-xs text-gray-400 pr-0.5 tabular-nums hidden sm:block">
          {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      )}
    </div>
  );
}

// ── Demo banner ────────────────────────────────────────────────────────────────

function DemoBanner() {
  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
      <div>
        <p className="font-semibold text-sm">You&apos;re in demo mode</p>
        <p className="text-blue-100 text-xs leading-relaxed mt-0.5">
          Add meetings and contacts manually — no sign-in needed.
          Or connect Google Calendar to sync your real schedule automatically.
        </p>
      </div>
      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 text-xs font-semibold px-3 py-1.5 hover:bg-blue-50 transition-colors w-full sm:w-auto justify-center rounded"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Connect Google Calendar
      </button>
    </div>
  );
}

// ── Live alert status panel ────────────────────────────────────────────────────

function AlertStatusPanel({
  alertAreas,
  alertTitle,
  alertLoading,
  alertError,
  lastFetched,
  onRefresh,
}: {
  alertAreas: string[];
  alertTitle: string | null;
  alertLoading: boolean;
  alertError: string | null;
  lastFetched: Date | null;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedArea, setCopiedArea] = useState<string | null>(null);
  const hasAlerts = alertAreas.length > 0;

  const handleCopy = (display: string) => {
    navigator.clipboard?.writeText(display);
    setCopiedArea(display);
    setTimeout(() => setCopiedArea(null), 1500);
  };

  return (
    <div
      className={`border text-sm overflow-hidden ${
        hasAlerts
          ? 'border-red-300 bg-red-50'
          : alertError
          ? 'border-amber-200 bg-amber-50'
          : 'border-gray-200 bg-white'
      }`}

    >
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {alertLoading ? (
            <Spinner className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <span
              className={`h-2 w-2 rounded-full ${
                hasAlerts ? 'bg-red-500 animate-pulse' : alertError ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
          )}
          <span className={`font-medium text-sm ${hasAlerts ? 'text-red-800' : alertError ? 'text-amber-800' : 'text-gray-700'}`}>
            {alertLoading
              ? 'Checking Pikud HaOref…'
              : hasAlerts
              ? `Active alert — ${alertAreas.length} area${alertAreas.length !== 1 ? 's' : ''}`
              : alertError
              ? 'Alert service issue'
              : lastFetched
              ? 'No active alerts'
              : 'Not checked yet'}
          </span>
          {hasAlerts && alertTitle && (
            <span className="text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded border border-red-200 font-medium">
              {alertTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastFetched && !alertLoading && (
            <span className="text-xs text-gray-400 tabular-nums hidden sm:block">
              {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          )}
          {hasAlerts && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-100 transition-colors"
            >
              {expanded ? 'Hide ▲' : `${alertAreas.length} areas ▼`}
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={alertLoading}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-40"
            title="Refresh alerts"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded area list — click anywhere to collapse */}
      {expanded && hasAlerts && (
        <div
          className="border-t border-red-200 px-4 py-2.5 cursor-pointer"
          onClick={() => setExpanded(false)}
        >
          <div className="flex flex-wrap gap-1.5">
            {alertAreas.map((area) => {
              const english = toEnglishAreaName(area);
              const display = english !== area ? english : area;
              const copied = copiedArea === display;
              return (
                <button
                  key={area}
                  onClick={(e) => { e.stopPropagation(); handleCopy(display); }}
                  title={copied ? 'Copied!' : `Copy "${display}"`}
                  className={`inline-flex flex-col items-start px-2 py-1 border text-xs font-medium transition-colors ${
                    copied
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-red-100 border-red-200 text-red-800 hover:bg-red-200 cursor-copy'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {copied && <span className="text-emerald-600">✓</span>}
                    {display}
                  </span>
                  {english !== area && (
                    <span className="text-[10px] text-red-500 font-normal" dir="rtl">{area}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error detail */}
      {alertError && !hasAlerts && (
        <div className="border-t border-amber-200 px-4 py-2 text-xs text-amber-700">
          {alertError}
        </div>
      )}
    </div>
  );
}

// ── Meetings view ──────────────────────────────────────────────────────────────

type EnrichedEvent = ReturnType<typeof enrichEventWithSafety>;

function MeetingsView({
  enrichedEvents,
  eventsLoading,
  eventsError,
  eventsLastFetched,
  onRefreshCalendar,
  alertAreas,
  alertTitle,
  alertLoading,
  alertError,
  alertLastFetched,
  onRefreshAlerts,
  inShelterTotal,
  mappings,
  onAddOrUpdateMapping,
  isDemo,
  meetingStatuses,
  onAddMeeting,
  onEditMeeting,
  onDeleteMeeting,
}: {
  enrichedEvents: EnrichedEvent[];
  eventsLoading: boolean;
  eventsError: string | null;
  eventsLastFetched: Date | null;
  onRefreshCalendar: () => void;
  alertAreas: string[];
  alertTitle: string | null;
  alertLoading: boolean;
  alertError: string | null;
  alertLastFetched: Date | null;
  onRefreshAlerts: () => void;
  inShelterTotal: number;
  mappings: AttendeeMapping[];
  onAddOrUpdateMapping: (m: AttendeeMapping) => void;
  isDemo: boolean;
  meetingStatuses: MeetingStatus[];
  onAddMeeting?: () => void;
  onEditMeeting?: (event: CalendarEvent) => void;
  onDeleteMeeting?: (id: string) => void;
}) {
  const [justChecked, setJustChecked] = useState(false);
  const justCheckedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRefreshAlerts = useCallback(() => {
    onRefreshAlerts();
    if (justCheckedTimer.current) clearTimeout(justCheckedTimer.current);
    setJustChecked(true);
    justCheckedTimer.current = setTimeout(() => setJustChecked(false), 3000);
  }, [onRefreshAlerts]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const tzAbbr = Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value ?? '';

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Today&apos;s Meetings</h1>
          <p className="tagline-highlight text-[13px] text-gray-600 leading-snug mt-0.5 hidden sm:block">Know if a colleague is missing because they&apos;re under a rocket alert.</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
            {today}
            {tzAbbr && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono hidden sm:inline">
                {tzAbbr}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isDemo && onAddMeeting && (
            <button
              onClick={onAddMeeting}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
              title="Add meeting"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add meeting</span>
            </button>
          )}
          {!isDemo && (
            <RefreshBtn
              label="Refresh Calendar"
              loading={eventsLoading}
              lastFetched={eventsLastFetched}
              onClick={onRefreshCalendar}
            />
          )}
          <button
            onClick={handleRefreshAlerts}
            disabled={alertLoading}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-sm font-medium border transition-colors disabled:opacity-50 ${
              alertAreas.length > 0
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                : justChecked
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
            }`}
          >
            {alertLoading ? (
              <Spinner className="h-3.5 w-3.5 text-current" />
            ) : alertAreas.length > 0 ? (
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            ) : justChecked ? (
              <span className="text-emerald-600 font-bold">✓</span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            )}
            {alertLoading
              ? 'Checking…'
              : alertAreas.length > 0
              ? `${alertAreas.length} Alert${alertAreas.length !== 1 ? 's' : ''}`
              : justChecked
              ? 'No alerts'
              : 'Check Alerts'}
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-5 space-y-4">

          <AlertStatusPanel
            alertAreas={alertAreas}
            alertTitle={alertTitle}
            alertLoading={alertLoading}
            alertError={alertError}
            lastFetched={alertLastFetched}
            onRefresh={handleRefreshAlerts}
          />

          {inShelterTotal > 0 && (
            <div className="border border-red-300 bg-red-600 text-white px-4 py-3 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  {inShelterTotal} attendee{inShelterTotal !== 1 ? 's' : ''} may be in a shelter right now
                </p>
                <p className="text-xs text-red-100 mt-0.5">
                  Expand the cards below to see who is affected.
                </p>
              </div>
            </div>
          )}

          {eventsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <span className="shrink-0">⚠️</span><span>{eventsError}</span>
            </div>
          )}

          {eventsLoading && !isDemo && (
            <div className="flex items-center justify-center gap-3 text-gray-400 py-16">
              <Spinner /><span className="text-sm">Loading calendar…</span>
            </div>
          )}

          {(!eventsLoading || isDemo) && (
            enrichedEvents.length === 0 && !eventsError ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-500 font-medium">No meetings today</p>
                <p className="text-sm text-gray-400 mt-1">Refresh the calendar or check back tomorrow.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrichedEvents.map((m, i) => (
                  <MeetingCard
                    key={m.event.id}
                    meeting={m}
                    mappings={mappings}
                    onAddOrUpdateMapping={onAddOrUpdateMapping}
                    status={meetingStatuses[i] ?? 'future'}
                    onEdit={isDemo && onEditMeeting ? () => onEditMeeting(m.event) : undefined}
                    onDelete={isDemo && onDeleteMeeting ? () => onDeleteMeeting(m.event.id) : undefined}
                  />
                ))}
              </div>
            )
          )}

          {/* End-of-list footer + legal disclaimer */}
          <div className="pt-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 shrink-0 font-medium">End of schedule</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800 leading-relaxed">
              <p className="font-semibold mb-0.5">⚠️ Not an official emergency service</p>
              <p>
                ShelterAlert is an independent tool and is <strong>not affiliated with Pikud HaOref</strong> (the Israel Home Front Command).
                Alert data is sourced from Pikud HaOref&apos;s public API but may be delayed or incomplete.{' '}
                <strong>Do not rely on this app for life-safety decisions.</strong>{' '}
                Always follow official guidance from{' '}
                <a href="https://www.oref.org.il" target="_blank" rel="noopener noreferrer" className="underline">oref.org.il</a>.
              </p>
            </div>
            <div className="mt-2 flex gap-3 justify-center">
              <a href="/privacy" className="text-[11px] text-gray-400 hover:text-gray-600 hover:underline">Privacy Policy</a>
              <span className="text-gray-300 text-[11px]">·</span>
              <a href="/terms" className="text-[11px] text-gray-400 hover:text-gray-600 hover:underline">Terms of Service</a>
            </div>
          </div>
          {/* Spacer so last card clears the mobile bottom nav */}
          <div className="h-28 sm:h-4" />
        </div>
      </div>
    </div>
  );
}

// ── Root dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { status } = useSession();
  const isDemo = status === 'unauthenticated';
  const [activeView, setActiveView] = useState<View>('meetings');
  const [toastAlerts, setToastAlerts] = useState<ShelterAlert[]>([]);
  const [meetingModal, setMeetingModal] = useState<{ open: boolean; editing?: CalendarEvent }>({ open: false });

  // Manual meetings (demo mode only) — stored in localStorage, seeded with demo data on first visit
  const { meetings: manualMeetings, addMeeting, editMeeting, deleteMeeting } = useManualMeetings();

  const { events: realEvents, loading: eventsLoading, error: eventsError, lastFetched: eventsLastFetched, refresh: refreshCalendar } = useCalendarEvents();
  const { alertAreas, alertSeverity, alertTitle, loading: alertLoading, error: alertError, lastFetched: alertLastFetched, refresh: refreshAlerts } = useAlerts();
  const { mappings, addOrUpdateMapping, mergeMappings, replaceMappings, editMapping, deleteMapping, clearAll } = useLocationMapping();
  const { checkAndNotify, forceNotify } = useDesktopNotifications();
  const pendingForceNotify = useRef(false);

  // In demo mode use localStorage-backed manual meetings; in real mode use Google Calendar
  const events = isDemo ? manualMeetings : realEvents;

  // In demo mode: start with DEMO_MAPPINGS but let any localStorage edits override them.
  // This lets unauthenticated users still customise attendee locations.
  const effectiveMappings = useMemo(() => {
    if (!isDemo) return mappings;
    const userByEmail = new Map(mappings.map((m) => [m.email, m]));
    const demoEmails = new Set(DEMO_MAPPINGS.map((m) => m.email));
    const merged = DEMO_MAPPINGS.map((dm) => userByEmail.get(dm.email) ?? dm);
    const extras = mappings.filter((m) => !demoEmails.has(m.email));
    return [...merged, ...extras];
  }, [isDemo, mappings]);

  const handleScheduledTrigger = useCallback(() => { refreshAlerts(); }, [refreshAlerts]);

  const handleManualRefreshAlerts = useCallback(() => {
    pendingForceNotify.current = true;
    refreshAlerts();
  }, [refreshAlerts]);
  useMeetingScheduler({ events, onTrigger: handleScheduledTrigger });

  const enrichedEvents = useMemo(
    () => events.map((e) => enrichEventWithSafety(e, effectiveMappings, alertAreas, alertSeverity)),
    [events, effectiveMappings, alertAreas, alertSeverity]
  );

  useEffect(() => {
    // Run on every new alert fetch OR whenever enrichedEvents changes.
    // alertLastFetched ensures we fire even when alertAreas didn't change
    // (i.e. same sirens still active after a manual refresh).
    if (pendingForceNotify.current) {
      pendingForceNotify.current = false;
      const shelterAlerts = enrichedEvents.flatMap((m) => {
        const shelterAttendees = m.attendees
          .filter((a) => a.status === 'In Shelter')
          .map((a) => ({ name: a.name, email: a.email, area: a.area }));
        if (shelterAttendees.length === 0) return [];
        return [{
          meetingTitle: m.event.summary ?? 'Meeting',
          meetingStart: m.event.start.dateTime,
          totalAttendees: m.attendees.length,
          shelterAttendees,
        }];
      });
      if (shelterAlerts.length > 0) forceNotify(shelterAlerts);
    }

    const newAlerts = checkAndNotify(enrichedEvents);
    if (newAlerts.length > 0) {
      setToastAlerts((prev) => {
        const existing = new Set(prev.map((a) => `${a.meetingTitle}::${a.shelterAttendees.map((x) => x.email).join(',')}`));
        const truly_new = newAlerts.filter((a) => !existing.has(`${a.meetingTitle}::${a.shelterAttendees.map((x) => x.email).join(',')}`));
        return truly_new.length > 0 ? [...prev, ...truly_new] : prev;
      });
    }
  // alertLastFetched ensures the effect re-runs after every manual refresh
  // even when alertAreas hasn't changed (same active sirens).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertLastFetched, enrichedEvents, checkAndNotify, forceNotify]);

  const inShelterTotal = enrichedEvents.reduce((sum, m) => sum + m.summary.inShelterCount, 0);

  // Compute timing status for each meeting (sorted by startTime)
  const meetingStatuses = useMemo((): MeetingStatus[] => {
    const now = Date.now();
    let nextAssigned = false;
    return enrichedEvents.map((m) => {
      const start = new Date(m.event.start.dateTime).getTime();
      const end = new Date(m.event.end.dateTime).getTime();
      if (end < now) return 'past';
      if (start <= now) return 'current';
      if (!nextAssigned) { nextAssigned = true; return 'next'; }
      return 'future';
    });
  }, [enrichedEvents]);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-gray-50 flex-col sm:flex-row">
        <Sidebar activeView={activeView} onViewChange={setActiveView} shelterCount={inShelterTotal} isDemo={isDemo} />

        <ShelterAlertToast
          alerts={toastAlerts}
          onDismiss={(key) =>
            setToastAlerts((prev) =>
              prev.filter((a) => `${a.meetingTitle}::${a.shelterAttendees.map((x) => x.email).join(',')}` !== key)
            )
          }
        />

        <main className="flex-1 overflow-hidden flex flex-col pt-14 sm:pt-0 pb-20 sm:pb-0">
          {/* Demo banner — sticky at top of content area */}
          {isDemo && <DemoBanner />}

          {activeView === 'meetings' && (
            <MeetingsView
              enrichedEvents={enrichedEvents}
              eventsLoading={eventsLoading}
              eventsError={eventsError}
              eventsLastFetched={eventsLastFetched}
              onRefreshCalendar={refreshCalendar}
              alertAreas={alertAreas}
              alertTitle={alertTitle}
              alertLoading={alertLoading}
              alertError={alertError}
              alertLastFetched={alertLastFetched}
              onRefreshAlerts={handleManualRefreshAlerts}
              inShelterTotal={inShelterTotal}
              mappings={effectiveMappings}
              onAddOrUpdateMapping={addOrUpdateMapping}
              isDemo={isDemo}
              meetingStatuses={meetingStatuses}
              onAddMeeting={isDemo ? () => setMeetingModal({ open: true }) : undefined}
              onEditMeeting={isDemo ? (ev) => setMeetingModal({ open: true, editing: ev }) : undefined}
              onDeleteMeeting={isDemo ? deleteMeeting : undefined}
            />
          )}
          {activeView === 'attendees' && (
            <AttendeeManager
              mappings={effectiveMappings}
              onAdd={addOrUpdateMapping}
              onEdit={(originalEmail, updated) => addOrUpdateMapping(updated)}
              onDelete={deleteMapping}
              onMerge={mergeMappings}
              onReplace={replaceMappings}
              onClear={clearAll}
            />
          )}
        </main>
      </div>

      {meetingModal.open && (
        <AddMeetingModal
          contacts={effectiveMappings}
          existingMeeting={meetingModal.editing}
          onSave={(m) => meetingModal.editing ? editMeeting(meetingModal.editing.id, m) : addMeeting(m)}
          onClose={() => setMeetingModal({ open: false })}
        />
      )}
    </AuthGuard>
  );
}
