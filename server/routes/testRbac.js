/**
 * Test-only protected routes — CarePath AI
 *
 * These routes exist ONLY for RBAC verification during Stage 4 testing.
 * They expose no real data and are disabled in production.
 *
 * Routes:
 *   GET /api/test/user-only        — USER role only
 *   GET /api/test/hospital-only    — HOSPITAL role only
 *   GET /api/test/professional-only— PROFESSIONAL role only
 *   GET /api/test/expert-only      — EXPERT role only
 *   GET /api/test/admin-only       — ADMIN role only
 *   GET /api/test/multi-role       — HOSPITAL or ADMIN
 *   GET /api/test/any-auth         — any authenticated user
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES }        = require('../utils/constants');

const router = express.Router();

// Only register these routes in non-production environments
if (process.env.NODE_ENV !== 'production') {

  router.get('/user-only',         verifyToken, requireRole(ROLES.USER),         (req, res) => res.json({ success: true, message: 'USER access confirmed',         role: req.user.role }));
  router.get('/hospital-only',     verifyToken, requireRole(ROLES.HOSPITAL),     (req, res) => res.json({ success: true, message: 'HOSPITAL access confirmed',     role: req.user.role }));
  router.get('/professional-only', verifyToken, requireRole(ROLES.PROFESSIONAL), (req, res) => res.json({ success: true, message: 'PROFESSIONAL access confirmed', role: req.user.role }));
  router.get('/expert-only',       verifyToken, requireRole(ROLES.EXPERT),       (req, res) => res.json({ success: true, message: 'EXPERT access confirmed',       role: req.user.role }));
  router.get('/admin-only',        verifyToken, requireRole(ROLES.ADMIN),        (req, res) => res.json({ success: true, message: 'ADMIN access confirmed',        role: req.user.role }));
  router.get('/multi-role',        verifyToken, requireRole(ROLES.HOSPITAL, ROLES.ADMIN), (req, res) => res.json({ success: true, message: 'HOSPITAL or ADMIN access confirmed', role: req.user.role }));
  router.get('/any-auth',          verifyToken, (req, res) => res.json({ success: true, message: 'Authenticated access confirmed', role: req.user.role }));

}

module.exports = router;
