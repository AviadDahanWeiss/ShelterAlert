'use client';

import { useState } from 'react';
import type { CalendarEvent, AttendeeMapping } from '@/types';

interface Props {
  contacts: AttendeeMapping[];       // existing contacts to invite
  existingMeeting?: CalendarEvent;  // pass to edit; omit for new
  onSave: (meeting: CalendarEvent) => void;
  onClose: () => void;
}

function toLocalDateTimeInputs(iso: string) {
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return { date, time };
}

function toISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export default function AddMeetingModal({ contacts, existingMeeting, onSave, onClose }: Props) {
  const isEdit = !!existingMeeting;

  const [title, setTitle]         = useState(existingMeeting?.summary ?? '');
  const [date,  setDate]          = useState(() => {
    if (existingMeeting) return toLocalDateTimeInputs(existingMeeting.start.dateTime).date;
    return new Date().toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState(() => {
    if (existingMeeting) return toLocalDateTimeInputs(existingMeeting.start.dateTime).time;
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });
  const [endTime, setEndTime]     = useState(() => {
    if (existingMeeting) return toLocalDateTimeInputs(existingMeeting.end.dateTime).time;
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15 + 60, 0, 0);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(() => {
    if (!existingMeeting?.attendees) return new Set();
    return new Set(existingMeeting.attendees.map(a => a.email));
  });
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState('');

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email); else next.add(email);
      return next;
    });
  };

  const addCustomEmail = () => {
    const e = customEmail.trim().toLowerCase();
    if (!e || !e.includes('@')) { setError('Enter a valid email address.'); return; }
    setSelectedEmails(prev => new Set(Array.from(prev.values()).concat(e)));
    setCustomEmail('');
    setError('');
  };

  const handleSave = () => {
    if (!title.trim()) { setError('Meeting title is required.'); return; }
    if (!date)         { setError('Date is required.'); return; }
    if (!startTime || !endTime) { setError('Start and end times are required.'); return; }

    const startISO = toISO(date, startTime);
    const endISO   = toISO(date, endTime);
    if (new Date(endISO) <= new Date(startISO)) {
      setError('End time must be after start time.');
      return;
    }

    const contactMap = new Map(contacts.map(c => [c.email, c]));
    const attendees = Array.from(selectedEmails.values()).map(email => {
      const contact = contactMap.get(email);
      return { email, displayName: contact?.name, responseStatus: 'accepted' as const };
    });

    const meeting: CalendarEvent = {
      id: existingMeeting?.id ?? `manual-${Date.now()}`,
      summary: title.trim(),
      start: { dateTime: startISO, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end:   { dateTime: endISO,   timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      attendees,
    };

    onSave(meeting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit meeting' : 'Add meeting'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Meeting title *</label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              placeholder="e.g. Weekly standup"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); setError(''); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Start time *</label>
              <input
                type="time"
                value={startTime}
                onChange={e => { setStartTime(e.target.value); setError(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">End time *</label>
              <input
                type="time"
                value={endTime}
                onChange={e => { setEndTime(e.target.value); setError(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Attendees from contacts */}
          {contacts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Invite from your contacts
              </label>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-36 overflow-y-auto">
                {contacts.map(c => (
                  <label
                    key={c.email}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmails.has(c.email)}
                      onChange={() => toggleEmail(c.email)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-800 truncate">{c.name}</span>
                      <span className="block text-xs text-gray-400 truncate">{c.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Add attendee by email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={customEmail}
                onChange={e => { setCustomEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && addCustomEmail()}
                placeholder="colleague@example.com"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCustomEmail}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {/* Selected custom emails not in contacts */}
            {Array.from(selectedEmails.values()).filter(e => !contacts.find(c => c.email === e)).map(email => (
              <div key={email} className="flex items-center justify-between mt-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
                <span className="text-blue-700 truncate">{email}</span>
                <button onClick={() => toggleEmail(email)} className="ml-2 text-blue-400 hover:text-blue-600 shrink-0">✕</button>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isEdit ? 'Save changes' : 'Add meeting'}
          </button>
        </div>
      </div>
    </div>
  );
}
