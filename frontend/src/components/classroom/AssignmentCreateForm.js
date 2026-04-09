'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function AssignmentCreateForm({ course, onSubmit, onSuccess }) {
  const t = useTranslations('teacherWorkspace');
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: '100'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [course?.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!course?.id) {
      setError(t('assignmentSelectCourse'));
      return;
    }

    if (!formState.title.trim()) {
      setError(t('assignmentTitleRequired'));
      return;
    }

    if (!formState.dueDate) {
      setError(t('assignmentDueDateRequired'));
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await onSubmit({
        courseId: course.id,
        title: formState.title,
        description: formState.description,
        dueDate: formState.dueDate,
        maxScore: Number(formState.maxScore)
      });

      setFormState({
        title: '',
        description: '',
        dueDate: '',
        maxScore: '100'
      });
      setSuccess(t('assignmentCreateSuccess'));
      await new Promise((resolve) => setTimeout(resolve, 650));
      onSuccess?.();
    } catch (submitError) {
      setError(submitError.message || t('assignmentCreateError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="workspace-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Input
          id="assignment-title"
          name="title"
          label={t('assignmentTitle')}
          value={formState.title}
          onChange={handleChange}
          placeholder={t('assignmentTitlePlaceholder')}
          required
        />

        <div className="inline-form-grid two-columns">
          <Input
            id="assignment-due-date"
            type="datetime-local"
            name="dueDate"
            label={t('assignmentDueDate')}
            value={formState.dueDate}
            onChange={handleChange}
            required
          />

          <Input
            id="assignment-max-score"
            type="number"
            min="1"
            step="1"
            name="maxScore"
            label={t('assignmentMaxScore')}
            value={formState.maxScore}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          id="assignment-description"
          name="description"
          label={t('assignmentDescription')}
          value={formState.description}
          onChange={handleChange}
          placeholder={t('assignmentDescriptionPlaceholder')}
          multiline
          rows={5}
        />
      </div>

      {course ? (
        <p className="form-hint-text">
          {t('assignmentCourseHint', { title: course.title, code: course.code })}
        </p>
      ) : (
        <p className="form-feedback form-feedback--error">{t('assignmentSelectCourse')}</p>
      )}

      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
      {success ? <p className="form-feedback form-feedback--success">{success}</p> : null}

      <div className="form-actions">
        <Button type="submit" loading={submitting} disabled={!course}>
          {submitting ? t('creatingAssignment') : t('createAssignment')}
        </Button>
      </div>
    </form>
  );
}
