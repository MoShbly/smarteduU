'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import StatePanel from '@/components/ui/StatePanel';
import { useAuth } from '@/context/AuthContext';

export default function AuthGuard({ allowedRoles, children }) {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === 'teacher' ? '/teacher' : '/student');
    }
  }, [allowedRoles, loading, router, user]);

  if (loading) {
    return (
      <main className="screen-state">
        <StatePanel
          variant="loading"
          title="Preparing your workspace"
          description="We are restoring your session and verifying access permissions."
        />
      </main>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return children;
}
