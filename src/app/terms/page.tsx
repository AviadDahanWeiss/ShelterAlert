import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — ShelterAlert',
  description: 'Terms of service for ShelterAlert, an independent tool for tracking colleague safety during Pikud HaOref rocket alerts.',
};

export default function TermsPage() {
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
        <span className="text-slate-500 text-sm">/ Terms of Service</span>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {lastUpdated}</p>

        {/* Critical disclaimer */}
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-10 leading-relaxed">
          <p className="font-semibold mb-0.5">Important — Not a life-safety service</p>
          <p>
            ShelterAlert is <strong>not affiliated with Pikud HaOref</strong> (the Israel Home Front Command)
            and must <strong>not</strong> be used as your primary source of emergency alert information.
            Always follow official Pikud HaOref instructions. In an emergency, go to a shelter immediately
            — do not wait for this app.
          </p>
        </div>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Acceptance of terms</h2>
            <p>
              By accessing or using ShelterAlert (&ldquo;the Service&rdquo;), you agree to be bound
              by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Description of service</h2>
            <p>
              ShelterAlert is an independent, non-commercial tool that helps users monitor whether
              colleagues in their Google Calendar meetings are located in areas currently under a
              Pikud HaOref rocket alert. It is provided as-is, free of charge, with no warranties
              of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. No official affiliation</h2>
            <p>
              ShelterAlert is an independent project and is <strong>not affiliated with, endorsed
              by, or operated by</strong> Pikud HaOref, the Israel Defense Forces, the Israeli
              government, or any public authority. Alert data is sourced from the public Pikud
              HaOref API but ShelterAlert cannot guarantee its accuracy, completeness, or
              timeliness.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. No warranty — use at your own risk</h2>
            <p>
              The Service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong> without
              any warranty, express or implied, including but not limited to:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Accuracy or completeness of alert data</li>
              <li>Uptime or availability of the Service</li>
              <li>Fitness for any particular purpose, including emergency preparedness</li>
              <li>Correctness of area-matching logic or attendee status calculations</li>
            </ul>
            <p className="mt-3">
              Alert data may be delayed, incomplete, or incorrect. Always use official Pikud HaOref
              channels (app, website, sirens) as your primary alert source.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by applicable law, the developers of ShelterAlert
              shall not be liable for any direct, indirect, incidental, special, consequential, or
              punitive damages arising from your use of or inability to use the Service, including
              but not limited to personal injury, property damage, or loss of life resulting from
              reliance on alert information provided by this Service.
            </p>
            <p className="mt-3 font-medium">
              Do not rely on ShelterAlert to make safety decisions for yourself or others.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Google services</h2>
            <p>
              By using ShelterAlert you also agree to{' '}
              <a href="https://policies.google.com/terms" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Google&apos;s Terms of Service
              </a>{' '}
              and{' '}
              <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Google&apos;s Privacy Policy
              </a>.
              ShelterAlert uses Google OAuth for authentication and the Google Calendar API to read
              your calendar events. These services are governed by Google&apos;s own terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Use the Service to scrape, abuse, or overload the Pikud HaOref API</li>
              <li>Attempt to reverse-engineer, decompile, or tamper with the Service</li>
              <li>Use the Service for any commercial purpose without permission</li>
              <li>Circumvent any rate limiting or security measures in place</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Intellectual property</h2>
            <p>
              ShelterAlert is open-source software. The source code is available at{' '}
              <a
                href="https://github.com/AviadDahanWeiss/ShelterAlert"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/AviadDahanWeiss/ShelterAlert
              </a>
              . Your right to use the Service does not grant you ownership of any intellectual
              property rights in the Service or its content.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate the Service at any time without notice.
              You may stop using the Service at any time by signing out and clearing your browser
              data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. The &ldquo;Last updated&rdquo; date at
              the top of this page will reflect any changes. Continued use of the Service after
              changes constitutes your acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">11. Governing law</h2>
            <p>
              These terms are governed by the laws of the State of Israel, without regard to
              conflict-of-law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">12. Contact</h2>
            <p>
              Questions about these terms? Open an issue on{' '}
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

        <div className="mt-12 pt-6 border-t border-gray-200 flex gap-6">
          <Link href="/privacy" className="text-sm text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to app
          </Link>
        </div>
      </main>
    </div>
  );
}
