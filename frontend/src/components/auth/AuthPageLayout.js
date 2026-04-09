'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import AnimatedPage from '@/components/motion/AnimatedPage';
import { getRevealMotion } from '@/lib/motion';
import Badge from '@/components/ui/Badge';

export default function AuthPageLayout({
  eyebrow,
  title,
  description,
  bullets,
  headerEyebrow,
  headerTitle,
  headerDescription,
  footer,
  children
}) {
  const t = useTranslations('auth');
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="auth-screen">
      <AnimatedPage className="auth-shell">
        <motion.section
          className="auth-spotlight"
          {...getRevealMotion(shouldReduceMotion, {
            y: 18,
            scale: 0.994,
            duration: 0.46
          })}
        >
          <div className="auth-brand">
            <span className="auth-brand-mark">SC</span>
            <div className="auth-brand-copy">
              <strong>Smart Classroom</strong>
              <span>{t('platformTagline')}</span>
            </div>
          </div>

          <div className="auth-copy-block">
            <Badge tone="accent">{eyebrow}</Badge>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          <div className="auth-proof-grid">
            {bullets.map((item, index) => (
              <article className="auth-proof-item" key={item}>
                <span className="auth-proof-index">{String(index + 1).padStart(2, '0')}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="auth-panel"
          {...getRevealMotion(shouldReduceMotion, {
            y: 22,
            scale: 0.99,
            duration: 0.42,
            delay: shouldReduceMotion ? 0 : 0.04
          })}
        >
          <header className="auth-panel-header">
            <Badge tone="neutral">{headerEyebrow}</Badge>
            <h2>{headerTitle}</h2>
            <p>{headerDescription}</p>
          </header>

          {children}

          {footer}
        </motion.section>
      </AnimatedPage>
    </main>
  );
}
