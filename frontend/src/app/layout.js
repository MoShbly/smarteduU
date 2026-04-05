import { Manrope, Sora } from 'next/font/google';

import { AuthProvider } from '@/context/AuthContext';

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
  description: 'A polished graduation-project foundation for a classroom management platform'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
