import { NextResponse, NextRequest } from 'next/server';
import { getUser } from '@/actions/auth';

// Role-based route mapping
const ROLE_PROTECTED_ROUTES = {
    '/admin/manage-admins': ['superadmin'],
    '/admin': ['admin', 'superadmin'],
};

const PUBLIC_ROUTES = ['/login', '/recovery'];
const PROTECTED_ROUTES = ['/profile', '/profile/', '/admin', '/admin/', '/return', '/return/', '/inventory'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
    const response = NextResponse.next();

    try {
        const userResponse = await getUser();
        const isAuthenticated = userResponse.success && userResponse.data;
        console.log(userResponse);

        if (isAuthenticated) {
            if (isPublicRoute) {
                return NextResponse.redirect(new URL('/', request.url));
            }

            const userRole = userResponse.data!.labels[0]; // labels[0] is the user's role.

            // Handle role-based route protection
            for (const [route, allowedRoles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
                if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
                    return NextResponse.redirect(new URL('/', request.url));
                }
            }
            return response;
        }
        // Unauthenticated, clear cookies
        response.cookies.delete('session');

        if (isProtectedRoute || !isPublicRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        return response;
    } catch {
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: [
        '/',
        '/login',
        '/recovery',
        '/profile',
        '/return',
        '/return/:path*', // Add support for dynamic return routes
        '/profile/:path*',
        '/admin/:path*',
        '/superadmin/:path*',
    ],
};
