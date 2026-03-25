import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — ShelterAlert',
  description: 'Privacy policy for ShelterAlert, an independent tool for tracking colleague safety during Pikud HaOref rocket alerts.',
};

export default function PrivacyPage() {
  const lastUpdated = 'March 2026';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 px-6 py-4 flex items-center gap-3">
        <div className="h-7 w-7 rounded bg-red-500 flex items-center justify-center shrink-0">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <span className="font-bold text-white text-sm tracking-tight">ShelterAlert</span>
        <span className="text-slate-500 text-sm">/ Privacy Policy</span>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {lastUpdated}</p>

        {/* Disclaimer banner */}
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-10 leading-relaxed">
          <p className="font-semibold mb-0.5">Not an official emergency service</p>
          <p>
            ShelterAlert is an independent tool and is <strong>not affiliated with, endorsed by, or
            operated by Pikud HaOref</strong> (the Israel Home Front Command) or any government body.
            Do not rely on this app for life-safety decisions.
          </p>
        </div>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. What ShelterAlert does</h2>
            <p>
              ShelterAlert is a personal productivity tool that helps you monitor whether colleagues
              in your Google Calendar meetings are located in areas currently under a Pikud HaOref
              rocket alert. It reads your calendar, cross-references attendee locations you have
              manually configured, and shows you a safety status summary during active alerts.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Data we access</h2>

            <h3 className="font-medium text-gray-800 mt-3 mb-1">Google Calendar data</h3>
            <p>
              When you sign in with Google, ShelterAlert requests read-only access to your Google
              Calendar (<code className="bg-gray-100 px-1 text-xs">calendar.readonly</code> scope).
              This is used solely to display today&apos;s meetings and their attendee list on your
              dashboard. Calendar data is:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Fetched in real time on your device via a server-side proxy</li>
              <li><strong>Never stored on any ShelterAlert server or database</strong></li>
              <li>Never shared with any third party</li>
              <li>Only used while your browser session is active</li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-4 mb-1">Attendee location mappings</h3>
            <p>
              You may manually map colleagues&apos; email addresses to their Pikud HaOref area
              (e.g. &ldquo;Tel Aviv&rdquo;, &ldquo;Haifa&rdquo;). This data — names, email
              addresses, and area names — is:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Stored <strong>exclusively in your own browser&apos;s localStorage</strong></li>
              <li>Never transmitted to or stored on any ShelterAlert server</li>
              <li>Fully under your control — you can delete it at any time via the sign-out dialog or the Attendees page</li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-4 mb-1">Google Sheets (optional)</h3>
            <p>
              If you choose to import attendee data from a Google Sheet, ShelterAlert requests
              read-only access to that specific sheet
              (<code className="bg-gray-100 px-1 text-xs">spreadsheets.readonly</code> scope).
              Sheet content is read once for the import and is not stored on any server.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Data we do NOT collect</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>We do not operate any database or backend storage</li>
              <li>We do not collect analytics, telemetry, or usage statistics</li>
              <li>We do not use cookies beyond what NextAuth.js requires for your login session</li>
              <li>We do not sell, rent, or share any data with advertisers or third parties</li>
              <li>We do not store your Google access token — it exists only in an encrypted session cookie on your device</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Authentication</h2>
            <p>
              Login is handled entirely by Google OAuth via NextAuth.js. ShelterAlert never sees or
              stores your Google password. Your Google access token is kept in an encrypted,
              HTTP-only cookie on your device and is used only to make API calls on your behalf
              directly from the server — it is never exposed to the browser or any third party.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Pikud HaOref alert data</h2>
            <p>
              Real-time alert data is fetched from the public Pikud HaOref API
              (oref.org.il) and relayed to your browser. This data is not stored and is
              refreshed on demand. ShelterAlert has no affiliation with Pikud HaOref and
              cannot guarantee the accuracy or timeliness of alert information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Hosting</h2>
            <p>
              ShelterAlert is hosted on <a href="https://netlify.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Netlify</a>.
              Netlify may collect standard server access logs (IP addresses, request paths,
              timestamps) as part of normal infrastructure operation. See{' '}
              <a href="https://www.netlify.com/privacy/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Netlify&apos;s Privacy Policy</a>{' '}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Your rights</h2>
            <p>
              Because ShelterAlert does not store your personal data on any server, there is
              nothing to request deletion of from us. To remove your locally stored attendee
              data, use the sign-out dialog in the app (which offers to clear all data) or
              clear your browser&apos;s localStorage for this site.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Children</h2>
            <p>
              ShelterAlert is intended for professional use by adults. We do not knowingly
              collect data from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Changes to this policy</h2>
            <p>
              If this policy changes materially, the &ldquo;Last updated&rdquo; date at the top of
              this page will be updated. Continued use of ShelterAlert after a policy change
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Contact</h2>
            <p>
              Questions about this privacy policy? Open an issue on{' '}
              <a
                href="https://github.com/AviadDahanWeiss/ShelterAlert"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to app
          </Link>
        </div>
      </main>
    </div>
  );
}
