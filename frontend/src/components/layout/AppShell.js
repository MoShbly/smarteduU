'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppShell({ title, description, sections = [], actions, children }) {
  const t = useTranslations('common');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <motion.div
      className="app-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
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
        transition={{ duration: 0.2 }}
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
