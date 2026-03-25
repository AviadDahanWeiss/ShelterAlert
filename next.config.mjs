/** @type {import('next').NextConfig} */

// 'unsafe-eval' is only needed in development (Next.js hot-reload module system).
// Production builds do not require it, which tightens the CSP significantly.
const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = [
  // Prevent loading in iframes (clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Stop browsers guessing MIME types
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // DNS prefetching
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Minimal referrer info sent to external sites
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features the app doesn't need
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // HSTS — tell browsers to always use HTTPS (only meaningful in production)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Content-Security-Policy
  // Note: Next.js App Router requires 'unsafe-inline' for its hydration scripts.
  // A full nonce-based CSP would require middleware and is out of scope here.
  {
    key: 'Content-Security-Policy',
    value: [
      // Default: only same-origin
      "default-src 'self'",
      // Scripts: 'unsafe-inline' required by Next.js hydration; 'unsafe-eval' only in dev
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      // Styles: 'unsafe-inline' required by Tailwind inline styles
      "style-src 'self' 'unsafe-inline'",
      // Images: allow same-origin, data URIs, and Google user profile pics
      "img-src 'self' data: https://lh3.googleusercontent.com",
      // Fonts: same-origin only
      "font-src 'self'",
      // Fetch/XHR: same-origin only (all external API calls are server-side)
      "connect-src 'self' https://accounts.google.com",
      // OAuth popup
      "frame-src https://accounts.google.com",
      // Form submissions (NextAuth redirects)
      "form-action 'self' https://accounts.google.com",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [
      // Apply security headers to all routes
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Prevent caching on live alert data
      {
        source: '/api/alerts',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/api/alert-history',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default nextConfig;
