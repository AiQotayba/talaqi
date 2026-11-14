import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getAuthUser } from '@/lib/auth';

// الحد الأقصى لحجم الصورة المسموح برفعها: 5 ميغابايت
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

// Verify magic bytes for common image formats
function isValidImageSignature(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;

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

export async function POST(req: NextRequest) {
  try {
    // Only authenticated users (admins, center_admins, publishers, students) can upload
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: يجب تسجيل الدخول لرفع الملفات' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'يرجى إرفاق ملف الصورة المطلوب رفعه' },
        { status: 400 }
      );
    }

    // MIME type check (disallowing dangerous types like SVG/HTML)
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'نوع الملف غير مدعوم، يرجى اختيار صورة صالحة (PNG, JPG, WebP, AVIF)' },
        { status: 400 }
      );
    }

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميغابايت)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Deep content signature check
    if (!isValidImageSignature(buffer)) {
      return NextResponse.json(
        { success: false, error: 'محتوى الملف غير صالح أو تالف أو لا يتطابق مع صورة حقيقية' },
        { status: 400 }
      );
    }

    // Generate safe, server-controlled unique filename and path
    const extension = file.type.split('/')[1]?.replace('+xml', '') || 'jpg';
    const safeExt = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif'].includes(extension) ? extension : 'jpg';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const pathname = `courses/${uniqueId}.${safeExt}`;

    let blob;
    let isPrivate = false;

    try {
      blob = await put(pathname, buffer, {
        access: 'public',
        contentType: file.type,
      });
    } catch (err: any) {
      if (err.message?.includes('private store') || err.message?.includes('private access')) {
        isPrivate = true;
        blob = await put(pathname, buffer, {
          access: 'private',
          contentType: file.type,
        });
      } else {
        throw err;
      }
    }

    const publicAccessibleUrl = isPrivate
      ? `/api/blob?url=${encodeURIComponent(blob.url)}`
      : blob.url;

    return NextResponse.json({
      success: true,
      url: publicAccessibleUrl,
      rawUrl: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      isPrivate,
    });
  } catch (error: any) {
    console.error('Vercel Blob Upload Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء رفع الصورة، يرجى التحقق من اتصالك والمحاولة لاحقاً',
      },
      { status: 500 }
    );
  }
}
