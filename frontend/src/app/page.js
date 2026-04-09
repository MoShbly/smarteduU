import Link from 'next/link';
import { ArrowRight, BookOpenCheck, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import AnimatedPage from '@/components/motion/AnimatedPage';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

export default async function HomePage() {
  const t = await getTranslations('landing');

  const highlights = [
    {
      title: t('highlights.roleDashboardsTitle'),
      description: t('highlights.roleDashboardsDescription'),
      icon: LayoutDashboard
    },
    {
      title: t('highlights.postgresTitle'),
      description: t('highlights.postgresDescription'),
      icon: BookOpenCheck
    },
    {
      title: t('highlights.authTitle'),
      description: t('highlights.authDescription'),
      icon: ShieldCheck
    }
  ];

  return (
    <main className="landing-screen">
      <AnimatedPage className="landing-shell">
        <section className="landing-hero">
          <div className="landing-copy">
            <Badge tone="accent">{t('eyebrow')}</Badge>
            <h1>{t('title')}</h1>
            <p>{t('description')}</p>

            <div className="landing-actions">
              <Link href="/login" className="ui-button ui-button--primary ui-button--md">
                <span>{t('enterPlatform')}</span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/register" className="ui-button ui-button--secondary ui-button--md">
                {t('createAccount')}
              </Link>
            </div>
          </div>

          <Card className="landing-preview">
            <div className="landing-preview-bar">
              <span className="landing-preview-dot" />
              <span className="landing-preview-dot" />
              <span className="landing-preview-dot" />
            </div>

            <div className="landing-preview-grid">
              <div className="landing-preview-panel landing-preview-panel--primary">
                <span>{t('preview.teacherLabel')}</span>
                <strong>{t('preview.teacherValue')}</strong>
              </div>
              <div className="landing-preview-panel">
                <span>{t('preview.studentLabel')}</span>
                <strong>{t('preview.studentValue')}</strong>
              </div>
              <div className="landing-preview-panel">
                <span>{t('preview.flowLabel')}</span>
                <strong>{t('preview.flowValue')}</strong>
              </div>
            </div>
          </Card>
        </section>

        <section className="landing-highlight-grid">
          {highlights.map(({ title, description, icon: Icon }) => (
            <Card className="landing-highlight-card" key={title}>
              <span className="landing-highlight-icon">
                <Icon size={20} />
              </span>
              <h2>{title}</h2>
              <p>{description}</p>
            </Card>
          ))}
        </section>
      </AnimatedPage>
    </main>
  );
}
