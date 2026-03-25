'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface ShelterAlert {
  meetingTitle: string;
  meetingStart: string;        // ISO dateTime
  totalAttendees: number;
  shelterAttendees: { name: string; email: string }[];
}

export function useDesktopNotifications() {
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const notify = useCallback((alerts: ShelterAlert[]) => {
    alerts.forEach((alert) => {
      const key = `${alert.meetingTitle}::${alert.shelterAttendees.map((a) => a.email).join(',')}`;
      if (notifiedRef.current.has(key)) return;
      notifiedRef.current.add(key);

      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

      const startTime = new Date(alert.meetingStart).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const names = alert.shelterAttendees.map((a) => a.name || a.email).join(', ');

      new Notification(`🚨 Shelter Alert — ${alert.shelterAttendees.length} attendee${alert.shelterAttendees.length !== 1 ? 's' : ''}`, {
        body: [
          `Meeting: ${alert.meetingTitle}`,
          `Time: ${startTime}  ·  ${alert.totalAttendees} attendee${alert.totalAttendees !== 1 ? 's' : ''}  ·  ${alert.shelterAttendees.length} in shelter`,
          `In shelter: ${names}`,
        ].join('\n'),
        icon: '/alert-icon.svg',
        badge: '/alert-icon.svg',
        tag: key,
        requireInteraction: true,
      });
    });
  }, []);

  const checkAndNotify = useCallback(
    (
      enrichedEvents: Array<{
        event: { summary?: string; start: { dateTime: string } };
        attendees: Array<{ email: string; status: string; name: string }>;
      }>
    ): ShelterAlert[] => {
      const newAlerts: ShelterAlert[] = [];

      enrichedEvents.forEach((m) => {
        const shelterAttendees = m.attendees
          .filter((a) => a.status === 'In Shelter')
          .map((a) => ({ name: a.name, email: a.email }));

        if (shelterAttendees.length === 0) return;

        const alert: ShelterAlert = {
          meetingTitle: m.event.summary ?? 'Meeting',
          meetingStart: m.event.start.dateTime,
          totalAttendees: m.attendees.length,
          shelterAttendees,
        };

        const key = `${alert.meetingTitle}::${shelterAttendees.map((a) => a.email).join(',')}`;
        if (!notifiedRef.current.has(key)) {
          newAlerts.push(alert);
        }
      });

      if (newAlerts.length > 0) notify(newAlerts);
      return newAlerts; // returned so the UI can show in-app toasts
    },
    [notify]
  );

  return { checkAndNotify };
}
