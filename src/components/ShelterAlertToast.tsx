'use client';

import { useEffect, useState } from 'react';
import type { ShelterAlert } from '@/hooks/useDesktopNotifications';

interface Props {
  alerts: ShelterAlert[];
  onDismiss: (key: string) => void;
}

function toastKey(a: ShelterAlert) {
  return `${a.meetingTitle}::${a.shelterAttendees.map((x) => x.email).join(',')}`;
}

function SingleToast({
  alert,
  onDismiss,
}: {
  alert: ShelterAlert;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const startTime = new Date(alert.meetingStart).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="w-80 rounded-2xl shadow-2xl overflow-hidden border border-red-300 bg-red-50">
        {/* Header bar */}
        <div className="bg-red-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Large bell icon */}
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">🚨 Shelter Alert</p>
              <p className="text-red-100 text-xs leading-tight">
                {alert.shelterAttendees.length} of {alert.totalAttendees} attendee{alert.totalAttendees !== 1 ? 's' : ''} in shelter
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-red-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 bg-red-50">
          {/* Meeting info */}
          <p className="text-red-900 font-bold text-sm truncate">{alert.meetingTitle}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-red-700">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {startTime}
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {alert.totalAttendees} attendee{alert.totalAttendees !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 font-semibold text-red-800">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {alert.shelterAttendees.length} in shelter
            </span>
          </div>

          {/* Attendees in shelter */}
          <div className="mt-2.5 space-y-1">
            {alert.shelterAttendees.map((a) => (
              <div key={a.email} className="flex items-center gap-2 bg-red-100 rounded-lg px-2.5 py-1.5 border border-red-200">
                <div className="h-5 w-5 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(a.name?.[0] ?? a.email[0]).toUpperCase()}
                </div>
                <span className="text-red-900 text-xs font-medium truncate">{a.name || a.email}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-red-100 border-t border-red-200 flex justify-end">
          <button
            onClick={handleDismiss}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShelterAlertToast({ alerts, onDismiss }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      {alerts.map((alert) => (
        <SingleToast
          key={toastKey(alert)}
          alert={alert}
          onDismiss={() => onDismiss(toastKey(alert))}
        />
      ))}
    </div>
  );
}
