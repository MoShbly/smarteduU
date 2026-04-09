import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import multer from 'multer';

import ApiError from '../utils/ApiError.js';

const submissionsDirectory = path.join(process.cwd(), 'uploads', 'submissions');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedMimeTypes = new Set([
  'application/msword',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'image/jpeg',
  'image/png',
  'text/csv',
  'text/markdown',
  'text/plain'
]);

fs.mkdirSync(submissionsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, submissionsDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

const fileFilter = (_req, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new ApiError(400, 'Unsupported file type for assignment submissions'));
    return;
  }

  callback(null, true);
};

export const submissionUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});
