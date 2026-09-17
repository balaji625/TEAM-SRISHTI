/**
 * Admin routes — CarePath AI
 *
 * All routes require a valid JWT (verifyToken) and ADMIN role.
 */

'use strict';

const express = require('express');

const adminController = require('../controllers/adminController');
const { verifyToken }  = require('../middleware/auth');
const { requireRole }  = require('../middleware/rbac');
const { ROLES }        = require('../utils/constants');

const router = express.Router();

router.use(verifyToken, requireRole(ROLES.ADMIN));

// ── Overview & users ──────────────────────────────────────────────────────────
router.get('/overview',                         adminController.getOverview);
router.get('/users',                            adminController.listUsers);
router.put('/users/:id/toggle-active',          adminController.toggleUserActive);

// ── Hospitals ─────────────────────────────────────────────────────────────────
router.post('/hospitals/create',               adminController.createHospital);
router.get('/hospitals',                        adminController.listHospitals);
router.get('/hospitals/pending',               adminController.getPendingHospitals);
router.put('/hospitals/:id/verify',            adminController.verifyHospital);

// ── Professionals ─────────────────────────────────────────────────────────────
router.get('/professionals',                   adminController.listProfessionals);
router.get('/professionals/pending',           adminController.getPendingProfessionals);
router.put('/professionals/:id/verify',        adminController.verifyProfessional);

// ── Professionals ─────────────────────────────────────────────────────────────
router.post('/professionals/create',           adminController.createDoctor);

// ── Experts ───────────────────────────────────────────────────────────────────
router.get('/experts',                         adminController.listExperts);
router.get('/experts/pending',                 adminController.getPendingExperts);
router.put('/experts/:id/verify',              adminController.verifyExpert);
router.post('/experts/create',                 adminController.createExpert);

// ── Appointments ──────────────────────────────────────────────────────────────
router.get('/appointments',                    adminController.listAppointments);

// ── Requests (incl. independent expert → admin) ───────────────────────────────
router.get('/requests',                        adminController.listRequests);
router.put('/requests/:id/respond',            adminController.respondRequest);

// ── Audit logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs',                      adminController.listAuditLogs);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics',                       adminController.getAnalytics);

// ── Settings ──────────────────────────────────────────────────────────────────
router.get('/settings',                        adminController.getSettings);

module.exports = router;
