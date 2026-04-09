'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { MOTION_EASE_SOFT, getRevealMotion } from '@/lib/motion';

export default function AppShell({ title, description, sections = [], actions, children }) {
  const t = useTranslations('common');
  const shouldReduceMotion = useReducedMotion();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <motion.div
      className="app-shell"
      {...getRevealMotion(shouldReduceMotion, {
        y: 10,
        scale: 1,
        duration: 0.26
      })}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sections={sections}
      />
      <motion.button
        type="button"
        className={`shell-overlay ${sidebarOpen ? 'visible' : ''}`}
        aria-label={t('closeNavigation')}
        onClick={() => setSidebarOpen(false)}
        initial={false}
        animate={{ opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.2, ease: MOTION_EASE_SOFT }}
      />

      <main className="main-panel">
        <Navbar
          title={title}
          description={description}
          actions={actions}
          onMenuToggle={() => setSidebarOpen((current) => !current)}
        />
        <section className="main-content">{children}</section>
      </main>
    </motion.div>
  );
}
