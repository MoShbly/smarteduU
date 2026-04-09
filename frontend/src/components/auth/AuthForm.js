'use client';

import { CircleCheckBig, Eye, EyeOff, GraduationCap, LibraryBig, TriangleAlert } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { getHoverLift, getRevealMotion, MOTION_EASE_SOFT } from '@/lib/motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const initialState = {
  name: '',
  email: '',
  password: '',
  role: 'student'
};

export default function AuthForm({ mode, onSubmit, error, successMessage }) {
  const t = useTranslations('auth');
  const isRegister = mode === 'register';
  const shouldReduceMotion = useReducedMotion();
  const [formState, setFormState] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    {
      value: 'student',
      title: t('student'),
      description: t('studentDescription'),
      icon: GraduationCap
    },
    {
      value: 'teacher',
      title: t('teacher'),
      description: t('teacherDescription'),
      icon: LibraryBig
    }
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: ''
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (isRegister && !formState.name.trim()) {
      nextErrors.name = t('validationNameRequired');
    } else if (isRegister && formState.name.trim().length < 3) {
      nextErrors.name = t('validationNameLength');
    }

    if (!formState.email.trim()) {
      nextErrors.email = t('validationEmailRequired');
    } else if (!/^\S+@\S+\.\S+$/.test(formState.email)) {
      nextErrors.email = t('validationEmailInvalid');
    }

    if (!formState.password) {
      nextErrors.password = t('validationPasswordRequired');
    } else if (formState.password.length < 6) {
      nextErrors.password = t('validationPasswordLength');
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = isRegister
        ? formState
        : {
            email: formState.email,
            password: formState.password
          };

      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      className="auth-form"
      onSubmit={handleSubmit}
      {...getRevealMotion(shouldReduceMotion, {
        y: 16,
        scale: 0.996,
        duration: 0.34
      })}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {error ? (
          <motion.div
            key="error"
            className="feedback-banner feedback-banner--error"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: MOTION_EASE_SOFT }}
          >
            <TriangleAlert size={18} />
            <p>{error}</p>
          </motion.div>
        ) : null}

        {successMessage ? (
          <motion.div
            key="success"
            className="feedback-banner feedback-banner--success"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: MOTION_EASE_SOFT }}
          >
            <CircleCheckBig size={18} />
            <p>{successMessage}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isRegister ? (
        <Input
          id="name"
          name="name"
          label={t('fullName')}
          type="text"
          value={formState.name}
          onChange={handleChange}
          placeholder={t('fullNamePlaceholder')}
          error={fieldErrors.name}
          required
          autoComplete="name"
        />
      ) : null}

      <Input
        id="email"
        name="email"
        label={t('email')}
        type="email"
        value={formState.email}
        onChange={handleChange}
        placeholder={t('emailPlaceholder')}
        error={fieldErrors.email}
        required
        autoComplete="email"
        autoCapitalize="none"
      />

      {isRegister ? (
        <div className="field">
          <span className="field-label">{t('selectRole')}</span>
          <div className="role-grid">
            {roles.map(({ value, title, description, icon: Icon }) => (
              <motion.button
                key={value}
                type="button"
                className={`role-option ${formState.role === value ? 'active' : ''}`}
                onClick={() =>
                  setFormState((currentState) => ({
                    ...currentState,
                    role: value
                  }))
                }
                whileHover={getHoverLift(shouldReduceMotion, -3)}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
              >
                <span className="role-option-icon">
                  <Icon size={18} />
                </span>
                <strong>{title}</strong>
                <span>{description}</span>
              </motion.button>
            ))}
          </div>
        </div>
      ) : null}

      <Input
        id="password"
        name="password"
        label={t('password')}
        type={showPassword ? 'text' : 'password'}
        value={formState.password}
        onChange={handleChange}
        placeholder={t('passwordPlaceholder')}
        error={fieldErrors.password}
        required
        autoComplete={isRegister ? 'new-password' : 'current-password'}
        hint={!fieldErrors.password ? t('passwordHint') : ''}
        trailingControl={
          <button
            type="button"
            className="field-action-button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            title={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <div className="form-actions">
        <Button type="submit" loading={isSubmitting} fullWidth>
          {isSubmitting ? t('pleaseWait') : isRegister ? t('register') : t('login')}
        </Button>
      </div>
    </motion.form>
  );
}
