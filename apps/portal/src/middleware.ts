import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const authCookie = request.cookies.get('adminToken');
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
    const isApiRoute = request.nextUrl.pathname.startsWith('/api');
    const isChatRoute = request.nextUrl.pathname.startsWith('/chat');

    // Rotas públicas que não precisam de autenticação
    if (isAuthRoute || isChatRoute || isApiRoute) {
        return NextResponse.next();
    }

    // Se tentar acessar a raiz ou dashboard sem cookie, redireciona para login
    if (!authCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images (public images)
         */
        '/((?!_next/static|_next/image|favicon.ico|eva-avatar).*)',
    ],
};
