/**
 * professionalController — CarePath AI
 *
 * Handles PROFESSIONAL-role profile management.
 * The Professional document is a separate record linked to the User via userId.
 * Created on first save (upsert), updated thereafter.
 *
 * Routes:
 *   GET  /api/professional/profile               — fetch own professional profile
 *   PUT  /api/professional/profile               — create or update professional profile
 *   GET  /api/professional/associations          — list hospital association requests
 *   POST /api/professional/associations/request  — request to join a hospital
 *   GET  /api/professional/notifications         — list notifications (shared notif model)
 *   PUT  /api/professional/notifications/read-all
 *   PUT  /api/professional/notifications/:id/read
 *   GET  /api/professional/appointments          — list own appointments
 *   PUT  /api/professional/availability          — set weekly availability
 *   GET  /api/professional/requests              — list sent requests
 *   POST /api/professional/requests              — send request to hospital
 */

'use strict';

const { validationResult } = require('express-validator');
const { Professional, Hospital, Request, Notification } = require('../models');
const { success, fail } = require('../utils/responseHelper');
const { AppError }      = require('../middleware/errorHandler');

// ── GET /api/professional/profile ─────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const profile = await Professional.findOne({ userId: req.user.sub })
      .populate('hospitalAssociations.hospitalId', 'name city country');
    return success(res, { profile: profile || null }, 'Professional profile retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/professional/profile ─────────────────────────────────────────────
const upsertProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, errors.array()[0].msg, 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg }))
      );
    }

    // Allowed safe fields — never touch verificationStatus, verifiedBy, etc.
    const allowed = [
      'name', 'email', 'phone',
      'specialization', 'qualification', 'experience',
      'licenseNumber', 'bio',
      'consultationModes', 'credentials',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return fail(res, 'No valid fields provided', 400);
    }

    const existing = await Professional.findOne({ userId: req.user.sub });
    if (!existing && (!updates.name || !updates.specialization)) {
      return fail(res, 'Name and specialization are required to create a professional profile', 400);
    }

    const profile = await Professional.findOneAndUpdate(
      { userId: req.user.sub },
      { $set: { ...updates, userId: req.user.sub } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return success(res, { profile }, existing ? 'Professional profile updated' : 'Professional profile created');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/professional/associations ────────────────────────────────────────
const getAssociations = async (req, res, next) => {
  try {
    const profile = await Professional.findOne({ userId: req.user.sub })
      .populate('hospitalAssociations.hospitalId', 'name city country verificationStatus');
    if (!profile) {
      return success(res, { associations: [] }, 'No profile found');
    }
    return success(res, { associations: profile.hospitalAssociations }, 'Associations retrieved');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/professional/associations/request ───────────────────────────────
// Professional requests to join a hospital. Creates a PENDING association.
const requestAssociation = async (req, res, next) => {
  try {
    const { hospitalId, department, role: assocRole } = req.body;
    if (!hospitalId) return fail(res, 'hospitalId is required', 400);

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return next(new AppError('Hospital not found', 404));

    let profile = await Professional.findOne({ userId: req.user.sub });
    if (!profile) return fail(res, 'Create your professional profile first', 400);

    const alreadyLinked = profile.hospitalAssociations.some(
      (a) => String(a.hospitalId) === String(hospital._id) && ['PENDING', 'APPROVED'].includes(a.status)
    );
    if (alreadyLinked) return fail(res, 'You already have an active or pending association with this hospital', 409);

    profile.hospitalAssociations.push({
      hospitalId:  hospital._id,
      department:  department || undefined,
      role:        assocRole  || undefined,
      status:      'PENDING',
      requestedAt: new Date(),
    });
    await profile.save();

    return success(res, { association: profile.hospitalAssociations.at(-1) }, 'Association request sent', 201);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/professional/notifications ───────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { userId: req.user.sub };
    if (unreadOnly === 'true') filter.read = false;
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user.sub, read: false });
    return success(res, { notifications, unreadCount }, 'Notifications retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/professional/notifications/:id/read ──────────────────────────────
const markNotificationRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.sub }, { read: true });
    return success(res, {}, 'Notification marked read');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/professional/notifications/read-all ──────────────────────────────
const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.sub, read: false }, { read: true });
    return success(res, {}, 'All notifications marked read');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/professional/appointments ────────────────────────────────────────
const getAppointments = async (req, res, next) => {
  try {
    const { Appointment } = require('../models');
    const { status } = req.query;
    const profile = await Professional.findOne({ userId: req.user.sub });
    if (!profile) return success(res, { appointments: [], total: 0 }, 'No profile');

    const filter = { professionalId: profile._id };
    if (status) filter.status = status.toUpperCase();

    const appointments = await Appointment.find(filter)
      .populate('userId', 'name email phone')
      .populate('hospitalId', 'name city')
      .sort({ createdAt: -1 })
      .limit(100);

    return success(res, { appointments, total: appointments.length }, 'Appointments retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/professional/appointments/:id/status ─────────────────────────────
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { Appointment } = require('../models');
    const { status, note } = req.body;
    if (!status) return fail(res, 'status is required', 400);

    const profile = await Professional.findOne({ userId: req.user.sub });
    if (!profile) return next(new AppError('Professional profile not found', 404));

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      professionalId: profile._id,
    });
    if (!appointment) return next(new AppError('Appointment not found', 404));

    appointment.status = status.toUpperCase();
    appointment.statusHistory.push({
      status: status.toUpperCase(),
      changedBy: req.user.sub,
      changedAt: new Date(),
      note: note || undefined,
    });
    await appointment.save();

    return success(res, { appointment }, 'Appointment status updated');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/professional/availability ────────────────────────────────────────
const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    if (!Array.isArray(availability)) return fail(res, 'availability must be an array', 400);

    const profile = await Professional.findOneAndUpdate(
      { userId: req.user.sub },
      { $set: { availability } },
      { new: true }
    );
    if (!profile) return fail(res, 'Create your professional profile first', 400);
    return success(res, { availability: profile.availability }, 'Availability updated');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/professional/requests ────────────────────────────────────────────
const getRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.sub };
    if (status) filter.status = status.toUpperCase();
    const requests = await Request.find(filter)
      .populate('hospitalId', 'name city')
      .sort({ createdAt: -1 })
      .limit(50);
    return success(res, { requests, total: requests.length }, 'Requests retrieved');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/professional/requests ───────────────────────────────────────────
const sendRequest = async (req, res, next) => {
  try {
    const { hospitalId, description, priority, requestType } = req.body;
    if (!description) return fail(res, 'description is required', 400);

    const payload = {
      userId:      req.user.sub,
      requestType: requestType || 'PROFESSIONAL_REQUEST',
      description: description.trim(),
      priority:    priority || 'NORMAL',
    };
    if (hospitalId) {
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) return next(new AppError('Hospital not found', 404));
      payload.hospitalId = hospital._id;
    }
    const request = await Request.create(payload);
    return success(res, { request }, 'Request sent', 201);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/professional/credentials — upload a credential document ──────────
const uploadCredential = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded', 400);

    const { title, institution, year } = req.body;
    if (!title || !title.trim()) return fail(res, 'Credential title is required', 400);

    const profile = await Professional.findOne({ userId: req.user.sub });
    if (!profile) return fail(res, 'Create your professional profile first', 400);

    const documentUrl = `/uploads/credentials/${req.file.filename}`;

    profile.credentials.push({
      title:       title.trim(),
      institution: institution?.trim() || undefined,
      year:        year ? Number(year) : undefined,
      documentUrl,
    });
    await profile.save();

    return success(res, { credential: profile.credentials.at(-1) }, 'Credential uploaded', 201);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/professional/credentials/:credId ──────────────────────────────
const deleteCredential = async (req, res, next) => {
  try {
    const profile = await Professional.findOne({ userId: req.user.sub });
    if (!profile) return fail(res, 'Profile not found', 404);

    const cred = profile.credentials.id(req.params.credId);
    if (!cred) return fail(res, 'Credential not found', 404);

    // Remove file from disk if it exists
    if (cred.documentUrl) {
      const path = require('path');
      const fs   = require('fs');
      const filePath = path.join(__dirname, '..', cred.documentUrl);
      try { fs.unlinkSync(filePath); } catch (_) {}
    }

    profile.credentials.pull({ _id: req.params.credId });
    await profile.save();

    return success(res, {}, 'Credential deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile, upsertProfile, getAssociations,
  requestAssociation,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  getAppointments, updateAppointmentStatus,
  updateAvailability,
  getRequests, sendRequest,
  uploadCredential, deleteCredential,
};
