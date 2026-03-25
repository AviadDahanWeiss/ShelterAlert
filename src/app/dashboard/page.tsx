'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useAlerts } from '@/hooks/useAlerts';
import { useLocationMapping } from '@/hooks/useLocationMapping';
import { useMeetingScheduler } from '@/hooks/useMeetingScheduler';
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications';
import { enrichEventWithSafety } from '@/lib/safety';
import { toEnglishAreaName } from '@/lib/areaLookup';
import { getDemoEvents, DEMO_MAPPINGS } from '@/lib/demoData';
import AuthGuard from '@/components/AuthGuard';
import Sidebar, { type View } from '@/components/Sidebar';
import MeetingCard from '@/components/MeetingCard';
import AttendeeManager from '@/components/AttendeeManager';
import ShelterAlertToast from '@/components/ShelterAlertToast';
import type { ShelterAlert } from '@/hooks/useDesktopNotifications';
import type { AttendeeMapping, ExtendedSession } from '@/types';

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
        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-colors"
      >
        {loading ? <Spinner className="h-4 w-4 text-gray-400" /> : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        {loading ? 'Refreshing…' : label}
      </button>
      {lastFetched && (
        <span className="text-xs text-gray-400 pr-0.5 tabular-nums">
          {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      )}
    </div>
  );
}

// ── Demo banner ────────────────────────────────────────────────────────────────

function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">👋</span>
        <div>
          <p className="font-semibold text-sm">You&apos;re viewing a demo</p>
          <p className="text-blue-100 text-xs mt-0.5 leading-relaxed">
            These are sample meetings with fictional attendees. Connect your Google Calendar to see your real meetings and get live safety alerts.
          </p>
        </div>
      </div>
      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors shadow-sm w-full sm:w-auto justify-center"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
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
  const hasAlerts = alertAreas.length > 0;

  return (
    <div
      className={`rounded-2xl border text-sm overflow-hidden ${
        hasAlerts
          ? 'border-red-200 bg-red-50'
          : alertError
          ? 'border-amber-200 bg-amber-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {alertLoading ? (
            <Spinner className="h-4 w-4 text-gray-400" />
          ) : (
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                hasAlerts ? 'bg-red-500 animate-pulse' : alertError ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
          )}
          <span className={`font-medium ${hasAlerts ? 'text-red-800' : alertError ? 'text-amber-800' : 'text-gray-700'}`}>
            {alertLoading
              ? 'Checking Pikud HaOref…'
              : hasAlerts
              ? `🚨 Active alert — ${alertAreas.length} area${alertAreas.length !== 1 ? 's' : ''}`
              : alertError
              ? 'Alert service issue'
              : lastFetched
              ? 'No active alerts'
              : 'Not checked yet'}
          </span>
          {hasAlerts && alertTitle && (
            <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200 font-medium">
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
              {expanded ? 'Hide areas ▲' : 'Show areas ▼'}
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={alertLoading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
            title="Refresh alerts"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded area list */}
      {expanded && hasAlerts && (
        <div className="border-t border-red-200 px-4 py-3">
          <p className="text-xs text-red-600 font-semibold mb-2 uppercase tracking-wide">
            ⚠️ Areas under alert — type either the English or Hebrew name in the attendee&apos;s Area field:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {alertAreas.map((area) => {
              const english = toEnglishAreaName(area);
              const display = english !== area ? english : area;
              return (
                <button
                  key={area}
                  onClick={() => navigator.clipboard?.writeText(display)}
                  title={`Click to copy "${display}"`}
                  className="inline-flex flex-col items-start px-2.5 py-1 rounded-lg bg-red-100 border border-red-200 text-red-800 text-sm font-medium hover:bg-red-200 transition-colors cursor-copy"
                >
                  <span>{display}</span>
                  {english !== area && (
                    <span className="text-xs text-red-500 font-normal" dir="rtl">{area}</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-red-500 mt-2">
            Click any area to copy the English name, then paste into the attendee&apos;s Area field.
          </p>
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
}) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const tzAbbr = Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value ?? '';

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Today&apos;s Meetings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {today}
            {tzAbbr && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                {tzAbbr}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isDemo && (
            <RefreshBtn
              label="Refresh Calendar"
              loading={eventsLoading}
              lastFetched={eventsLastFetched}
              onClick={onRefreshCalendar}
            />
          )}
          <button
            onClick={onRefreshAlerts}
            disabled={alertLoading}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 ${
              alertAreas.length > 0
                ? 'bg-red-600 hover:bg-red-700 text-white border border-red-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            {alertLoading ? (
              <Spinner className="h-4 w-4 text-current" />
            ) : (
              <span className={`h-2 w-2 rounded-full ${alertAreas.length > 0 ? 'bg-white animate-pulse' : 'bg-emerald-400'}`} />
            )}
            {alertLoading ? 'Checking…' : alertAreas.length > 0 ? `🚨 ${alertAreas.length} Alert${alertAreas.length !== 1 ? 's' : ''}` : 'Check Alerts'}
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
            onRefresh={onRefreshAlerts}
          />

          {inShelterTotal > 0 && (
            <div className="rounded-2xl bg-red-600 text-white px-5 py-4 flex items-start gap-3 shadow-lg">
              <span className="text-2xl shrink-0">🚨</span>
              <div>
                <p className="font-bold text-base">
                  {inShelterTotal} attendee{inShelterTotal !== 1 ? 's' : ''} may be in a shelter right now
                </p>
                <p className="text-sm text-red-100 mt-0.5">
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
                {enrichedEvents.map((m) => (
                  <MeetingCard
                    key={m.event.id}
                    meeting={m}
                    mappings={mappings}
                    onAddOrUpdateMapping={onAddOrUpdateMapping}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Root dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: session, status } = useSession();
  const isDemo = status === 'unauthenticated';
  const accessToken = (session as ExtendedSession | null)?.accessToken ?? '';
  const [activeView, setActiveView] = useState<View>('meetings');
  const [toastAlerts, setToastAlerts] = useState<ShelterAlert[]>([]);

  // Stable demo events (regenerated only on mount)
  const demoEvents = useMemo(() => getDemoEvents(), []);

  const { events: realEvents, loading: eventsLoading, error: eventsError, lastFetched: eventsLastFetched, refresh: refreshCalendar } = useCalendarEvents();
  const { alertAreas, alertSeverity, alertTitle, loading: alertLoading, error: alertError, lastFetched: alertLastFetched, refresh: refreshAlerts } = useAlerts();
  const { mappings, addOrUpdateMapping, mergeMappings, replaceMappings, editMapping, deleteMapping, clearAll } = useLocationMapping();
  const { checkAndNotify } = useDesktopNotifications();

  // In demo mode use demo events + demo mappings; in real mode use real data
  const events = isDemo ? demoEvents : realEvents;
  const effectiveMappings = isDemo ? DEMO_MAPPINGS : mappings;

  const handleScheduledTrigger = useCallback(() => { refreshAlerts(); }, [refreshAlerts]);
  useMeetingScheduler({ events, onTrigger: handleScheduledTrigger });

  const enrichedEvents = useMemo(
    () => events.map((e) => enrichEventWithSafety(e, effectiveMappings, alertAreas, alertSeverity)),
    [events, effectiveMappings, alertAreas, alertSeverity]
  );

  useEffect(() => {
    if (isDemo) return; // no desktop notifications in demo
    const newAlerts = checkAndNotify(enrichedEvents);
    if (newAlerts.length > 0) {
      setToastAlerts((prev) => {
        const existing = new Set(prev.map((a) => `${a.meetingTitle}::${a.shelterAttendees.map((x) => x.email).join(',')}`));
        const truly_new = newAlerts.filter((a) => !existing.has(`${a.meetingTitle}::${a.shelterAttendees.map((x) => x.email).join(',')}`));
        return truly_new.length > 0 ? [...prev, ...truly_new] : prev;
      });
    }
  }, [enrichedEvents, checkAndNotify, isDemo]);

  const inShelterTotal = enrichedEvents.reduce((sum, m) => sum + m.summary.inShelterCount, 0);

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

        <main className="flex-1 overflow-hidden flex flex-col pt-14 sm:pt-0 pb-16 sm:pb-0">
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
              onRefreshAlerts={refreshAlerts}
              inShelterTotal={inShelterTotal}
              mappings={effectiveMappings}
              onAddOrUpdateMapping={addOrUpdateMapping}
              isDemo={isDemo}
            />
          )}
          {activeView === 'attendees' && (
            <AttendeeManager
              mappings={isDemo ? DEMO_MAPPINGS : mappings}
              accessToken={accessToken}
              onAdd={addOrUpdateMapping}
              onEdit={editMapping}
              onDelete={deleteMapping}
              onMerge={mergeMappings}
              onReplace={replaceMappings}
              onClear={clearAll}
              isDemo={isDemo}
            />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
