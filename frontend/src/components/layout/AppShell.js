'use client';

import { useState } from 'react';

import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppShell({ title, description, sections = [], children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sections={sections}
      />
      <button
        type="button"
        className={`shell-overlay ${sidebarOpen ? 'visible' : ''}`}
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />

      <main className="main-panel">
        <Navbar
          title={title}
          description={description}
          onMenuToggle={() => setSidebarOpen((current) => !current)}
        />
        {children}
      </main>
    </div>
  );
}
