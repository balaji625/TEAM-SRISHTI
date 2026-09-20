/**
 * User routes — CarePath AI
 *
 * All routes require a valid JWT (verifyToken) and USER role (requireRole).
 *
 * GET  /api/user/profile            — fetch own profile
 * PUT  /api/user/profile            — update basic profile fields
 * PUT  /api/user/health-profile     — update health profile snapshot
 * PUT  /api/user/consent            — update consent preferences
 *
 * GET  /api/user/appointments       — list own appointments
 * POST /api/user/appointments       — book new appointment
 * GET  /api/user/appointments/:id   — single appointment
 * PUT  /api/user/appointments/:id/cancel — cancel appointment
 *
 * GET  /api/user/notifications          — list notifications
 * GET  /api/user/notifications/count    — unread count
 * PUT  /api/user/notifications/read-all — mark all read
 * PUT  /api/user/notifications/:id/read — mark one read
 *
 * GET    /api/user/history         — list health records
 * POST   /api/user/history         — create health record
 * GET    /api/user/history/:id     — get single record
 * PUT    /api/user/history/:id     — update record
 * DELETE /api/user/history/:id     — delete record
 */

'use strict';

const express  = require('express');
const { body } = require('express-validator');

const userController         = require('../controllers/userController');
const appointmentController  = require('../controllers/appointmentController');
const notificationController = require('../controllers/notificationController');
const healthRecordController = require('../controllers/healthRecordController');
const healthReportController = require('../controllers/healthReportController');
const aiController           = require('../controllers/aiController');
const referralController     = require('../controllers/referralController');
const { verifyToken }        = require('../middleware/auth');
const { requireRole }        = require('../middleware/rbac');
const { reportUpload }       = require('../middleware/upload');
const { ROLES, APPOINTMENT_STATUS, CONSULTATION_MODES, HEALTH_RECORD_TYPES } = require('../utils/constants');

const router = express.Router();

// All user routes require auth + USER role
router.use(verifyToken, requireRole(ROLES.USER));

// ── Validation: basic profile update ─────────────────────────────────────────
const profileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+\d\s\-().]{7,20}$/).withMessage('Please provide a valid phone number'),

  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
    .toDate(),

  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY', 'OTHER'])
    .withMessage('Invalid gender value'),

  body('language')
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 }).withMessage('Language code must be 2–10 characters'),

  body('location.city')
    .optional().trim(),
  body('location.state')
    .optional().trim(),
  body('location.country')
    .optional().trim(),
];

// ── Validation: health profile update ─────────────────────────────────────────
const healthProfileValidation = [
  body('bloodType')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Blood type must be 10 characters or fewer'),

  body('allergies')
    .optional()
    .isArray({ max: 50 }).withMessage('Allergies must be an array (max 50 items)'),

  body('chronicConditions')
    .optional()
    .isArray({ max: 50 }).withMessage('Chronic conditions must be an array (max 50 items)'),

  body('currentMedications')
    .optional()
    .isArray({ max: 50 }).withMessage('Medications must be an array (max 50 items)'),

  body('emergencyContact.name')
    .optional().trim(),
  body('emergencyContact.phone')
    .optional()
    .trim()
    .matches(/^[+\d\s\-().]{7,20}$/).withMessage('Emergency contact phone must be valid'),
  body('emergencyContact.relationship')
    .optional().trim(),
];

// ── Validation: book HSPL appointment ────────────────────────────────────────
const appointmentValidation = [
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid date')
    .toDate(),

  body('time')
    .notEmpty().withMessage('Time is required')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be in HH:MM format'),

  body('reason')
    .notEmpty().withMessage('Reason is required')
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters'),

  body('consultationType')
    .optional()
    .isIn(Object.values(CONSULTATION_MODES)).withMessage('Invalid consultation type'),

  // hospitalId and professionalId are required unless an expertId is provided
  body('hospitalId')
    .if(body('expertId').not().notEmpty())
    .notEmpty().withMessage('Hospital selection is required'),

  body('professionalId')
    .if(body('expertId').not().notEmpty())
    .notEmpty().withMessage('Doctor/Professional selection is required'),
];

// ── Validation: book Expert appointment ──────────────────────────────────────
const expertAppointmentValidation = [
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Date must be a valid date').toDate(),
  body('time').notEmpty().withMessage('Time is required').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be in HH:MM format'),
  body('reason').notEmpty().withMessage('Reason is required').trim().isLength({ max: 500 }).withMessage('Reason too long'),
  body('expertId').notEmpty().withMessage('Expert selection is required'),
  body('consultationType').optional().isIn(Object.values(CONSULTATION_MODES)).withMessage('Invalid consultation type'),
];

// ── Validation: book Professional (direct) appointment ───────────────────────
const professionalAppointmentValidation = [
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Date must be a valid date').toDate(),
  body('time').notEmpty().withMessage('Time is required').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be in HH:MM format'),
  body('reason').notEmpty().withMessage('Reason is required').trim().isLength({ max: 500 }).withMessage('Reason too long'),
  body('professionalId').notEmpty().withMessage('Professional selection is required'),
  body('consultationType').optional().isIn(Object.values(CONSULTATION_MODES)).withMessage('Invalid consultation type'),
];

// ── Validation: health record ─────────────────────────────────────────────────
const healthRecordValidation = [
  body('recordType')
    .notEmpty().withMessage('Record type is required')
    .isIn(Object.values(HEALTH_RECORD_TYPES)).withMessage('Invalid record type'),
  body('title')
    .notEmpty().withMessage('Title is required')
    .trim()
    .isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
];

// ── AI chat ───────────────────────────────────────────────────────────────────
router.post('/ai/chat',       aiController.chat);

// ── Profile routes ─────────────────────────────────────────────────────────────
router.get('/profile',        userController.getProfile);
router.put('/profile',        profileValidation,       userController.updateProfile);
router.put('/health-profile', healthProfileValidation, userController.updateHealthProfile);
router.put('/consent',        userController.updateConsent);

// ── Appointment routes ─────────────────────────────────────────────────────────
// HSPL (hospital + professional) appointments — existing flow untouched
router.get('/appointments',                appointmentController.listUserAppointments);
router.post('/appointments',               appointmentValidation, appointmentController.bookAppointment);
router.get('/appointments/:id',            appointmentController.getUserAppointment);
router.put('/appointments/:id/cancel',     appointmentController.cancelAppointment);

// Expert appointments — completely separate flow
router.get('/expert-appointments',         appointmentController.listExpertAppointments);
router.post('/expert-appointments',        expertAppointmentValidation, appointmentController.bookExpertAppointment);

// Professional (direct) appointments — completely separate flow
router.get('/professional-appointments',   appointmentController.listProfessionalAppointments);
router.post('/professional-appointments',  professionalAppointmentValidation, appointmentController.bookProfessionalAppointment);

// ── Notification routes ────────────────────────────────────────────────────────
router.get('/notifications',              notificationController.listNotifications);
router.get('/notifications/count',        notificationController.getUnreadCount);
router.put('/notifications/read-all',     notificationController.markAllRead);
router.put('/notifications/:id/read',     notificationController.markRead);

// ── Health record routes (history) ────────────────────────────────────────────
router.get('/history',       healthRecordController.listRecords);
router.post('/history',      healthRecordValidation, healthRecordController.createRecord);
router.get('/history/:id',   healthRecordController.getRecord);
router.put('/history/:id',   healthRecordController.updateRecord);
router.delete('/history/:id', healthRecordController.deleteRecord);

// ── Health report routes (file upload + AI analysis) ──────────────────────────
router.post('/reports',       reportUpload.single('file'), healthReportController.uploadReport);
router.get('/reports',        healthReportController.listReports);
router.get('/reports/:id',    healthReportController.getReport);
router.delete('/reports/:id', healthReportController.deleteReport);

// ── Referral routes ────────────────────────────────────────────────────────────
router.get('/referrals',              referralController.listUserReferrals);
router.post('/referrals',             referralController.createUserReferral);
router.get('/referrals/:id',          referralController.getUserReferral);
router.put('/referrals/:id/cancel',   referralController.cancelUserReferral);

// ── Expert request / escalation routes (user → expert) ────────────────────────
router.get('/expert-requests',        userController.getExpertRequests);
router.post('/expert-requests',       userController.createExpertRequest);

module.exports = router;
