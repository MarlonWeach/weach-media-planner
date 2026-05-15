/** @type {import('next').NextConfig} */

function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: ws: wss:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://vercel.live",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

function buildSecurityHeaders() {
  /** @type {{ key: string; value: string }[]} */
  const headers = [
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
  ];

  if (process.env.VERCEL_ENV === 'production') {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload',
    });
  }

  return headers;
}

const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: buildSecurityHeaders(),
      },
    ];
  },
};

module.exports = nextConfig;
