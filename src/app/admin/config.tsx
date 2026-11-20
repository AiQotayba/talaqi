import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export default async function Headers() {
    const cookieStore = await cookies();
    const token = cookieStore.get('authorization');

    if (!token?.value) {
        redirect('/auth?route=login');
    }

    const payload = verifyToken(token.value);
    if (!payload) {
        // If token is invalid or expired, clear cookies immediately to prevent loops
        redirect('/api/auth/logout?redirect=/auth?route=login');
    }

    const roles = payload.roles || [];
    const isAdmin = payload.role === 'admin' || roles.includes('admin') || roles.includes('super_admin');
    if (!isAdmin) {
        // Non-admin user trying to access admin dashboard -> send to student profile
        redirect('/profile');
    }

    return { Authorization: `Bearer ${token.value}` };
}
