'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function CourseJoinForm({ onSubmit, onSuccess }) {
  const t = useTranslations('studentWorkspace');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!code.trim()) {
      setError(t('joinCourseCodeRequired'));
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const course = await onSubmit({ code });
      setCode('');
      setSuccess(t('joinCourseSuccess', { title: course.title }));
      await new Promise((resolve) => setTimeout(resolve, 650));
      onSuccess?.(course);
    } catch (submitError) {
      setError(submitError.message || t('joinCourseError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="workspace-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Input
          id="join-course-code"
          label={t('joinCourseLabel')}
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder={t('joinCoursePlaceholder')}
          required
        />

        {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
        {success ? <p className="form-feedback form-feedback--success">{success}</p> : null}

        <div className="form-actions">
          <Button type="submit" loading={submitting}>
            {submitting ? t('joiningCourse') : t('joinCourse')}
          </Button>
        </div>
      </div>
    </form>
  );
}
