/**
 * Auth routes — CarePath AI
 *
 * POST /api/auth/register  — public registration (USER, HOSPITAL, PROFESSIONAL, EXPERT)
 * POST /api/auth/login     — login with email + password
 * GET  /api/auth/me        — get current authenticated user (requires JWT)
 * POST /api/auth/logout    — stateless logout (client discards token)
 */

'use strict';

const express  = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { ROLES }       = require('../utils/constants');

const router = express.Router();

// ── Strict rate limiter for auth endpoints ────────────────────────────────────
// Disabled in test environment to allow test suites to run freely.
const authLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()  // no-op in tests
  : rateLimit({
      windowMs: 15 * 60 * 1000,  // 15 minutes
      max: 20,                    // max 20 attempts per IP per window
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many auth attempts. Please try again later.' },
    });

// ── Validation rules ──────────────────────────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .toUpperCase()
    .custom((value) => {
      if (value === ROLES.ADMIN) {
        // Throw with a special marker so the controller can return 403
        const err = new Error('Registration as ADMIN is not permitted via this endpoint');
        err.statusCode = 403;
        throw err;
      }
      const allowed = Object.values(ROLES).filter((r) => r !== ROLES.ADMIN);
      if (value && !allowed.includes(value)) {
        throw new Error('Invalid role. Must be one of: USER, HOSPITAL, PROFESSIONAL, EXPERT');
      }
      return true;
    }),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+\d\s\-().]{7,20}$/).withMessage('Please provide a valid phone number'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, authController.register);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, authController.login);

// GET /api/auth/me — requires valid JWT
router.get('/me', verifyToken, authController.getMe);

// POST /api/auth/logout — JWT is stateless; client drops the token
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
