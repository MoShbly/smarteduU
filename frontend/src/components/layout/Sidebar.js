'use client';

import { ChevronRight, GraduationCap, LayoutDashboard, LibraryBig } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

export default function Sidebar({ isOpen, onClose, sections = [] }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const defaultSections =
    user?.role === 'teacher'
      ? [
          { href: '#overview', label: 'Overview' },
          { href: '#courses', label: 'Courses' },
          { href: '#assignments', label: 'Assignments' },
          { href: '#activity', label: 'Activity' }
        ]
      : [
          { href: '#overview', label: 'Overview' },
          { href: '#assignments', label: 'Assignments' },
          { href: '#courses', label: 'Courses' },
          { href: '#progress', label: 'Progress' }
        ];

  const navItems = sections.length ? sections : defaultSections;
  const WorkspaceIcon = user?.role === 'teacher' ? LibraryBig : GraduationCap;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-content">
        <div className="brand-block">
          <span className="eyebrow">Smart Classroom</span>
          <h2>Academic Workspace</h2>
          <p>A polished learning environment prepared for classroom operations.</p>
        </div>

        <div className="sidebar-user">
          <WorkspaceIcon size={18} />
          <strong>{user?.name || 'Classroom user'}</strong>
          <p>
            {user?.role === 'teacher'
              ? 'Teacher workspace for managing courses and assignments'
              : 'Student workspace for tracking coursework and submissions'}
          </p>
        </div>

        <nav className="sidebar-nav">
          <a className={`nav-link ${pathname === '/teacher' || pathname === '/student' ? 'active' : ''}`} href="#">
            <span>Dashboard Home</span>
            <LayoutDashboard size={16} />
          </a>

          {navItems.map((link) => (
            <a key={link.href} className="nav-link" href={link.href} onClick={onClose}>
              <span>{link.label}</span>
              <ChevronRight size={16} />
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          Professional SaaS-style foundation for the next development phase.
        </div>
      </div>
    </aside>
  );
}
