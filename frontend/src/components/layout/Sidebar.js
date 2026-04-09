'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  BookCopy,
  ClipboardCheck,
  LayoutDashboard,
  LibraryBig,
  LineChart,
  Sparkles
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/ui/Badge';
import { MOTION_EASE_SOFT, getPressMotion, getRevealMotion } from '@/lib/motion';

const iconMap = {
  '#overview': LayoutDashboard,
  '#insights': Sparkles,
  '#courses': LibraryBig,
  '#assignments': BookCopy,
  '#review': ClipboardCheck,
  '#completed': ClipboardCheck,
  '#progress': LineChart,
  '#activity': Activity
};

const Sidebar = memo(function Sidebar({ isOpen, onClose, sections = [] }) {
  const tCommon = useTranslations('common');
  const t = useTranslations('nav');
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [activeHash, setActiveHash] = useState('#overview');

  const defaultSections =
    user?.role === 'teacher'
      ? [
          { href: '#overview', label: t('overview') },
          { href: '#insights', label: t('insights') },
          { href: '#courses', label: t('courses') },
          { href: '#assignments', label: t('assignments') },
          { href: '#review', label: t('review') },
          { href: '#activity', label: t('activity') }
        ]
      : [
          { href: '#overview', label: t('overview') },
          { href: '#courses', label: t('courses') },
          { href: '#assignments', label: t('assignments') },
          { href: '#completed', label: t('completed') },
          { href: '#activity', label: t('activity') }
        ];

  const navItems = sections.length ? sections : defaultSections;

  useEffect(() => {
    const syncHash = () => {
      setActiveHash(window.location.hash || '#overview');
    };

    syncHash();
    window.addEventListener('hashchange', syncHash);

    return () => {
      window.removeEventListener('hashchange', syncHash);
    };
  }, []);

  const linkVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: shouldReduceMotion ? 0.16 : 0.2,
        delay: shouldReduceMotion ? 0 : 0.04 + index * 0.03,
        ease: MOTION_EASE_SOFT
      }
    })
  };

  return (
    <motion.aside
      className={`sidebar ${isOpen ? 'open' : ''}`}
      {...getRevealMotion(shouldReduceMotion, {
        y: 0,
        scale: 1,
        duration: 0.28
      })}
    >
      <div className="sidebar-content">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">SC</span>
          <div className="sidebar-brand-copy-block">
            <p className="sidebar-brand-title">{tCommon('appName')}</p>
            <span className="sidebar-brand-copy">{t('academicWorkspace')}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">{t('dashboardHome')}</span>
          {navItems.map((link, index) => {
            const LinkIcon = iconMap[link.href] || LayoutDashboard;

            return (
              <motion.a
                key={link.href}
                className={`nav-link ${activeHash === link.href ? 'active' : ''}`}
                href={link.href}
              onClick={onClose}
              variants={linkVariants}
              initial="hidden"
              animate="visible"
              custom={index}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      x: 2,
                      transition: { duration: 0.18, ease: MOTION_EASE_SOFT }
                    }
              }
              whileTap={getPressMotion(shouldReduceMotion)}
            >
                <span className="nav-link-icon">
                  <LinkIcon size={16} />
                </span>
                <span>{link.label}</span>
              </motion.a>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-identity">
            <strong>{user?.name || t('classroomUser')}</strong>
            <Badge tone="neutral">
              {user?.role === 'teacher' ? tCommon('roleTeacher') : tCommon('roleStudent')}
            </Badge>
          </div>
          <p>{user?.role === 'teacher' ? t('teacherWorkspace') : t('studentWorkspace')}</p>
        </div>
      </div>
    </motion.aside>
  );
});

export default Sidebar;
