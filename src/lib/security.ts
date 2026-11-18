import { NextRequest } from 'next/server';

/**
 * Verify magic bytes for common image formats
 */
export function isValidImageSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 8) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return true;
  }

  // WebP: RIFF ... WEBP (52 49 46 46 ... 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  // AVIF: ftypavif (00 00 00 ... 66 74 79 70 61 76 69 66)
  if (buffer.length >= 12 && buffer.toString('utf8', 4, 12).includes('ftyp')) {
    return true;
  }

  return false;
}

/**
 * Construct trusted server base URL (never trusting client headers like Host/Origin/X-Forwarded-Host)
 */
export function getTrustedBaseUrl(): string {
  const envUrl =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/+$/, '')}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, '')}`;
  }

  // Safe fallback to official production domain
  return 'https://talaqi.vercel.app';
}

/**
 * Basic CSRF check for sensitive mutative admin actions:
 * Rejects requests with cross-site fetch site or mismatched origin when headers are present
 */
export function verifySameOrigin(req: NextRequest): boolean {
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const origin = req.headers.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const host = req.headers.get('host') || '';
      // If host is available and origin host doesn't match host header
      if (host && originHost !== host) {
        // Also allow matching against trusted base URL
        const trustedHost = new URL(getTrustedBaseUrl()).host;
        if (originHost !== trustedHost) {
          return false;
        }
      }
    } catch {
      return false;
    }
  }

  return true;
}
