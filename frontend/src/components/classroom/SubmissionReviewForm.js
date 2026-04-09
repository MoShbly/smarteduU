'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { formatStatusLabel } from '@/lib/dashboard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SubmissionReviewForm({ submission, maxScore, onSubmit, onSuccess }) {
  const t = useTranslations('teacherWorkspace');
  const [grade, setGrade] = useState(
    submission?.grade === null || submission?.grade === undefined ? '' : String(submission.grade)
  );
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setGrade(submission?.grade === null || submission?.grade === undefined ? '' : String(submission.grade));
    setFeedback(submission?.feedback || '');
    setError('');
    setSuccess('');
  }, [submission?.id, submission?.grade, submission?.feedback]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await onSubmit(submission.id, {
        grade,
        feedback
      });
      setSuccess(t('reviewSuccess'));
      await new Promise((resolve) => setTimeout(resolve, 650));
      onSuccess?.();
    } catch (submitError) {
      setError(submitError.message || t('reviewError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="workspace-form review-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="inline-form-grid two-columns">
          <Input
            id={`grade-${submission.id}`}
            type="number"
            min="0"
            max={maxScore}
            step="1"
            label={t('reviewGrade')}
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            placeholder={t('reviewGradePlaceholder')}
          />

          <Input
            id={`status-${submission.id}`}
            label={t('reviewStatus')}
            value={formatStatusLabel(submission.status)}
            disabled
            readOnly
          />
        </div>

        <Input
          id={`feedback-${submission.id}`}
          label={t('reviewFeedback')}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder={t('reviewFeedbackPlaceholder')}
          multiline
          rows={4}
        />
      </div>

      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
      {success ? <p className="form-feedback form-feedback--success">{success}</p> : null}

      <div className="form-actions">
        <Button type="submit" loading={submitting}>
          {submitting ? t('reviewSaving') : t('reviewSubmit')}
        </Button>
      </div>
    </form>
  );
}
