'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import AuthForm from '@/components/auth/AuthForm';
import AnimatedPage from '@/components/motion/AnimatedPage';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (values) => {
    setError('');
    setSuccessMessage('');

    try {
      const result = await register(values);
      setSuccessMessage('Account created successfully. Redirecting...');
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
          <span className="eyebrow">Account Setup</span>
          <h2>Start your Smart Classroom journey with a role-aware academic workspace.</h2>
          <p>
            Create either a teacher or student profile and enter a dashboard experience designed to
            feel polished, responsive, and ready for a graduation project demonstration.
          </p>
          <ul>
            <li>Teacher accounts manage courses, assignments, and classroom activity</li>
            <li>Student accounts follow coursework, submissions, and progress</li>
            <li>Structured relational backend ready for future development phases</li>
          </ul>
        </section>

        <section className="auth-panel">
          <header>
            <span className="eyebrow">New Account</span>
            <h1>Register</h1>
            <p>Create a teacher or student account for the Smart Classroom MVP.</p>
          </header>

          <AuthForm
            mode="register"
            onSubmit={handleSubmit}
            error={error}
            successMessage={successMessage}
          />

          <p className="auth-footer">
            Already registered?{' '}
            <Link href="/login" className="text-link">
              Login here
            </Link>
          </p>
        </section>
      </AnimatedPage>
    </main>
  );
}
