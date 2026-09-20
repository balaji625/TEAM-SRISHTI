/**
 * expertController — CarePath AI
 *
 * Handles EXPERT-role profile management and requests.
 * The Expert document is a separate record linked to the User via userId.
 *
 * Routes:
 *   GET  /api/expert/profile                   — fetch own expert profile
 *   PUT  /api/expert/profile                   — create or update expert profile
 *   GET  /api/expert/availability              — fetch own availability
 *   PUT  /api/expert/availability              — save own weekly availability
 *   GET  /api/expert/credentials               — list own credentials
 *   POST /api/expert/credentials               — add a credential
 *   DELETE /api/expert/credentials/:credId     — remove a credential
 *   GET  /api/expert/consultations             — list own consultations (appointments)
 *   PUT  /api/expert/consultations/:id/status  — update consultation status
 *   POST /api/expert/requests/to-hospital      — expert sends request to a hospital (about a doctor)
 *   POST /api/expert/requests/to-admin         — expert sends request/escalation directly to admin (app founder)
 *   GET  /api/expert/requests                  — list own submitted requests
 *   GET  /api/expert/incoming-requests         — list requests directed at this expert (from users)
 *   PUT  /api/expert/incoming-requests/:id     — update status of incoming request
 */

'use strict';

const { validationResult } = require('express-validator');
const { Expert, Request, Hospital } = require('../models');
const { success, fail } = require('../utils/responseHelper');
const { AppError }      = require('../middleware/errorHandler');

// ── GET /api/expert/profile ───────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const profile = await Expert.findOne({ userId: req.user.sub });
    return success(res, { profile: profile || null }, 'Expert profile retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/expert/profile ───────────────────────────────────────────────────
const upsertProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, errors.array()[0].msg, 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg }))
      );
    }

    const allowed = [
      'name', 'email', 'phone',
      'specialization', 'qualification', 'experience',
      'bio', 'consultationModes',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return fail(res, 'No valid fields provided', 400);
    }

    const existing = await Expert.findOne({ userId: req.user.sub });
    if (!existing && (!updates.name || !updates.specialization)) {
      return fail(res, 'Name and specialization are required to create an expert profile', 400);
    }

    const profile = await Expert.findOneAndUpdate(
      { userId: req.user.sub },
      { $set: { ...updates, userId: req.user.sub } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return success(res, { profile }, existing ? 'Expert profile updated' : 'Expert profile created');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/expert/requests/to-hospital ─────────────────────────────────────
// Expert sends a request to a specific hospital (e.g. requesting a referral, collaboration,
// or sending a consultation escalation related to a hospital's doctor).
const sendRequestToHospital = async (req, res, next) => {
  try {
    const { hospitalId, description, priority } = req.body;

    if (!hospitalId || !description) {
      return fail(res, 'hospitalId and description are required', 400);
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return next(new AppError('Hospital not found', 404));

    const request = await Request.create({
      userId:      req.user.sub,
      requestType: 'HOSPITAL_REQUEST',
      hospitalId:  hospital._id,
      description: description.trim(),
      priority:    priority || 'NORMAL',
    });

    return success(res, { request }, 'Request sent to hospital', 201);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/expert/requests/to-admin ────────────────────────────────────────
// Independent expert sends a request/escalation directly to admin (the app founder).
// This covers: applying as an independent expert, reporting an issue, requesting escalation support.
const sendRequestToAdmin = async (req, res, next) => {
  try {
    const { description, priority, subject } = req.body;

    if (!description) {
      return fail(res, 'description is required', 400);
    }

    const fullDescription = subject ? `[${subject}] ${description.trim()}` : description.trim();

    const request = await Request.create({
      userId:      req.user.sub,
      requestType: 'EXPERT_ESCALATION',
      description: fullDescription,
      priority:    priority || 'NORMAL',
    });

    return success(res, { request }, 'Request sent to admin successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/expert/consultations ────────────────────────────────────────────
const getConsultations = async (req, res, next) => {
  try {
    const { Appointment } = require('../models');
    const { status } = req.query;

    const expertProfile = await Expert.findOne({ userId: req.user.sub });
    if (!expertProfile) {
      return success(res, { consultations: [], total: 0 }, 'No expert profile found');
    }

    const filter = { expertId: expertProfile._id };
    if (status) filter.status = status.toUpperCase();

    const appointments = await Appointment.find(filter)
      .populate('userId', 'name email phone')
      .populate('hospitalId', 'name city')
      .sort({ createdAt: -1 })
      .limit(100);

    return success(res, { consultations: appointments, total: appointments.length }, 'Consultations retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/expert/consultations/:id/status ─────────────────────────────────
const updateConsultationStatus = async (req, res, next) => {
  try {
    const { Appointment } = require('../models');
    const { status, note } = req.body;

    if (!status) return fail(res, 'status is required', 400);

    const expertProfile = await Expert.findOne({ userId: req.user.sub });
    if (!expertProfile) return next(new AppError('Expert profile not found', 404));

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      expertId: expertProfile._id,
    });
    if (!appointment) return next(new AppError('Consultation not found', 404));

    const prevStatus = appointment.status;
    appointment.status = status.toUpperCase();
    appointment.statusHistory.push({
      status: status.toUpperCase(),
      changedBy: req.user.sub,
      changedAt: new Date(),
      note: note || undefined,
    });
    await appointment.save();

    return success(res, { consultation: appointment }, 'Consultation status updated');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/expert/requests ──────────────────────────────────────────────────
const getMyRequests = async (req, res, next) => {
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

// ── GET /api/expert/availability ──────────────────────────────────────────────
const getAvailability = async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user.sub }).select('availability consultationModes');
    if (!expert) return success(res, { availability: [], consultationModes: [] }, 'No expert profile found');
    return success(res, { availability: expert.availability || [], consultationModes: expert.consultationModes || [] }, 'Availability retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/expert/availability ──────────────────────────────────────────────
const saveAvailability = async (req, res, next) => {
  try {
    const { availability, consultationModes } = req.body;

    if (!Array.isArray(availability)) {
      return fail(res, 'availability must be an array', 400);
    }

    const updates = { availability };
    if (Array.isArray(consultationModes)) updates.consultationModes = consultationModes;

    const expert = await Expert.findOneAndUpdate(
      { userId: req.user.sub },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!expert) return fail(res, 'Expert profile not found. Please create your profile first.', 404);

    return success(res, { availability: expert.availability, consultationModes: expert.consultationModes }, 'Availability saved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/expert/credentials ───────────────────────────────────────────────
const getCredentials = async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user.sub }).select('credentials');
    if (!expert) return success(res, { credentials: [] }, 'No expert profile found');
    return success(res, { credentials: expert.credentials || [] }, 'Credentials retrieved');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/expert/credentials ──────────────────────────────────────────────
const addCredential = async (req, res, next) => {
  try {
    const { title, institution, year, credentialType } = req.body;

    if (!title || !title.trim()) {
      return fail(res, 'Credential title is required', 400);
    }

    const documentUrl = req.file ? `/uploads/credentials/${req.file.filename}` : null;

    const credentialEntry = {
      title:       title.trim(),
      institution: institution?.trim() || undefined,
      year:        year ? Number(year) : undefined,
      documentUrl,
    };
    // Store credentialType in the title if provided (extend gracefully)
    if (credentialType) credentialEntry.title = `[${credentialType.trim()}] ${title.trim()}`;

    const expert = await Expert.findOneAndUpdate(
      { userId: req.user.sub },
      { $push: { credentials: credentialEntry } },
      { new: true, runValidators: true }
    );

    if (!expert) return fail(res, 'Expert profile not found. Please create your profile first.', 404);

    const added = expert.credentials[expert.credentials.length - 1];
    return success(res, { credential: added, credentials: expert.credentials }, 'Credential added', 201);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/expert/credentials/:credId ────────────────────────────────────
const deleteCredential = async (req, res, next) => {
  try {
    const { credId } = req.params;

    const expert = await Expert.findOneAndUpdate(
      { userId: req.user.sub },
      { $pull: { credentials: { _id: credId } } },
      { new: true }
    );

    if (!expert) return fail(res, 'Expert profile not found', 404);

    return success(res, { credentials: expert.credentials }, 'Credential removed');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/expert/incoming-requests ─────────────────────────────────────────
// Expert sees requests from users directed to them (expertId = their profile _id)
const getIncomingRequests = async (req, res, next) => {
  try {
    const expertProfile = await Expert.findOne({ userId: req.user.sub });
    if (!expertProfile) return success(res, { requests: [], total: 0 }, 'No expert profile found');

    const { status } = req.query;
    const filter = { expertId: expertProfile._id };
    if (status) filter.status = status.toUpperCase();

    const requests = await Request.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100);

    return success(res, { requests, total: requests.length }, 'Incoming requests retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/expert/incoming-requests/:id ─────────────────────────────────────
// Expert updates the status of a request directed at them
const updateIncomingRequest = async (req, res, next) => {
  try {
    const { status, message } = req.body;

    if (!status) return fail(res, 'status is required', 400);

    const { REQUEST_STATUS } = require('../utils/constants');
    if (!Object.values(REQUEST_STATUS).includes(status.toUpperCase())) {
      return fail(res, `Invalid status: ${status}`, 400);
    }

    const expertProfile = await Expert.findOne({ userId: req.user.sub });
    if (!expertProfile) return fail(res, 'Expert profile not found', 404);

    const request = await Request.findOne({ _id: req.params.id, expertId: expertProfile._id });
    if (!request) return next(new AppError('Request not found', 404));

    request.status = status.toUpperCase();
    request.response = {
      message:     message || null,
      respondedBy: req.user.sub,
      respondedAt: new Date(),
    };
    if (['APPROVED', 'REJECTED', 'RESOLVED'].includes(status.toUpperCase())) {
      request.resolvedAt = new Date();
    }
    await request.save();

    return success(res, { request }, 'Request updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile, upsertProfile,
  getAvailability, saveAvailability,
  getCredentials, addCredential, deleteCredential,
  getConsultations, updateConsultationStatus,
  sendRequestToHospital, sendRequestToAdmin, getMyRequests,
  getIncomingRequests, updateIncomingRequest,
};
