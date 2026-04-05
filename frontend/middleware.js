import { NextResponse } from 'next/server';

const AUTH_PATHS = ['/login', '/register'];

export function middleware(request) {
  const token = request.cookies.get('smart_classroom_token')?.value;
  const role = request.cookies.get('smart_classroom_role')?.value;
  const { pathname } = request.nextUrl;

  if (AUTH_PATHS.some((path) => pathname.startsWith(path)) && token && role) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === 'teacher' ? '/teacher' : '/student';
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/teacher')) {
    if (!token) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }

    if (role !== 'teacher') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/student';
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (pathname.startsWith('/student')) {
    if (!token) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }

    if (role !== 'student') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/teacher';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/teacher/:path*', '/student/:path*']
};

