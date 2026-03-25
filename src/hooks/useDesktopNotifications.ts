'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface ShelterAlert {
  meetingTitle: string;
  meetingStart: string;        // ISO dateTime
  totalAttendees: number;
  shelterAttendees: { name: string; email: string; area?: string }[];
}

export function useDesktopNotifications() {
  /** Keys of alerts that have already been shown as desktop notifications. */
  const notifiedRef = useRef<Set<string>>(new Set());

  // Request permission early so it's likely granted before the first alert.
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /**
   * Internal: show a notification for a single alert.
   * Always requests permission if needed.
   * Returns true if the notification was shown.
   */
  const showOne = useCallback(async (alert: ShelterAlert): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;
    let permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const startTime = new Date(alert.meetingStart).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const names = alert.shelterAttendees.map((a) => a.name || a.email).join(', ');
    const areas = alert.shelterAttendees.map((a) => a.area).filter(Boolean).join(', ');
    const key = `${alert.meetingTitle}::${alert.shelterAttendees.map((a) => a.email).join(',')}`;

    // Title is the meeting name (bold in Chrome by default).
    // Body: who is in shelter, where, and when.
    const bodyLines = [
      `🚨 ${names}`,
      areas ? `📍 ${areas}` : null,
      `🕐 ${startTime} · ${alert.shelterAttendees.length}/${alert.totalAttendees} in shelter`,
    ].filter(Boolean).join('\n');

    new Notification(alert.meetingTitle, {
      body: bodyLines,
      icon: '/alert-icon.svg',
      badge: '/alert-icon.svg',
      tag: key,
      requireInteraction: true,
    });
    return true;
  }, []);

  /**
   * Show desktop notifications for the given alerts.
   * Deduplicates: skips alerts whose key is already in notifiedRef.
   * Only marks a key as "notified" after the notification is actually shown.
   */
  const notify = useCallback(async (alerts: ShelterAlert[]) => {
    for (const alert of alerts) {
      const key = `${alert.meetingTitle}::${alert.shelterAttendees.map((a) => a.email).join(',')}`;
      if (notifiedRef.current.has(key)) continue;
      notifiedRef.current.add(key);
      await showOne(alert);
    }
  }, [showOne]);

  /**
   * Like notify() but always fires, even for already-notified keys.
   * Use this on explicit manual refreshes so the user always gets feedback.
   */
  const forceNotify = useCallback(async (alerts: ShelterAlert[]) => {
    for (const alert of alerts) {
      const key = `${alert.meetingTitle}::${alert.shelterAttendees.map((a) => a.email).join(',')}`;
      // Remove from notifiedRef so it shows again, then re-add after showing
      notifiedRef.current.delete(key);
      const shown = await showOne(alert);
      if (shown) notifiedRef.current.add(key);
    }
  }, [showOne]);

  /**
   * Check all enriched events for attendees in shelter and fire notifications.
   * Returns the list of NEW shelter alerts (not yet shown in the in-app toast).
   */
  const checkAndNotify = useCallback(
    (
      enrichedEvents: Array<{
        event: { summary?: string; start: { dateTime: string } };
        attendees: Array<{ email: string; status: string; name: string; area?: string }>;
      }>
    ): ShelterAlert[] => {
      const allShelterAlerts: ShelterAlert[] = [];
      const newForToast: ShelterAlert[] = [];

      enrichedEvents.forEach((m) => {
        const shelterAttendees = m.attendees
          .filter((a) => a.status === 'In Shelter')
          .map((a) => ({ name: a.name, email: a.email, area: a.area }));

        if (shelterAttendees.length === 0) return;

        const alert: ShelterAlert = {
          meetingTitle: m.event.summary ?? 'Meeting',
          meetingStart: m.event.start.dateTime,
          totalAttendees: m.attendees.length,
          shelterAttendees,
        };

        allShelterAlerts.push(alert);

        const key = `${alert.meetingTitle}::${shelterAttendees.map((a) => a.email).join(',')}`;
        if (!notifiedRef.current.has(key)) {
          newForToast.push(alert);
        }
      });

      // Fire desktop notifications (async — doesn't block return)
      if (allShelterAlerts.length > 0) {
        notify(allShelterAlerts);
      }

      return newForToast;
    },
    [notify]
  );

  return { checkAndNotify, forceNotify };
}
