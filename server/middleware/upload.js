/**
 * File upload middleware — CarePath AI
 *
 * Multer configuration for:
 *   - Health report files (PDF, images, DOCX, TXT)
 *   - Credential/certificate documents (PDF, images)
 *
 * Files are stored on disk under server/uploads/<subdirectory>.
 * Reads UPLOAD_DIR and MAX_FILE_SIZE_MB from environment variables.
 */

'use strict';

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const UPLOAD_ROOT   = process.env.UPLOAD_DIR   || path.join(__dirname, '..', 'uploads');
const MAX_SIZE_MB   = Number(process.env.MAX_FILE_SIZE_MB || 10);
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Allowed MIME types for health reports
const REPORT_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

// Allowed MIME types for credential documents
const CREDENTIAL_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

// Ensure upload subdirectory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ── Storage factory ───────────────────────────────────────────────────────────
const diskStorage = (subdir) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dest = path.join(UPLOAD_ROOT, subdir);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      cb(null, `${base}_${unique}${ext}`);
    },
  });

// ── Health report upload ──────────────────────────────────────────────────────
const reportUpload = multer({
  storage: diskStorage('reports'),
  limits:  { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (REPORT_MIMES.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, JPG, PNG, DOCX, TXT`));
  },
});

// ── Credential document upload ────────────────────────────────────────────────
const credentialUpload = multer({
  storage: diskStorage('credentials'),
  limits:  { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (CREDENTIAL_MIMES.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, JPG, PNG`));
  },
});

module.exports = { reportUpload, credentialUpload };
