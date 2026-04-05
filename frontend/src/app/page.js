import Link from 'next/link';
import { ArrowRight, BookOpenCheck, LayoutDashboard, ShieldCheck } from 'lucide-react';

import AnimatedPage from '@/components/motion/AnimatedPage';

const highlights = [
  {
    title: 'Role-Based Dashboards',
    description: 'Teacher and student experiences are separated cleanly for presentation and scaling.',
    icon: LayoutDashboard
  },
  {
    title: 'PostgreSQL + Prisma',
    description: 'A relational backend foundation designed for academic data and future extension.',
    icon: BookOpenCheck
  },
  {
    title: 'Secure Authentication',
    description: 'JWT-based authentication with protected routes and role-aware rendering.',
    icon: ShieldCheck
  }
];

export default function HomePage() {
  return (
    <main className="landing-screen">
      <AnimatedPage className="landing-shell">
        <section className="landing-hero">
          <span className="eyebrow">Graduation Project Demo Foundation</span>
          <h1>Smart Classroom</h1>
          <p>
            A professional classroom platform starter with a polished dashboard experience,
            relational data architecture, JWT authentication, and Docker-ready development.
          </p>

          <div className="hero-actions">
            <Link href="/login" className="button primary-button">
              Enter Platform
              <ArrowRight size={18} />
            </Link>
            <Link href="/register" className="button secondary-button">
              Create Account
            </Link>
          </div>
        </section>

        <section className="highlight-grid">
          {highlights.map(({ title, description, icon: Icon }) => (
            <article className="highlight-card" key={title}>
              <span className="highlight-icon">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </section>
      </AnimatedPage>
    </main>
  );
}
