'use client';

import { LogOut, Menu, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

export default function Navbar({ title, description, onMenuToggle }) {
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="topbar-actions">
        <button type="button" className="menu-trigger" onClick={onMenuToggle}>
          <Menu size={18} />
        </button>
        <span className="role-chip">
          <Sparkles size={14} />
          {user?.role === 'teacher' ? 'Teacher' : 'Student'}
        </span>
        <span className="user-chip">{user?.name || 'User'}</span>
        <button type="button" className="button secondary-button" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
