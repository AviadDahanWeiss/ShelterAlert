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
      <div className="w-[calc(100vw-1rem)] max-w-80 sm:w-80 shadow-xl overflow-hidden border border-red-300 bg-white">
        {/* Header bar */}
        <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">{alert.meetingTitle}</p>
              <p className="text-red-200 text-xs leading-tight">
                {alert.shelterAttendees.length}/{alert.totalAttendees} in shelter · {startTime}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-red-200 hover:text-white transition-colors ml-2 shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Attendees in shelter */}
        <div className="px-3 py-2.5 space-y-1.5">
          {alert.shelterAttendees.map((a) => (
            <div key={a.email} className="flex items-center gap-2 bg-red-50 border border-red-100 px-2.5 py-1.5">
              <div className="h-6 w-6 bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(a.name?.[0] ?? a.email[0]).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-red-900 text-xs font-semibold">{a.name || a.email}</span>
                  {a.area && (
                    <span className="text-red-500 text-[11px]">· {a.area}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-red-100 flex justify-end">
          <button
            onClick={handleDismiss}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
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
    <div className="fixed bottom-20 right-2 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 items-end">
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
