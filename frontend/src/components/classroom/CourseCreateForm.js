'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function CourseCreateForm({ onSubmit, onSuccess }) {
  const t = useTranslations('teacherWorkspace');
  const [formState, setFormState] = useState({
    title: '',
    subject: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formState.title.trim()) {
      setError(t('courseTitleRequired'));
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const course = await onSubmit(formState);
      setFormState({
        title: '',
        subject: '',
        description: ''
      });
      setSuccess(t('courseCreateSuccess', { code: course.code }));
      await new Promise((resolve) => setTimeout(resolve, 650));
      onSuccess?.(course);
    } catch (submitError) {
      setError(submitError.message || t('courseCreateError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="workspace-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Input
          id="course-title"
          name="title"
          label={t('courseTitle')}
          value={formState.title}
          onChange={handleChange}
          placeholder={t('courseTitlePlaceholder')}
          required
        />

        <div className="inline-form-grid two-columns">
          <Input
            id="course-subject"
            name="subject"
            label={t('courseSubject')}
            value={formState.subject}
            onChange={handleChange}
            placeholder={t('courseSubjectPlaceholder')}
          />

          <Input
            id="course-code-preview"
            label={t('courseCodeAuto')}
            value={t('courseCodeAutoValue')}
            disabled
            readOnly
          />
        </div>

        <Input
          id="course-description"
          name="description"
          label={t('courseDescription')}
          value={formState.description}
          onChange={handleChange}
          placeholder={t('courseDescriptionPlaceholder')}
          multiline
          rows={5}
        />
      </div>

      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
      {success ? <p className="form-feedback form-feedback--success">{success}</p> : null}

      <div className="form-actions">
        <Button type="submit" loading={submitting}>
          {submitting ? t('creatingCourse') : t('createCourse')}
        </Button>
      </div>
    </form>
  );
}
