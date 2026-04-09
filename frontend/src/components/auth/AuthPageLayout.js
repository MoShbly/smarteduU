'use client';

import AnimatedPage from '@/components/motion/AnimatedPage';
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
  return (
    <main className="auth-screen">
      <AnimatedPage className="auth-shell">
        <section className="auth-spotlight">
          <div className="auth-brand">
            <span className="auth-brand-mark">SC</span>
            <div>
              <strong>Smart Classroom</strong>
            </div>
          </div>

          <Badge tone="accent">{eyebrow}</Badge>
          <h1>{title}</h1>
          <p>{description}</p>

          <div className="auth-bullet-list">
            {bullets.map((item) => (
              <div className="auth-bullet-item" key={item}>
                <span className="auth-bullet-dot" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-panel">
          <header className="auth-panel-header">
            <Badge tone="neutral">{headerEyebrow}</Badge>
            <h2>{headerTitle}</h2>
            <p>{headerDescription}</p>
          </header>

          {children}

          {footer}
        </section>
      </AnimatedPage>
    </main>
  );
}
