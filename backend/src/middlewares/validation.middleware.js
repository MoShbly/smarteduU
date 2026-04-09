import { ROLE_VALUES } from '../constants/roles.js';
import ApiError from '../utils/ApiError.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 72;

export const validateRegisterInput = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, 'Name, email, password, and role are required');
  }

  if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 80) {
    throw new ApiError(400, 'Name must be between 3 and 80 characters');
  }

  if (typeof email !== 'string' || !emailPattern.test(email.toLowerCase())) {
    throw new ApiError(400, 'A valid email address is required');
  }

  if (!ROLE_VALUES.includes(role)) {
    throw new ApiError(400, 'Role must be either teacher or student');
  }

  if (
    typeof password !== 'string' ||
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new ApiError(
      400,
      `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`
    );
  }

  next();
};

export const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  if (typeof email !== 'string' || !emailPattern.test(email.toLowerCase())) {
    throw new ApiError(400, 'A valid email address is required');
  }

  if (
    typeof password !== 'string' ||
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new ApiError(400, 'Invalid credentials');
  }

  next();
};
