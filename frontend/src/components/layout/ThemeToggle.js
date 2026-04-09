'use client';

import { Moon, SunMedium } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const THEME_STORAGE_KEY = 'smartclassroom-theme';

const resolveInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export default function ThemeToggle() {
  const t = useTranslations('common');
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const nextTheme = resolveInitialTheme();
    setTheme(nextTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [mounted, theme]);

  const isDark = theme === 'dark';
  const Icon = isDark ? SunMedium : Moon;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      aria-label={isDark ? t('themeLight') : t('themeDark')}
      title={isDark ? t('themeLight') : t('themeDark')}
    >
      <span className="theme-toggle-track" />
      <span className="theme-toggle-icon" aria-hidden="true">
        <Icon size={16} />
      </span>
    </button>
  );
}
