'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { formatStatusLabel } from '@/lib/dashboard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SubmissionComposer({ assignment, submission, onSubmit, onSuccess }) {
  const t = useTranslations('studentWorkspace');
  const [content, setContent] = useState(submission?.content || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setContent(submission?.content || '');
    setError('');
    setSuccess('');
  }, [assignment?.id, submission?.id, submission?.content]);

  const isGraded = submission?.status === 'graded';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!content.trim()) {
      setError(t('submissionContentRequired'));
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await onSubmit({
        assignmentId: assignment.id,
        content
      });
      setSuccess(submission?.id ? t('submissionUpdateSuccess') : t('submissionCreateSuccess'));
      await new Promise((resolve) => setTimeout(resolve, 650));
      onSuccess?.();
    } catch (submitError) {
      setError(submitError.message || t('submissionCreateError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="workspace-form submission-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Input
          id={`submission-${assignment.id}`}
          label={t('submissionContent')}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t('submissionPlaceholder')}
          multiline
          rows={6}
          disabled={isGraded}
          required
        />

        {submission ? (
          <div className="submission-meta-strip">
            <span>{t('submissionStatusLabel')}: {formatStatusLabel(submission.status)}</span>
            {submission.grade !== null && submission.grade !== undefined ? (
              <span>{t('submissionGradeLabel')}: {submission.grade}</span>
            ) : null}
          </div>
        ) : null}

        {submission?.feedback ? (
          <p className="form-hint-text">{t('submissionFeedback', { feedback: submission.feedback })}</p>
        ) : null}
        {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
        {success ? <p className="form-feedback form-feedback--success">{success}</p> : null}
      </div>

      <div className="form-actions">
        <Button type="submit" variant="secondary" loading={submitting} disabled={isGraded}>
          {submitting ? t('submittingAssignment') : submission?.id ? t('updateSubmission') : t('submitAssignment')}
        </Button>
      </div>
    </form>
  );
}
