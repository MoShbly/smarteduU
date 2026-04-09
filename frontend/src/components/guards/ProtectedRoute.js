'use client';

import { useTranslations } from 'next-intl';

import StatePanel from '@/components/ui/StatePanel';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function ProtectedRoute({ allowedRoles, children }) {
  const t = useTranslations('guard');
  const { loading, isAllowed } = useProtectedRoute(allowedRoles);

  if (loading) {
    return (
      <main className="screen-state">
        <StatePanel
          variant="loading"
          title={t('preparingTitle')}
          description={t('preparingDescription')}
        />
      </main>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return children;
}
