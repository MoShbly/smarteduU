'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import AuthForm from '@/components/auth/AuthForm';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (values) => {
    setError('');
    setSuccessMessage('');

    try {
      const result = await register(values);
      setSuccessMessage(t('registerSuccess'));
      await new Promise((resolve) => setTimeout(resolve, 350));
      router.replace(result.user.role === 'teacher' ? '/teacher' : '/student');
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <AuthPageLayout
      eyebrow={t('accountSetup')}
      title={t('spotlightRegisterTitle')}
      description={t('spotlightRegisterDescription')}
      bullets={[t('registerBullet1'), t('registerBullet2'), t('registerBullet3')]}
      headerEyebrow={t('newAccount')}
      headerTitle={t('register')}
      headerDescription={t('registerDescription')}
      footer={
        <p className="auth-footer">
          {t('alreadyRegistered')}{' '}
          <Link href="/login" className="text-link">
            {t('loginHere')}
          </Link>
        </p>
      }
    >
      <AuthForm
        mode="register"
        onSubmit={handleSubmit}
        error={error}
        successMessage={successMessage}
      />
    </AuthPageLayout>
  );
}
