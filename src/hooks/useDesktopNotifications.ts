'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ShelterAlert {
  meetingTitle: string;
  meetingStart: string;        // ISO dateTime
  totalAttendees: number;
  shelterAttendees: { name: string; email: string; area?: string }[];
}

export function useDesktopNotifications() {
  /** Keys of alerts that have already been shown as desktop notifications. */
  const notifiedRef = useRef<Set<string>>(new Set());

  /** Live permission state — updated whenever it changes. */
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === 'undefined') return 'denied';
    return Notification.permission;
  });

  // Register service worker + request permission early.
  useEffect(() => {
    // Register SW so showNotification() works (more reliable than new Notification())
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {/* non-critical */});
    }
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((p) => setPermission(p));
    }
  }, []);

  /**
   * Internal: show a notification for a single alert.
   * Always requests permission if needed.
   * Returns true if the notification was shown.
   */
  const showOne = useCallback(async (alert: ShelterAlert): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;

    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }
    if (perm !== 'granted') {
      setPermission(perm);
      return false;
    }

    const startTime = new Date(alert.meetingStart).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const names = alert.shelterAttendees.map((a) => a.name || a.email).join(', ');
    const areas = alert.shelterAttendees.map((a) => a.area).filter(Boolean).join(', ');
    const key = `${alert.meetingTitle}::${alert.shelterAttendees.map((a) => a.email).join(',')}`;

    const bodyLines = [
      `🚨 ${names}`,
      areas ? `📍 ${areas}` : null,
      `🕐 ${startTime} · ${alert.shelterAttendees.length}/${alert.totalAttendees} in shelter`,
    ].filter(Boolean).join('\n');

    const options: NotificationOptions = {
      body: bodyLines,
      icon: '/alert-icon.svg',
      badge: '/alert-icon.svg',
      tag: key,
      requireInteraction: true,
    };

    // Prefer Service Worker showNotification() — shown as a native OS toast on
    // Windows/macOS regardless of browser notification UI quirks.
    // Use navigator.serviceWorker.ready (not getRegistration) so we wait until
    // the SW is fully active before calling showNotification().
    if ('serviceWorker' in navigator) {
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
        if (reg) {
          await (reg as ServiceWorkerRegistration).showNotification(alert.meetingTitle, options);
          return true;
        }
      } catch (err) {
        console.warn('[ShelterAlert] SW showNotification failed, falling back:', err);
      }
    }

    // Fallback: direct Notification API
    try {
      new Notification(alert.meetingTitle, options);
      return true;
    } catch (err) {
      console.warn('[ShelterAlert] Notification constructor threw:', err);
      return false;
    }
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
      // Only mark as notified AFTER the notification is successfully shown.
      // If showOne returns false (permission denied / browser blocked), the key
      // stays out of notifiedRef so it will be retried on the next alert refresh.
      const shown = await showOne(alert);
      if (shown) notifiedRef.current.add(key);
    }
  }, [showOne]);

  /**
   * Like notify() but always fires, even for already-notified keys.
   * Use this on explicit manual refreshes so the user always gets feedback.
   */
  const forceNotify = useCallback(async (alerts: ShelterAlert[]) => {
    for (const alert of alerts) {
      const key = `${alert.meetingTitle}::${alert.shelterAttendees.map((a) => a.email).join(',')}`;
      notifiedRef.current.delete(key);
      const shown = await showOne(alert);
      if (shown) notifiedRef.current.add(key);
    }
  }, [showOne]);

  /**
   * Fire a test notification immediately — no active alert or meeting required.
   * Use this to verify browser permission is working.
   * Returns true if shown, false if blocked.
   */
  const testNotification = useCallback(async (): Promise<boolean> => {
    // Use a unique email each time so the tag is different on every click —
    // same-tag notifications are silently deduplicated by the browser.
    return showOne({
      meetingTitle: '🧪 ShelterAlert Test',
      meetingStart: new Date().toISOString(),
      totalAttendees: 3,
      shelterAttendees: [{ name: 'Tal Katz', email: `test-${Date.now()}@demo.local`, area: 'Kiryat Shmona' }],
    });
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

  return { checkAndNotify, forceNotify, testNotification, permission };
}
