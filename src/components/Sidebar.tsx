'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export type View = 'meetings' | 'attendees';

interface Props {
  activeView: View;
  onViewChange: (view: View) => void;
  shelterCount: number;
  isDemo?: boolean;
}

// ── Desktop sidebar ────────────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function NavItem({ icon, label, active, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
        active
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className="w-5 h-5 shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

const MeetingsIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const AttendeesIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function Sidebar({ activeView, onViewChange, shelterCount, isDemo }: Props) {
  const { data: session } = useSession();

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden sm:flex w-60 shrink-0 bg-slate-900 flex-col h-screen sticky top-0">
        {/* Brand */}
        <div className="px-5 h-16 flex items-center gap-3 border-b border-slate-700/60">
          <div className="h-8 w-8 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <span className="font-bold text-white text-base tracking-tight">ShelterAlert</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavItem icon={MeetingsIcon} label="Today's Meetings" active={activeView === 'meetings'} onClick={() => onViewChange('meetings')} badge={shelterCount} />
          <NavItem icon={AttendeesIcon} label="Attendees" active={activeView === 'attendees'} onClick={() => onViewChange('attendees')} />
        </nav>

        {/* Alert status pill */}
        {shelterCount > 0 && (
          <div className="mx-3 mb-3 px-3 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30">
            <p className="text-red-300 text-xs font-semibold">🚨 Active Alert</p>
            <p className="text-red-400 text-xs mt-0.5">
              {shelterCount} attendee{shelterCount !== 1 ? 's' : ''} in shelter
            </p>
          </div>
        )}

        {/* User profile / sign-in */}
        <div className="px-4 py-4 border-t border-slate-700/60">
          {isDemo ? (
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full inline-flex items-center justify-center gap-2 bg-white text-slate-900 text-sm font-semibold px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect Calendar
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 mb-3">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt={session.user.name ?? ''} className="h-8 w-8 rounded-full ring-2 ring-slate-600" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-medium">
                    {session?.user?.name?.[0] ?? '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate leading-tight">{session?.user?.name ?? 'User'}</p>
                  <p className="text-xs text-slate-400 truncate leading-tight">{session?.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/dashboard' })}
                className="w-full text-left text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Mobile top bar (visible on mobile only) ── */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 h-14 flex items-center justify-between px-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-red-500 flex items-center justify-center">
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-tight">ShelterAlert</span>
          {shelterCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {shelterCount}
            </span>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-slate-400 hover:text-white p-1.5"
          title="Sign out"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-700/60 flex">
        {(
          [
            { view: 'meetings' as View, label: 'Meetings', icon: MeetingsIcon, badge: shelterCount },
            { view: 'attendees' as View, label: 'Attendees', icon: AttendeesIcon },
          ] as Array<{ view: View; label: string; icon: React.ReactNode; badge?: number }>
        ).map(({ view, label, icon, badge }) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors relative ${
              activeView === view ? 'text-white' : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 relative">
              {icon}
              {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </span>
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
