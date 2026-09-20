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
router.get('/users/:id',                        adminController.getUser);
router.put('/users/:id',                        adminController.updateUser);
router.delete('/users/:id',                     adminController.deleteUser);
router.put('/users/:id/toggle-active',          adminController.toggleUserActive);

// ── Hospitals ─────────────────────────────────────────────────────────────────
router.post('/hospitals/create',               adminController.createHospital);
router.get('/hospitals',                        adminController.listHospitals);
router.get('/hospitals/pending',               adminController.getPendingHospitals);
router.get('/hospitals/:id',                   adminController.getHospital);
router.put('/hospitals/:id/verify',            adminController.verifyHospital);
router.put('/hospitals/:id',                   adminController.updateHospital);
router.delete('/hospitals/:id',                adminController.deleteHospital);

// ── Professionals ─────────────────────────────────────────────────────────────
router.post('/professionals/create',           adminController.createDoctor);
router.get('/professionals',                   adminController.listProfessionals);
router.get('/professionals/pending',           adminController.getPendingProfessionals);
router.get('/professionals/:id',               adminController.getProfessional);
router.put('/professionals/:id/verify',        adminController.verifyProfessional);
router.put('/professionals/:id',               adminController.updateProfessional);
router.delete('/professionals/:id',            adminController.deleteProfessional);

// ── Experts ───────────────────────────────────────────────────────────────────
router.post('/experts/create',                 adminController.createExpert);
router.get('/experts',                         adminController.listExperts);
router.get('/experts/pending',                 adminController.getPendingExperts);
router.get('/experts/:id',                     adminController.getExpert);
router.put('/experts/:id/verify',              adminController.verifyExpert);
router.put('/experts/:id',                     adminController.updateExpert);
router.delete('/experts/:id',                  adminController.deleteExpert);

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
