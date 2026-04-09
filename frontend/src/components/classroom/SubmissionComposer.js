'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { formatProgressState, formatStatusLabel } from '@/lib/dashboard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProgressMeter from '@/components/ui/ProgressMeter';

const buildPayload = ({ assignmentId, content, selectedFile }) => {
  const formData = new FormData();
  formData.append('assignmentId', assignmentId);
  formData.append('content', content.trim());

  if (selectedFile) {
    formData.append('attachment', selectedFile);
  }

  return formData;
};

export default function SubmissionComposer({
  assignment,
  submission,
  progress,
  onDraft,
  onSubmit,
  onSuccess
}) {
  const t = useTranslations('studentWorkspace');
  const tCommon = useTranslations('common');
  const [content, setContent] = useState(submission?.content || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setContent(submission?.content || '');
    setSelectedFile(null);
    setError('');
    setSuccess('');
  }, [assignment?.id, submission?.id, submission?.content]);

  const isGraded = submission?.status === 'graded';
  const canSaveDraft = !isGraded && (!submission || submission.status === 'draft');
  const hasExistingAttachment = Boolean(submission?.attachmentUrl);
  const currentProgress = progress || assignment?.progress || null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!content.trim() && !selectedFile && !hasExistingAttachment) {
      setError(t('submissionInputRequired'));
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await onSubmit(buildPayload({
        assignmentId: assignment.id,
        content,
        selectedFile
      }));
      setSelectedFile(null);
      setSuccess(submission?.id ? t('submissionUpdateSuccess') : t('submissionCreateSuccess'));
      await new Promise((resolve) => setTimeout(resolve, 650));
      onSuccess?.();
    } catch (submitError) {
      setError(submitError.message || t('submissionCreateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraftSave = async () => {
    if (!onDraft) {
      return;
    }

    if (!content.trim() && !selectedFile && !hasExistingAttachment) {
      setError(t('submissionInputRequired'));
      return;
    }

    setSavingDraft(true);
    setError('');
    setSuccess('');

    try {
      await onDraft(buildPayload({
        assignmentId: assignment.id,
        content,
        selectedFile
      }));
      setSelectedFile(null);
      setSuccess(t('submissionDraftSuccess'));
    } catch (draftError) {
      setError(draftError.message || t('submissionDraftError'));
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <form className="workspace-form submission-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        {currentProgress ? (
          <ProgressMeter
            value={currentProgress.progressPercent}
            label={t('submissionProgress')}
            helper={formatProgressState(currentProgress.state, tCommon)}
            compact
          />
        ) : null}

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
            <span>{t('submissionStatusLabel')}: {formatStatusLabel(submission.status, tCommon)}</span>
            {submission.grade !== null && submission.grade !== undefined ? (
              <span>{t('submissionGradeLabel')}: {submission.grade}</span>
            ) : null}
          </div>
        ) : null}

        <label className={`field file-field ${isGraded ? 'is-disabled' : ''}`} htmlFor={`submission-file-${assignment.id}`}>
          <span className="field-label">{t('submissionFile')}</span>
          <span className="field-control file-input-row">
            <input
              id={`submission-file-${assignment.id}`}
              className="file-input-control"
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              disabled={isGraded}
            />
          </span>
          <span className="field-hint">
            {selectedFile
              ? t('submissionFileSelected', { name: selectedFile.name })
              : t('submissionFileHint')}
          </span>
        </label>

        {submission?.attachmentUrl ? (
          <p className="form-hint-text">
            <a
              className="resource-link"
              href={submission.attachmentUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('submissionAttachmentLink', {
                name: submission.attachmentName || t('submissionAttachmentDefault')
              })}
            </a>
          </p>
        ) : null}

        {submission?.feedback ? (
          <p className="form-hint-text">{t('submissionFeedback', { feedback: submission.feedback })}</p>
        ) : null}
        {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
        {success ? <p className="form-feedback form-feedback--success">{success}</p> : null}
      </div>

      <div className="form-actions">
        {onDraft && canSaveDraft ? (
          <Button
            type="button"
            variant="ghost"
            loading={savingDraft}
            disabled={isGraded || submitting}
            onClick={handleDraftSave}
          >
            {savingDraft ? t('savingDraft') : t('saveDraft')}
          </Button>
        ) : null}
        <Button type="submit" variant="secondary" loading={submitting} disabled={isGraded || savingDraft}>
          {submitting ? t('submittingAssignment') : submission?.id ? t('updateSubmission') : t('submitAssignment')}
        </Button>
      </div>
    </form>
  );
}
