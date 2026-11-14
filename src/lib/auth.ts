import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './db';
import User, { IUser, UserRole } from '@/models/User';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
    }
    // Only in local development fallback with an explicit warning, or require env
    throw new Error('JWT_SECRET is required. Please define it in your .env or environment variables.');
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  role?: string; // legacy support
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload, expiresIn: string = '7d'): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn } as any);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<IUser | null> {
  try {
    const authHeader = req.headers.get('authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookie = req.cookies.get('authorization');
      token = cookie?.value || '';
    }

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    await connectToDatabase();
    const user = await User.findById(payload.userId).select('-password');
    if (!user || user.deleteState) return null;

    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(req: NextRequest, allowedRoles?: string[]): Promise<IUser | null> {
  const user = await getAuthUser(req);
  if (!user) return null;

  if (allowedRoles && allowedRoles.length > 0) {
    // Normalize user roles array
    const userRoles = [...(user.roles || [])];
    const legacyRole = (user as any).role;
    if (legacyRole && !userRoles.includes(legacyRole)) {
      userRoles.push(legacyRole);
    }

    const hasPermission = allowedRoles.some((role) => userRoles.includes(role as UserRole));
    if (!hasPermission) return null;
  }

  return user;
}

export async function authorizeAdmin(req: NextRequest): Promise<{ authorized: true; user: IUser } | { authorized: false; response: NextResponse }> {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ isError: true, message: 'غير مصرح: يرجى تسجيل الدخول' }, { status: 401 }),
    };
  }

  const userRoles = [...(user.roles || [])];
  const legacyRole = (user as any).role;
  if (legacyRole && !userRoles.includes(legacyRole)) {
    userRoles.push(legacyRole);
  }

  const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');
  if (!isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json({ isError: true, message: 'ممنوع: ليس لديك الصلاحية الإدارية للوصول' }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}
