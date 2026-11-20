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

// Check if the requested asset is public (courses, sliders, banners, or standard image files)
function isPublicAsset(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const pathname = parsed.pathname.toLowerCase();
    return (
      pathname.includes('/courses/') ||
      pathname.includes('/sliders/') ||
      pathname.includes('/public/') ||
      pathname.includes('/banners/') ||
      pathname.includes('/thumbnails/') ||
      /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(pathname)
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

    const isPublic = isPublicAsset(url);

    // Only require authentication for non-public (private sensitive) files
    if (!isPublic) {
      const user = await getAuthUser(req);
      if (!user) {
        return new NextResponse('Unauthorized: Login required to view this file', { status: 401 });
      }
    }

    const result = await get(url, { access: 'private' });
    if (!result || !result.stream) {
      return new NextResponse('File not found in Vercel Blob', { status: 404 });
    }

    const responseHeaders = new Headers();
    const contentType = result.headers?.get('content-type') || 'application/octet-stream';
    responseHeaders.set('Content-Type', contentType);

    // Public media should be cached aggressively, while private files must revalidate
    if (isPublic) {
      responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      responseHeaders.set('Cache-Control', 'private, max-age=3600, must-revalidate');
    }
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
