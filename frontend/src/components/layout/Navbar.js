'use client';

import { motion } from 'framer-motion';
import { ChevronRight, LogOut, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/context/AuthContext';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export default function Navbar({ title, description, actions, onMenuToggle }) {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <motion.header
      className="topbar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26 }}
    >
      <div className="topbar-row">
        <div className="topbar-meta">
          <motion.button
            type="button"
            className="menu-trigger"
            onClick={onMenuToggle}
            aria-label={tCommon('openNavigation')}
            whileTap={{ scale: 0.96 }}
          >
            <Menu size={18} />
          </motion.button>

          <motion.div
            className="topbar-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.04 }}
          >
            <div className="topbar-breadcrumbs" aria-label={tNav('dashboardHome')}>
              <span>{tCommon('appName')}</span>
              <ChevronRight size={14} aria-hidden="true" />
              <span>{tNav('dashboardHome')}</span>
            </div>
            <h1 className="topbar-title">{title}</h1>
            <p className="topbar-description">{description}</p>
          </motion.div>
        </div>

        <div className="topbar-actions">
          <div className="topbar-shortcuts">{actions}</div>
          <div className="topbar-controls">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>

          <div className="topbar-identity">
            <div className="identity-avatar" aria-hidden="true">
              {getInitials(user?.name || tCommon('userFallback'))}
            </div>
            <div className="identity-copy">
              <strong>{user?.name || tCommon('userFallback')}</strong>
              <Badge tone="accent">
                {user?.role === 'teacher' ? tCommon('roleTeacher') : tCommon('roleStudent')}
              </Badge>
            </div>
          </div>

          <Button variant="ghost" onClick={handleLogout} icon={LogOut}>
            {tNav('logout')}
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
