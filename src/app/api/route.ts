import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Rate Limiter ──────────────────────────────────────────────────────────
// In-memory sliding-window rate limiter. Behind a trusted proxy (Caddy/Cloudflare/etc.),
// X-Forwarded-For is set by the proxy and we trust the LEFTMOST (first) hop only.
// Map size is hard-capped to prevent memory-exhaustion DoS via IP rotation.

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60;        // 60 requests per minute per IP
const RATE_LIMIT_MAP_CAP = 10_000; // hard cap to bound memory

/** Extract the real client IP from the request, trusting only the first hop of X-Forwarded-For. */
function getClientIp(req: NextRequest): string {
  // 1. Cloudflare (preferred — cannot be spoofed by the client)
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  // 2. True-Client-IP (Cloudflare Enterprise / Akamai)
  const trueIp = req.headers.get('true-client-ip');
  if (trueIp) return trueIp.trim();

  // 3. X-Forwarded-For — trust ONLY the leftmost (first) hop, validated against IP shape
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first && (/^\d{1,3}(\.\d{1,3}){3}$/.test(first) || /^[0-9a-fA-F:]+$/.test(first))) {
      return first;
    }
  }

  // 4. X-Real-IP (set by nginx/Caddy)
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // 5. Next.js request.ip (Edge runtime only) — accessed via any cast
  const reqAny = req as any;
  if (typeof reqAny.ip === 'string') return reqAny.ip;

  return 'unknown';
}

function rateLimiter(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
    // Hard cap: if the Map is too large (IP-rotation DoS), evict the oldest 25%
    if (rateLimitMap.size >= RATE_LIMIT_MAP_CAP) {
      const keysToDelete = Array.from(rateLimitMap.keys()).slice(0, Math.floor(RATE_LIMIT_MAP_CAP * 0.25));
      for (const k of keysToDelete) rateLimitMap.delete(k);
    }
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup interval — guard against HMR stacking in dev, and `.unref()` so it doesn't
// keep Node alive on serverless cold-shutdown.
if (typeof globalThis !== 'undefined') {
  const g = globalThis as any;
  if (!g.__wirdRateLimitCleanup) {
    const handle = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of rateLimitMap.entries()) {
        if (now - value.lastReset > RATE_LIMIT_WINDOW * 2) {
          rateLimitMap.delete(key);
        }
      }
      // Safety net: hard cap on Map size (in case cleanup ran but IPs keep rotating)
      if (rateLimitMap.size > RATE_LIMIT_MAP_CAP) {
        const keysToDelete = Array.from(rateLimitMap.keys()).slice(0, rateLimitMap.size - RATE_LIMIT_MAP_CAP);
        for (const k of keysToDelete) rateLimitMap.delete(k);
      }
    }, RATE_LIMIT_WINDOW);
    g.__wirdRateLimitCleanup = handle;
    // Node.js Timer.unref() so the interval doesn't keep the process alive on serverless cold-shutdown.
    if (typeof handle.unref === 'function') handle.unref();
  }
}

// ─── CORS ──────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'https://wird.app',
  // Allow same-origin in dev/preview
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getCorsOrigin(reqOrigin: string | null): string | null {
  if (!reqOrigin) return null;
  return ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : null;
}

// ─── Routes ────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // Rate limiting — uses hardened IP extraction
  const ip = getClientIp(request);
  if (!rateLimiter(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': '60',
        },
      }
    );
  }

  const origin = getCorsOrigin(request.headers.get('origin'));

  const response = NextResponse.json({
    status: 'ok',
    message: 'Wird API is running',
    version: '1.1.0',
  });

  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin'); // critical for CDN/cache correctness with reflected ACAO
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

export async function OPTIONS(request: NextRequest) {
  const origin = getCorsOrigin(request.headers.get('origin'));
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return new NextResponse(null, { status: 204, headers });
}
