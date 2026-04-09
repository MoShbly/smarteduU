'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import AuthForm from '@/components/auth/AuthForm';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (values) => {
    setError('');
    setSuccessMessage('');

    try {
      const result = await login(values);
      setSuccessMessage(t('loginSuccess'));
      await new Promise((resolve) => setTimeout(resolve, 350));
      router.replace(result.user.role === 'teacher' ? '/teacher' : '/student');
    } catch (submitError) {
      setError(submitError.message || t('validationSubmitFailed'));
    }
  };

  return (
    <AuthPageLayout
      eyebrow={t('secureSignIn')}
      title={t('spotlightLoginTitle')}
      description={t('spotlightLoginDescription')}
      bullets={[t('loginBullet1'), t('loginBullet2'), t('loginBullet3')]}
      headerEyebrow={t('welcomeBack')}
      headerTitle={t('login')}
      headerDescription={t('loginDescription')}
      footer={
        <p className="auth-footer">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-link">
            {t('createOne')}
          </Link>
        </p>
      }
    >
      <AuthForm
        mode="login"
        onSubmit={handleSubmit}
        error={error}
        successMessage={successMessage}
      />
    </AuthPageLayout>
  );
}
