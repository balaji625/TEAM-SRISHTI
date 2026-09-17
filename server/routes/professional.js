/**
 * Professional routes — CarePath AI
 *
 * All routes require a valid JWT (verifyToken) and PROFESSIONAL role.
 */

'use strict';

const express  = require('express');
const { body } = require('express-validator');

const c = require('../controllers/professionalController');
const referralController = require('../controllers/referralController');
const { verifyToken }        = require('../middleware/auth');
const { requireRole }        = require('../middleware/rbac');
const { credentialUpload }   = require('../middleware/upload');
const { ROLES, CONSULTATION_MODES } = require('../utils/constants');

const router = express.Router();

router.use(verifyToken, requireRole(ROLES.PROFESSIONAL));

// ── Validation: profile ────────────────────────────────────────────────────────
const profileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').optional().trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').optional().trim().isLength({ min: 7, max: 20 }).withMessage('Phone must be 7–20 characters'),
  body('specialization').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Specialization must be 2–100 characters'),
  body('qualification').optional().trim().isLength({ max: 200 }).withMessage('Qualification must not exceed 200 characters'),
  body('experience').optional().isInt({ min: 0, max: 60 }).withMessage('Experience must be between 0 and 60 years'),
  body('licenseNumber').optional().trim().isLength({ max: 50 }).withMessage('License number must not exceed 50 characters'),
  body('bio').optional().trim().isLength({ max: 2000 }).withMessage('Bio must not exceed 2000 characters'),
  body('consultationModes')
    .optional().isArray().withMessage('consultationModes must be an array')
    .custom((arr) => {
      const valid = Object.values(CONSULTATION_MODES);
      for (const mode of arr) {
        if (!valid.includes(mode)) throw new Error(`Invalid consultation mode: ${mode}`);
      }
      return true;
    }),
];

// ── Profile ────────────────────────────────────────────────────────────────────
router.get('/profile',      c.getProfile);
router.put('/profile',      profileValidation, c.upsertProfile);

// ── Associations ───────────────────────────────────────────────────────────────
router.get('/associations',         c.getAssociations);
router.post('/associations/request', c.requestAssociation);

// ── Notifications ──────────────────────────────────────────────────────────────
router.get('/notifications',         c.getNotifications);
router.put('/notifications/read-all', c.markAllNotificationsRead);
router.put('/notifications/:id/read', c.markNotificationRead);

// ── Appointments ───────────────────────────────────────────────────────────────
router.get('/appointments',                    c.getAppointments);
router.put('/appointments/:id/status',         c.updateAppointmentStatus);

// ── Availability ───────────────────────────────────────────────────────────────
router.put('/availability', c.updateAvailability);

// ── Requests ───────────────────────────────────────────────────────────────────
router.get('/requests',  c.getRequests);
router.post('/requests', c.sendRequest);

// ── Credentials (document upload) ─────────────────────────────────────────────
router.post('/credentials',          credentialUpload.single('document'), c.uploadCredential);
router.delete('/credentials/:credId', c.deleteCredential);

// ── Referrals (professional creates/manages referrals for patients) ─────────────
router.get('/referrals',            referralController.listProfessionalReferrals);
router.post('/referrals',           referralController.createProfessionalReferral);
router.get('/referrals/:id',        referralController.getProfessionalReferral);
router.put('/referrals/:id/status', referralController.updateReferralStatus);

module.exports = router;
