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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirectTo = searchParams.get('redirect') || '/auth?route=login';

  const redirectUrl = new URL(redirectTo, req.url);
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
