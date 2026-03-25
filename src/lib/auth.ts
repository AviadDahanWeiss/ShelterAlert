import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'profile',
            'email',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/spreadsheets.readonly',
          ].join(' '),
          // 'online' — no refresh token; user re-authenticates when expired.
          access_type: 'online',
          // 'consent' — ensures scope screen is shown and access_token is returned every sign-in.
          prompt: 'consent',
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      // On the initial sign-in `account` contains the access_token from Google.
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose accessToken to the client via useSession().
      // The Next.js backend NEVER receives or processes calendar / sheets data.
      (session as unknown as { accessToken: string }).accessToken =
        token.accessToken as string;
      return session;
    },
  },

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/',
  },
};
