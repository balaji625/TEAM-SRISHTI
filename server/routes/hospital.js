/**
 * Hospital routes — CarePath AI
 *
 * All routes require a valid JWT (verifyToken) and HOSPITAL role (requireRole).
 *
 * POST /api/hospital/registration-request — submit new hospital registration to admin
 * GET  /api/hospital/profile          — fetch own hospital profile
 * PUT  /api/hospital/profile          — create or update hospital profile
 * GET  /api/hospital/doctors          — list associated professionals
 *
 * GET  /api/hospital/appointments                     — list hospital appointments
 * PUT  /api/hospital/appointments/:id/status          — update appointment status
 *
 * GET  /api/hospital/notifications                    — list notifications
 * GET  /api/hospital/notifications/count              — unread count
 * PUT  /api/hospital/notifications/read-all           — mark all read
 * PUT  /api/hospital/notifications/:id/read           — mark one read
 *
 * GET  /api/hospital/requests                         — list requests
 * PUT  /api/hospital/requests/:id/respond             — respond to request
 *
 * GET  /api/hospital/analytics                        — summary analytics
 *
 * GET  /api/hospital/associations                     — list doctor associations
 * PUT  /api/hospital/associations/:assocId/approve    — approve
 * PUT  /api/hospital/associations/:assocId/reject     — reject
 */

'use strict';

const express  = require('express');
const { body } = require('express-validator');

const hospitalController    = require('../controllers/hospitalController');
const appointmentController = require('../controllers/appointmentController');
const notificationController = require('../controllers/notificationController');
const hospitalExtController = require('../controllers/hospitalExtController');
const referralController    = require('../controllers/referralController');
const { verifyToken }       = require('../middleware/auth');
const { requireRole }       = require('../middleware/rbac');
const { credentialUpload }  = require('../middleware/upload');
const { ROLES }             = require('../utils/constants');

const router = express.Router();

// All hospital routes require auth + HOSPITAL role
router.use(verifyToken, requireRole(ROLES.HOSPITAL));

// ── Validation: hospital profile upsert ───────────────────────────────────────
const profileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Hospital name must be 2–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 }).withMessage('Phone must be 7–20 characters'),

  body('emergencyAvailable')
    .optional()
    .isBoolean().withMessage('emergencyAvailable must be a boolean'),

  body('specialties')
    .optional()
    .isArray({ max: 50 }).withMessage('Specialties must be an array (max 50)'),

  body('services')
    .optional()
    .isArray({ max: 50 }).withMessage('Services must be an array (max 50)'),

  body('facilities')
    .optional()
    .isArray({ max: 50 }).withMessage('Facilities must be an array (max 50)'),

  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.country').optional().trim(),
  body('address.zip').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
];

// ── Validation: invite doctor ─────────────────────────────────────────────────
const inviteDoctorValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('specialization')
    .notEmpty().withMessage('Specialization is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Specialization must be 2–100 characters'),

  body('email')
    .notEmpty().withMessage('Email is required for the doctor to log in')
    .trim().isEmail().withMessage('Valid email required').normalizeEmail(),

  body('phone')
    .optional().trim()
    .isLength({ min: 7, max: 20 }).withMessage('Phone must be 7–20 characters'),

  body('experience')
    .optional()
    .isInt({ min: 0, max: 60 }).withMessage('Experience must be 0–60 years'),

  body('licenseNumber')
    .optional().trim()
    .isLength({ max: 50 }).withMessage('License number must not exceed 50 characters'),

  body('bio')
    .optional().trim()
    .isLength({ max: 2000 }).withMessage('Bio must not exceed 2000 characters'),

  body('consultationModes')
    .optional()
    .isArray().withMessage('consultationModes must be an array'),
];

// ── Registration request (new hospital notifies admin) ────────────────────────
router.post('/registration-request', hospitalController.submitRegistrationRequest);

// ── Profile routes ─────────────────────────────────────────────────────────────
router.get('/profile',  hospitalController.getProfile);
router.put('/profile',  profileValidation, hospitalController.upsertProfile);
router.get('/doctors',  hospitalController.listDoctors);
router.post('/doctors/invite', inviteDoctorValidation, hospitalController.inviteDoctor);
router.post('/doctors/:id/certificate', credentialUpload.single('certificate'), hospitalController.uploadDoctorCertificate);

// ── Appointment routes ─────────────────────────────────────────────────────────
router.get('/appointments',                  appointmentController.listHospitalAppointments);
router.put('/appointments/:id/status',       appointmentController.updateAppointmentStatus);

// ── Notification routes ────────────────────────────────────────────────────────
router.get('/notifications',              notificationController.listNotifications);
router.get('/notifications/count',        notificationController.getUnreadCount);
router.put('/notifications/read-all',     notificationController.markAllRead);
router.put('/notifications/:id/read',     notificationController.markRead);

// ── Requests routes ────────────────────────────────────────────────────────────
router.get('/requests',                  hospitalExtController.listRequests);
router.put('/requests/:id/respond',      hospitalExtController.respondRequest);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics',                 hospitalExtController.getAnalytics);

// ── Association management ─────────────────────────────────────────────────────
router.get('/associations',                          hospitalExtController.listAssociations);
router.put('/associations/:assocId/approve',         hospitalExtController.approveAssociation);
router.put('/associations/:assocId/reject',          hospitalExtController.rejectAssociation);

// ── Referral management ────────────────────────────────────────────────────────
router.get('/referrals',                  referralController.listHospitalReferrals);
router.get('/referrals/:id',              referralController.getHospitalReferral);
router.put('/referrals/:id/status',       referralController.updateHospitalReferralStatus);
router.put('/referrals/:id/assign',       referralController.assignProfessionalToReferral);

module.exports = router;
