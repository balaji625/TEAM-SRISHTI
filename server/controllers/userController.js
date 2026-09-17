/**
 * userController — CarePath AI
 *
 * Handles USER-role profile management.
 * All handlers trust req.user.sub from the verified JWT — never req.body.userId.
 *
 * Routes:
 *   GET  /api/user/profile          — fetch own profile
 *   PUT  /api/user/profile          — update basic profile fields
 *   PUT  /api/user/health-profile   — update health profile snapshot
 *   PUT  /api/user/consent          — update consent preferences
 */

'use strict';

const { validationResult } = require('express-validator');
const { User }    = require('../models');
const { success, fail } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');

// ── GET /api/user/profile ─────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return next(new AppError('User not found', 404));
    return success(res, { user }, 'Profile retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/user/profile ─────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, errors.array()[0].msg, 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg }))
      );
    }

    // Only allow explicit safe fields — never let client set role, password, etc.
    const allowed = ['name', 'phone', 'dateOfBirth', 'gender', 'language', 'location'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return fail(res, 'No valid fields provided for update', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) return next(new AppError('User not found', 404));

    return success(res, { user }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/user/health-profile ──────────────────────────────────────────────
const updateHealthProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, errors.array()[0].msg, 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg }))
      );
    }

    const allowed = ['bloodType', 'allergies', 'chronicConditions', 'currentMedications', 'emergencyContact'];
    const healthUpdates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) healthUpdates[`healthProfile.${key}`] = req.body[key];
    }

    if (Object.keys(healthUpdates).length === 0) {
      return fail(res, 'No valid health profile fields provided', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { $set: healthUpdates },
      { new: true, runValidators: true }
    );
    if (!user) return next(new AppError('User not found', 404));

    return success(res, { user }, 'Health profile updated');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/user/consent ─────────────────────────────────────────────────────
const updateConsent = async (req, res, next) => {
  try {
    const consentFields = [
      'healthDataStorage', 'reportAnalysis', 'personalization',
      'expertSharing', 'hospitalSharing', 'notifications',
    ];

    const consentUpdates = {};
    for (const key of consentFields) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] !== 'boolean') {
          return fail(res, `Consent field '${key}' must be a boolean`, 400);
        }
        consentUpdates[`consent.${key}`] = req.body[key];
      }
    }

    if (Object.keys(consentUpdates).length === 0) {
      return fail(res, 'No valid consent fields provided', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { $set: consentUpdates },
      { new: true, runValidators: true }
    );
    if (!user) return next(new AppError('User not found', 404));

    return success(res, { user }, 'Consent preferences updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, updateHealthProfile, updateConsent };
