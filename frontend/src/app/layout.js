import { Manrope, Sora } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import AppProviders from '@/providers/AppProviders';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans'
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display'
});

export const metadata = {
  title: 'Smart Classroom',
  description: 'A modern academic operations platform for courses, assignments, and student workflows'
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${manrope.variable} ${sora.variable}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
