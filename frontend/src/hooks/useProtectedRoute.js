'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ROLE_DASHBOARD_ROUTES, ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { clearAuthSession } from '@/lib/auth';

export function useProtectedRoute(allowedRoles) {
  const router = useRouter();
  const { loading, user } = useAuth();

  const isAllowed = Boolean(user) && (!allowedRoles || allowedRoles.includes(user.role));

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      clearAuthSession();
      router.replace(ROUTES.login);
      return;
    }

    if (!isAllowed) {
      router.replace(ROLE_DASHBOARD_ROUTES[user.role] || ROUTES.login);
    }
  }, [isAllowed, loading, router, user]);

  return {
    loading,
    isAllowed
  };
}
