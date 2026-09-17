/**
 * hospitalController — CarePath AI
 *
 * Handles HOSPITAL-role profile management.
 * Hospital profiles are created on first save; the Hospital document is linked
 * to the authenticated user via createdBy = req.user.sub.
 *
 * Routes:
 *   GET  /api/hospital/profile          — fetch own hospital profile
 *   PUT  /api/hospital/profile          — create or update hospital profile
 *   GET  /api/hospital/doctors          — list professionals associated with this hospital
 *   POST /api/hospital/doctors/invite   — hospital creates a doctor profile + User account
 *                                         Doctor can login with email & hospital_name as password
 */

'use strict';

const { validationResult } = require('express-validator');
const path = require('path');
const fs   = require('fs');
const { Hospital, Professional, User, Request } = require('../models');
const { success, fail } = require('../utils/responseHelper');
const { AppError }      = require('../middleware/errorHandler');
const { hashPassword }  = require('../services/authService');
const { REQUEST_TYPES, REQUEST_STATUS } = require('../utils/constants');

// ── POST /api/hospital/registration-request ───────────────────────────────────
// Called right after a hospital signs up to notify admin of their registration.
const submitRegistrationRequest = async (req, res, next) => {
  try {
    const { hospitalName, contactName, city, state, country, phone, email } = req.body;

    if (!hospitalName || !city || !country) {
      return fail(res, 'hospitalName, city and country are required', 400);
    }

    // Prevent duplicate pending requests from the same hospital account
    const existingReq = await Request.findOne({
      userId: req.user.sub,
      requestType: REQUEST_TYPES.GENERAL,
      status: REQUEST_STATUS.PENDING,
    });
    if (existingReq) {
      return success(res, { request: existingReq }, 'Registration request already submitted — pending admin review');
    }

    const locationStr = `${city}${state ? `, ${state}` : ''}, ${country}`;
    const description =
      `HOSPITAL REGISTRATION REQUEST\n\n` +
      `Hospital Name: ${hospitalName}\n` +
      `Contact Person: ${contactName || '—'}\n` +
      `Email: ${email || '—'}\n` +
      `Phone: ${phone || '—'}\n` +
      `Location: ${locationStr}\n\n` +
      `Please review and approve or reject this hospital's application.`;

    const request = await Request.create({
      userId:      req.user.sub,
      requestType: REQUEST_TYPES.GENERAL,
      description,
      priority:    'NORMAL',
      status:      REQUEST_STATUS.PENDING,
    });

    return success(res, { request }, 'Hospital registration request submitted to admin', 201);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hospital/profile ─────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ createdBy: req.user.sub });
    // A hospital account may not have filled in their profile yet — return null gracefully
    return success(res, { hospital: hospital || null }, 'Hospital profile retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/hospital/profile ─────────────────────────────────────────────────
// Upsert: creates the Hospital document on first call, updates thereafter.
const upsertProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, errors.array()[0].msg, 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg }))
      );
    }

    // Allowed top-level fields — never let client set verificationStatus, verifiedBy, etc.
    const allowed = [
      'name', 'description', 'email', 'phone',
      'address', 'city', 'state', 'country',
      'specialties', 'services', 'facilities',
      'emergencyAvailable',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return fail(res, 'No valid fields provided', 400);
    }

    // Require at minimum a hospital name + email for creation
    const existing = await Hospital.findOne({ createdBy: req.user.sub });
    if (!existing && (!updates.name || !updates.email)) {
      return fail(res, 'Hospital name and email are required to create a profile', 400);
    }

    const hospital = await Hospital.findOneAndUpdate(
      { createdBy: req.user.sub },
      { $set: { ...updates, createdBy: req.user.sub } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return success(res, { hospital }, existing ? 'Hospital profile updated' : 'Hospital profile created');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hospital/doctors ─────────────────────────────────────────────────
// Returns professionals whose hospitalAssociations include this hospital.
const listDoctors = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ createdBy: req.user.sub });
    if (!hospital) {
      return success(res, { doctors: [], total: 0 }, 'No hospital profile found');
    }

    const { status = 'APPROVED' } = req.query;  // filter by association status

    const doctors = await Professional.find({
      'hospitalAssociations': {
        $elemMatch: { hospitalId: hospital._id, status },
      },
    }).select('-__v');

    return success(res, { doctors, total: doctors.length }, 'Doctors retrieved');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/hospital/doctors/invite ────────────────────────────────────────
// Hospital creates:
//   1. A User account (role=PROFESSIONAL) with email as username and hospital name as password
//   2. A Professional record linked to that User, with a pre-approved association
// The doctor can immediately log in using: email + hospital name (as password)
const inviteDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, errors.array()[0].msg, 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg }))
      );
    }

    // Hospital must have a profile
    const hospital = await Hospital.findOne({ createdBy: req.user.sub });
    if (!hospital) {
      return fail(res, 'Create your hospital profile before adding doctors', 400);
    }

    const {
      name, email, phone, specialization, qualification,
      experience, licenseNumber, bio, consultationModes,
    } = req.body;

    if (!name || !specialization) {
      return fail(res, 'Name and specialization are required', 400);
    }

    // Email is required for account creation so doctor can login
    if (!email) {
      return fail(res, 'Email is required so the doctor can log in to their account', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate license number if provided
    if (licenseNumber) {
      const existingProf = await Professional.findOne({ licenseNumber });
      if (existingProf) {
        return fail(res, 'A professional with this license number already exists', 409);
      }
    }

    // Check if a User account already exists with this email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // User already exists — link their Professional profile to this hospital
      let profProfile = await Professional.findOne({ userId: existingUser._id });
      if (profProfile) {
        const alreadyLinked = profProfile.hospitalAssociations.some(
          (a) => String(a.hospitalId) === String(hospital._id)
        );
        if (alreadyLinked) {
          return fail(res, 'This doctor is already associated with your hospital', 409);
        }
        profProfile.hospitalAssociations.push({
          hospitalId: hospital._id,
          status: 'APPROVED',
          requestedAt: new Date(),
          resolvedAt: new Date(),
        });
        await profProfile.save();
        return success(res, {
          doctor: profProfile,
          loginEmail: normalizedEmail,
          note: 'Existing account linked to your hospital.',
        }, 'Doctor associated with your hospital', 200);
      }

      // User exists but no Professional profile yet — create one
      const doctor = await Professional.create({
        userId: existingUser._id,
        name,
        email: normalizedEmail,
        phone: phone || undefined,
        specialization,
        qualification: qualification || undefined,
        experience:    experience ? Number(experience) : 0,
        licenseNumber: licenseNumber || undefined,
        bio:           bio || undefined,
        consultationModes: Array.isArray(consultationModes) ? consultationModes : [],
        hospitalAssociations: [{
          hospitalId:  hospital._id,
          status:      'APPROVED',
          requestedAt: new Date(),
          resolvedAt:  new Date(),
        }],
      });
      return success(res, {
        doctor,
        loginEmail: normalizedEmail,
        note: 'Professional profile created for existing user account.',
      }, 'Doctor added to your hospital', 201);
    }

    // ── Create brand-new User account ────────────────────────────────────────
    // Password = hospital name (normalised: trimmed, lowercase, spaces replaced with _)
    // The doctor should change this on first login.
    const rawPassword = hospital.name.trim();
    const passwordHash = await hashPassword(rawPassword);

    const newUser = await User.create({
      name:       name.trim(),
      email:      normalizedEmail,
      password:   passwordHash,
      role:       'PROFESSIONAL',
      phone:      phone?.trim() || undefined,
      isVerified: false,
      isActive:   true,
    });

    // Create Professional profile linked to the new user
    const doctor = await Professional.create({
      userId:        newUser._id,
      name:          name.trim(),
      email:         normalizedEmail,
      phone:         phone || undefined,
      specialization,
      qualification: qualification  || undefined,
      experience:    experience     ? Number(experience) : 0,
      licenseNumber: licenseNumber  || undefined,
      bio:           bio            || undefined,
      consultationModes: Array.isArray(consultationModes) ? consultationModes : [],
      hospitalAssociations: [{
        hospitalId:  hospital._id,
        status:      'APPROVED',
        requestedAt: new Date(),
        resolvedAt:  new Date(),
      }],
    });

    return success(res, {
      doctor,
      loginCredentials: {
        email:    normalizedEmail,
        password: rawPassword,
        note:     'Doctor can login using their email and the hospital name as password. Ask them to change their password after first login.',
      },
    }, 'Doctor added to your hospital with a login account created', 201);
  } catch (err) {
    if (err.code === 11000) {
      return fail(res, 'A profile conflict occurred. The doctor may already be registered — ask them to request association directly.', 409);
    }
    next(err);
  }
};

// ── POST /api/hospital/doctors/:id/certificate ───────────────────────────────
// Hospital uploads/updates a certificate for one of its associated doctors.
const uploadDoctorCertificate = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No certificate file uploaded', 400);

    const hospital = await Hospital.findOne({ createdBy: req.user.sub });
    if (!hospital) return fail(res, 'Hospital profile not found', 400);

    // Verify the doctor is associated with this hospital
    const doctor = await Professional.findOne({
      _id: req.params.id,
      'hospitalAssociations.hospitalId': hospital._id,
    });
    if (!doctor) return next(new AppError('Doctor not associated with your hospital', 404));

    const { title = 'Certificate', year } = req.body;
    const documentUrl = `/uploads/credentials/${req.file.filename}`;

    doctor.credentials.push({
      title: title.trim(),
      year:  year ? Number(year) : undefined,
      documentUrl,
    });
    await doctor.save();

    return success(res, { credential: doctor.credentials.at(-1) }, 'Certificate uploaded', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { submitRegistrationRequest, getProfile, upsertProfile, listDoctors, inviteDoctor, uploadDoctorCertificate };
