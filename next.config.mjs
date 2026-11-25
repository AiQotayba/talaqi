/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live",
      "script-src-elem 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://vercel.live",
      "style-src-elem 'self' 'unsafe-inline' https://vercel.live",
      "img-src 'self' blob: data: https://*.blob.vercel-storage.com https://*.vercel-storage.com https://trello-members.s3.amazonaws.com https://images.unsplash.com https://purecatamphetamine.github.io https://vercel.live https://vercel.com",
      "font-src 'self' data: https://vercel.live https://assets.vercel.com",
      "connect-src 'self' https://*.blob.vercel-storage.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live https://*.pusher.com https://*.pusherapp.com",
      "frame-src 'self' https://vercel.live",
      "frame-ancestors 'none'",
    ].join('; ') + ';',
  },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
