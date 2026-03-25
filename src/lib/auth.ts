import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // spreadsheets.readonly is NOT requested here.
          // It is requested on-demand when the user clicks "Connect Google Sheet".
          scope: [
            'openid',
            'profile',
            'email',
            'https://www.googleapis.com/auth/calendar.readonly',
          ].join(' '),
          access_type: 'online',
          prompt: 'consent',
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      // Store the Google access token in the JWT (encrypted server-side cookie).
      // It is NEVER forwarded to the browser session — see the session callback below.
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session }) {
      // Return a standard session with NO accessToken field.
      // Server-side API routes read the token directly via getToken() from next-auth/jwt,
      // so the access token never needs to reach the browser.
      return session;
    },
  },

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/',
  },
};
