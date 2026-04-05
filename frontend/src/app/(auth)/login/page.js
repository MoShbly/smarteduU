'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import AuthForm from '@/components/auth/AuthForm';
import AnimatedPage from '@/components/motion/AnimatedPage';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (values) => {
    setError('');
    setSuccessMessage('');

    try {
      const result = await login(values);
      setSuccessMessage('Login successful. Redirecting to your dashboard...');
      await new Promise((resolve) => setTimeout(resolve, 350));
      router.replace(result.user.role === 'teacher' ? '/teacher' : '/student');
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <main className="auth-screen">
      <AnimatedPage className="auth-shell">
        <section className="auth-spotlight">
          <span className="eyebrow">Secure Sign In</span>
          <h2>Return to your classroom workspace with a smoother academic dashboard.</h2>
          <p>
            Smart Classroom is designed to present your graduation project as a modern academic
            SaaS platform with clear role separation, responsive dashboards, and structured data.
          </p>
          <ul>
            <li>JWT-protected access for teacher and student roles</li>
            <li>Responsive dashboard experience for project demo sessions</li>
            <li>Professional UI styling with subtle motion and hierarchy</li>
          </ul>
        </section>

        <section className="auth-panel">
          <header>
            <span className="eyebrow">Welcome Back</span>
            <h1>Login</h1>
            <p>Access the Smart Classroom dashboard that matches your role.</p>
          </header>

          <AuthForm
            mode="login"
            onSubmit={handleSubmit}
            error={error}
            successMessage={successMessage}
          />

          <p className="auth-footer">
            Do not have an account?{' '}
            <Link href="/register" className="text-link">
              Create one
            </Link>
          </p>
        </section>
      </AnimatedPage>
    </main>
  );
}
