'use client';

import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

const locales = ['tr', 'en'];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const router = useRouter();

  const setLocale = (nextLocale) => {
    if (nextLocale === locale) {
      return;
    }

    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  };

  return (
    <div className="language-switcher" aria-label={t('language')}>
      <span className="language-switcher-icon">
        <Languages size={14} />
      </span>
      <div className="language-switcher-options">
        {locales.map((item) => (
          <button
            key={item}
            type="button"
            className={`locale-button ${locale === item ? 'active' : ''}`}
            onClick={() => setLocale(item)}
            aria-pressed={locale === item}
          >
            {item === 'tr' ? t('langTr') : t('langEn')}
          </button>
        ))}
      </div>
    </div>
  );
}
