import { NextRequest, NextResponse } from 'next/server';

function clearAuthCookies(response: NextResponse) {
  response.cookies.set('authorization', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set('isAdmin', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

function sanitizeRedirectUrl(target: string | null, baseUrl: string): URL {
  const fallback = new URL('/auth?route=login', baseUrl);
  if (!target || typeof target !== 'string') {
    return fallback;
  }

  const trimmed = target.trim();
  // Open Redirect Prevention:
  // Reject protocol-relative URLs (//evil.com), backslash tricks (/\evil.com), and explicit schemes
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  // Must start with a single slash
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, baseUrl);
    const base = new URL(baseUrl);
    // Enforce identical origin
    if (parsed.origin !== base.origin) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirectTo = searchParams.get('redirect');

  const redirectUrl = sanitizeRedirectUrl(redirectTo, req.url);
  const response = NextResponse.redirect(redirectUrl);
  clearAuthCookies(response);
  return response;
}

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح',
  });
  clearAuthCookies(response);
  return response;
}
