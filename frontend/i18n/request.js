import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

const SUPPORTED_LOCALES = ['tr', 'en'];
const DEFAULT_LOCALE = 'tr';

const detectLocaleFromHeader = (acceptLanguageHeader = '') => {
  const normalized = acceptLanguageHeader.toLowerCase();

  if (normalized.startsWith('en') || normalized.includes(',en') || normalized.includes(' en')) {
    return 'en';
  }

  return DEFAULT_LOCALE;
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = SUPPORTED_LOCALES.includes(cookieLocale)
    ? cookieLocale
    : detectLocaleFromHeader(headerStore.get('accept-language') || '');

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default
  };
});
