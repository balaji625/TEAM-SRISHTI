/**
 * authController — CarePath AI
 *
 * Thin HTTP layer: validates input, calls authService, sends response.
 * No business logic lives here.
 */

'use strict';

const { validationResult } = require('express-validator');
const authService  = require('../services/authService');
const { success, created, fail } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    // express-validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errList = errors.array();
      // Check if any validator explicitly set a 403 (e.g. ADMIN role attempt)
      const has403 = errList.some((e) => e.msg?.includes('not permitted'));
      const statusCode = has403 ? 403 : 400;
      return fail(res, errList[0].msg, statusCode,
        errList.map((e) => ({ field: e.path, message: e.msg }))
      );
    }

    const { name, email, password, role, phone } = req.body;
    const result = await authService.register({ name, email, password, role, phone });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token: result.token, user: result.user },
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, 'Validation failed', 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg }))
      );
    }

    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token: result.token, user: result.user },
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Current User ──────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user.sub is set by verifyToken middleware from the JWT payload.
    // Never use req.body.userId — we only trust the verified JWT.
    const user = await authService.getMe(req.user.sub);
    return success(res, { user }, 'Authenticated user retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
// JWT is stateless — actual invalidation requires a token blacklist (future stage).
// For now, instruct the client to discard the token and document the limitation.
const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard your token on the client.',
    note: 'JWT is stateless. Token blacklisting will be added in a later stage.',
  });
};

module.exports = { register, login, getMe, logout };
