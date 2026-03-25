'use client';

import { useSession } from 'next-auth/react';

interface Props {
  children: React.ReactNode;
}

/** AuthGuard no longer blocks unauthenticated users — the dashboard shows demo
 *  data instead.  We only block during the NextAuth loading phase so we don't
 *  flash unauthenticated content before the session resolves. */
export default function AuthGuard({ children }: Props) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
