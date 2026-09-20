/**
 * Expert routes — CarePath AI
 *
 * All routes require a valid JWT (verifyToken) and EXPERT role.
 *
 * GET  /api/expert/profile            — fetch own expert profile
 * PUT  /api/expert/profile            — create or update expert profile
 * GET  /api/expert/availability       — fetch own availability
 * PUT  /api/expert/availability       — save own weekly availability
 * GET  /api/expert/credentials        — list own credentials
 * POST /api/expert/credentials        — add a credential (with optional file)
 * DELETE /api/expert/credentials/:id  — remove a credential
 */

'use strict';

const express  = require('express');
const { body } = require('express-validator');

const expertController = require('../controllers/expertController');
const { verifyToken }  = require('../middleware/auth');
const { requireRole }  = require('../middleware/rbac');
const { credentialUpload } = require('../middleware/upload');
const { ROLES, CONSULTATION_MODES } = require('../utils/constants');

const router = express.Router();

router.use(verifyToken, requireRole(ROLES.EXPERT));

// ── Validation ────────────────────────────────────────────────────────────────
const profileValidation = [
  body('name')
    .optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .optional().trim().isEmail().withMessage('Valid email required').normalizeEmail(),

  body('phone')
    .optional().trim()
    .isLength({ min: 7, max: 20 }).withMessage('Phone must be 7–20 characters'),

  body('specialization')
    .optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Specialization must be 2–100 characters'),

  body('qualification')
    .optional().trim()
    .isLength({ max: 200 }).withMessage('Qualification must not exceed 200 characters'),

  body('experience')
    .optional()
    .isInt({ min: 0, max: 60 }).withMessage('Experience must be between 0 and 60 years'),

  body('bio')
    .optional().trim()
    .isLength({ max: 2000 }).withMessage('Bio must not exceed 2000 characters'),

  body('consultationModes')
    .optional()
    .isArray().withMessage('consultationModes must be an array')
    .custom((arr) => {
      const valid = Object.values(CONSULTATION_MODES);
      for (const mode of arr) {
        if (!valid.includes(mode)) throw new Error(`Invalid consultation mode: ${mode}`);
      }
      return true;
    }),
];

// ── Routes ────────────────────────────────────────────────────────────────────
router.get('/profile',      expertController.getProfile);
router.put('/profile',      profileValidation, expertController.upsertProfile);

// ── Availability routes ────────────────────────────────────────────────────────
router.get('/availability', expertController.getAvailability);
router.put('/availability', expertController.saveAvailability);

// ── Credential routes ──────────────────────────────────────────────────────────
router.get('/credentials',            expertController.getCredentials);
router.post('/credentials',           credentialUpload.single('document'), expertController.addCredential);
router.delete('/credentials/:credId', expertController.deleteCredential);

// ── Consultation routes ────────────────────────────────────────────────────────
router.get('/consultations',               expertController.getConsultations);
router.put('/consultations/:id/status',    expertController.updateConsultationStatus);

// ── Request routes (outgoing — expert sends to hospital or admin) ─────────────
router.get('/requests',              expertController.getMyRequests);
router.post('/requests/to-hospital', expertController.sendRequestToHospital);
router.post('/requests/to-admin',    expertController.sendRequestToAdmin);

// ── Incoming request routes (from users directed at this expert) ───────────────
router.get('/incoming-requests',          expertController.getIncomingRequests);
router.put('/incoming-requests/:id',      expertController.updateIncomingRequest);

module.exports = router;
