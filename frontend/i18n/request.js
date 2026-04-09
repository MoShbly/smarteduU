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
  const locale = 'tr'; // Force TR exclusively as requested

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default
  };
});
