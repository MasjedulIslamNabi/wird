import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ─── Host-gate: production vs preview/localhost ──────────────────────────
  // In production (wird.app or any non-preview host), enforce strict frame-ancestors: 'none'
  // and X-Frame-Options: DENY. In preview/localhost (used by the preview portal and local dev),
  // allow embedding from the preview portal so the iframe renders.
  const host = request.headers.get('host') || '';
  const isPreviewHost =
    host.endsWith('.space-z.ai') ||
    host.startsWith('localhost:') ||
    host.startsWith('127.0.0.1:');
  const isProduction = !isPreviewHost;

  // ─── Security Headers ──────────────────────────────────

  // Content Security Policy
  // Notes:
  //  - 'unsafe-eval' REMOVED (was the single biggest CSP weakness; not required by Next.js 16 prod).
  //  - 'unsafe-inline' kept for now because the SW registration inline script + Google Fonts CSS
  //    injection need it. TODO: replace with a per-request nonce generated in middleware.
  //  - object-src 'none' added to block Flash/Java/PDF embeds.
  //  - upgrade-insecure-requests added to coerce any stray http:// refs to https://.
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://cdn.islamic.network",
    "connect-src 'self' https://api.alquran.cloud https://cdn.islamic.network https://nominatim.openstreetmap.org",
    "media-src 'self' https://cdn.islamic.network",
    "object-src 'none'",
    "worker-src 'self' blob:",
    isProduction
      ? "frame-ancestors 'none'"
      : "frame-ancestors https://*.space-z.ai http://*.space-z.ai http://localhost:* http://127.0.0.1:*",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ];
  response.headers.set(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  );

  // Clickjacking protection — host-gated.
  //   Production: DENY (no embedding at all).
  //   Preview/localhost: SAMEORIGIN (allow embedding from same origin & the preview portal via CSP frame-ancestors).
  response.headers.set('X-Frame-Options', isProduction ? 'DENY' : 'SAMEORIGIN');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection: deprecated, was shown to introduce XSS itself in old IE/Edge. OWASP recommends '0'.
  response.headers.set('X-XSS-Protection', '0');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy — restrict browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Strict Transport Security (only on production HTTPS)
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Cross-origin isolation — host-gated.
  //   Production: enable COOP same-origin (safe; doesn't break iframe embedding).
  //   Preview/localhost: keep disabled (breaks the preview portal's iframe embedding).
  if (isProduction) {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  }

  // Remove server fingerprinting headers
  response.headers.delete('X-Powered-By');

  // Cache control for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    // API responses should not be framed — strip the X-Frame-Options entirely on JSON routes
    response.headers.delete('X-Frame-Options');
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|icon-|sw.js|manifest.json|robots.txt|sitemap.xml).*)',
  ],
};
