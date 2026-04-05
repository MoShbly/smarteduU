'use client';

import { CircleCheckBig, GraduationCap, LibraryBig, TriangleAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const initialState = {
  name: '',
  email: '',
  password: '',
  role: 'student'
};

const roles = [
  {
    value: 'student',
    title: 'Student',
    description: 'Track courses, assignments, and submissions.',
    icon: GraduationCap
  },
  {
    value: 'teacher',
    title: 'Teacher',
    description: 'Manage courses, assignments, and academic activity.',
    icon: LibraryBig
  }
];

export default function AuthForm({ mode, onSubmit, error, successMessage }) {
  const isRegister = mode === 'register';
  const [formState, setFormState] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value
    }));
  };

  const handleRoleChange = (role) => {
    setFormState((currentState) => ({
      ...currentState,
      role
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {error ? (
        <div className="feedback-banner error">
          <TriangleAlert size={18} />
          <p>{error}</p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="feedback-banner success">
          <CircleCheckBig size={18} />
          <p>{successMessage}</p>
        </div>
      ) : null}

      {isRegister ? (
        <div className="form-row">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formState.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />
        </div>
      ) : null}

      <div className="form-row">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formState.email}
          onChange={handleChange}
          placeholder="name@smartclassroom.edu"
          required
        />
      </div>

      {isRegister ? (
        <div className="form-row">
          <label>Select Role</label>
          <div className="role-grid">
            {roles.map(({ value, title, description, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className={`role-option ${formState.role === value ? 'active' : ''}`}
                onClick={() => handleRoleChange(value)}
              >
                <Icon size={18} />
                <strong>{title}</strong>
                <span>{description}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="form-row">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formState.password}
          onChange={handleChange}
          placeholder="Minimum 6 characters"
          minLength={6}
          required
        />
      </div>

      <div className="form-actions">
        <motion.button
          className="button primary-button"
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.98 }}
          whileHover={{ y: -2 }}
        >
          {isSubmitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
        </motion.button>
      </div>
    </motion.form>
  );
}
