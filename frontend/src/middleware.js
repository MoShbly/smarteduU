import { NextResponse } from 'next/server';

const AUTH_PATHS = ['/login', '/register'];
const SUPPORTED_LOCALES = ['tr', 'en'];
const DEFAULT_LOCALE = 'tr';
const VALID_ROLES = ['teacher', 'student'];

const detectLocaleFromHeader = (acceptLanguageHeader = '') => {
  const normalized = acceptLanguageHeader.toLowerCase();

  if (normalized.startsWith('en') || normalized.includes(',en') || normalized.includes(' en')) {
    return 'en';
  }

  return DEFAULT_LOCALE;
};

const resolveLocale = (request) => {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  if (SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  return detectLocaleFromHeader(request.headers.get('accept-language') || '');
};

const withLocaleCookie = (request, response) => {
  response.cookies.set('NEXT_LOCALE', resolveLocale(request), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  });

  return response;
};

export function middleware(request) {
  const token = request.cookies.get('smart_classroom_token')?.value;
  const roleCookie = request.cookies.get('smart_classroom_role')?.value;
  const role = VALID_ROLES.includes(roleCookie) ? roleCookie : '';
  const { pathname } = request.nextUrl;

  if (AUTH_PATHS.some((path) => pathname.startsWith(path)) && token && role) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === 'teacher' ? '/teacher' : '/student';
    return withLocaleCookie(request, NextResponse.redirect(redirectUrl));
  }

  if (pathname.startsWith('/teacher')) {
    if (!token) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return withLocaleCookie(request, NextResponse.redirect(redirectUrl));
    }

    if (role !== 'teacher') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/student';
      return withLocaleCookie(request, NextResponse.redirect(redirectUrl));
    }
  }

  if (pathname.startsWith('/student')) {
    if (!token) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return withLocaleCookie(request, NextResponse.redirect(redirectUrl));
    }

    if (role !== 'student') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/teacher';
      return withLocaleCookie(request, NextResponse.redirect(redirectUrl));
    }
  }

  return withLocaleCookie(request, NextResponse.next());
}

export const config = {
  matcher: ['/', '/login', '/register', '/teacher/:path*', '/student/:path*']
};
