import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { getAuthUser } from '@/lib/auth';

// Only allow fetching URLs originating from official Vercel Blob domains
function isAllowedBlobHost(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return (
      parsed.hostname.endsWith('.public.blob.vercel-storage.com') ||
      parsed.hostname.endsWith('.blob.vercel-storage.com')
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    if (!isAllowedBlobHost(url)) {
      return new NextResponse('Forbidden: Untrusted file origin', { status: 403 });
    }

    // Require valid authentication to read files through private blob proxy
    const user = await getAuthUser(req);
    if (!user) {
      return new NextResponse('Unauthorized: Login required to view this file', { status: 401 });
    }

    const result = await get(url, { access: 'private' });
    if (!result || !result.stream) {
      return new NextResponse('File not found in Vercel Blob', { status: 404 });
    }

    const responseHeaders = new Headers();
    const contentType = result.headers?.get('content-type') || 'application/octet-stream';
    responseHeaders.set('Content-Type', contentType);
    // Security: private cache with reasonable expiration, never public immutable for private resources
    responseHeaders.set('Cache-Control', 'private, max-age=3600, must-revalidate');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');

    return new NextResponse(result.stream as any, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Blob Serve Error:', err);
    return new NextResponse('Error serving requested file', { status: 500 });
  }
}
