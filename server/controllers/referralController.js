/**
 * referralController — CarePath AI
 *
 * Patient referral management — create, view, and update status.
 *
 * Routes mounted on /api/user/referrals
 *   GET    /              — list patient's referrals
 *   POST   /              — create a self-initiated referral request
 *   GET    /:id           — get single referral
 *   PUT    /:id/cancel    — patient cancels referral
 *
 * Routes mounted on /api/hospital/referrals
 *   GET    /              — list referrals for this hospital
 *   GET    /:id           — get single referral
 *   PUT    /:id/status    — update referral status (accept/reject/schedule etc.)
 *   PUT    /:id/assign    — assign a professional to a referral
 *
 * Routes mounted on /api/professional/referrals
 *   GET    /              — list referrals assigned to this professional
 *   POST   /              — create referral for a patient
 *   GET    /:id           — get single referral
 *   PUT    /:id/status    — update referral status
 */

'use strict';

const { Referral } = require('../models');
const { REFERRAL_STATUS } = require('../models/Referral');
const { success, fail } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');

// ── Valid status transitions ──────────────────────────────────────────────────
const ALLOWED_TRANSITIONS = {
  [REFERRAL_STATUS.CREATED]:     [REFERRAL_STATUS.ACCEPTED, REFERRAL_STATUS.REJECTED, REFERRAL_STATUS.CANCELLED],
  [REFERRAL_STATUS.ACCEPTED]:    [REFERRAL_STATUS.SCHEDULED, REFERRAL_STATUS.CANCELLED],
  [REFERRAL_STATUS.SCHEDULED]:   [REFERRAL_STATUS.IN_PROGRESS, REFERRAL_STATUS.CANCELLED],
  [REFERRAL_STATUS.IN_PROGRESS]: [REFERRAL_STATUS.COMPLETED, REFERRAL_STATUS.CANCELLED],
  [REFERRAL_STATUS.COMPLETED]:   [],
  [REFERRAL_STATUS.REJECTED]:    [],
  [REFERRAL_STATUS.CANCELLED]:   [],
};

const isValidTransition = (from, to) => {
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
};

// ── USER: list own referrals ──────────────────────────────────────────────────
const listUserReferrals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { patientId: req.user.sub };
    if (status) filter.status = status.toUpperCase();

    const referrals = await Referral.find(filter)
      .populate('sourceProfessionalId', 'name specialization')
      .populate('sourceHospitalId', 'name city')
      .populate('destinationProfessionalId', 'name specialization')
      .populate('destinationHospitalId', 'name city')
      .populate('appointmentId', 'date time status')
      .sort({ createdAt: -1 })
      .limit(50);

    return success(res, { referrals, total: referrals.length }, 'Referrals retrieved');
  } catch (err) {
    next(err);
  }
};

// ── USER: get single referral ─────────────────────────────────────────────────
const getUserReferral = async (req, res, next) => {
  try {
    const referral = await Referral.findOne({ _id: req.params.id, patientId: req.user.sub })
      .populate('sourceProfessionalId', 'name specialization phone')
      .populate('sourceHospitalId', 'name city phone')
      .populate('destinationProfessionalId', 'name specialization phone')
      .populate('destinationHospitalId', 'name city phone address')
      .populate('appointmentId', 'date time status consultationType');

    if (!referral) return next(new AppError('Referral not found', 404));
    return success(res, { referral }, 'Referral retrieved');
  } catch (err) {
    next(err);
  }
};

// ── USER: self-initiated referral request (patient asks for referral) ─────────
const createUserReferral = async (req, res, next) => {
  try {
    const { reason, category, priority, destinationHospitalId, destinationName, notes } = req.body;
    if (!reason || !reason.trim()) return fail(res, 'Reason is required', 400);
    if (!destinationHospitalId && !destinationName) {
      return fail(res, 'Please specify a destination hospital or facility name', 400);
    }

    const referral = await Referral.create({
      patientId: req.user.sub,
      reason: reason.trim(),
      category: category || null,
      priority: priority || 'NORMAL',
      destinationHospitalId: destinationHospitalId || null,
      destinationName: destinationName || null,
      notes: notes || null,
      statusHistory: [{ status: REFERRAL_STATUS.CREATED, changedBy: req.user.sub }],
    });

    return success(res, { referral }, 'Referral request created', 201);
  } catch (err) {
    next(err);
  }
};

// ── USER: cancel referral ─────────────────────────────────────────────────────
const cancelUserReferral = async (req, res, next) => {
  try {
    const referral = await Referral.findOne({ _id: req.params.id, patientId: req.user.sub });
    if (!referral) return next(new AppError('Referral not found', 404));

    const cancellable = [REFERRAL_STATUS.CREATED, REFERRAL_STATUS.ACCEPTED];
    if (!cancellable.includes(referral.status)) {
      return fail(res, `Cannot cancel a ${referral.status.toLowerCase()} referral`, 400);
    }

    referral.status = REFERRAL_STATUS.CANCELLED;
    referral.statusHistory.push({ status: REFERRAL_STATUS.CANCELLED, changedBy: req.user.sub });
    await referral.save();

    return success(res, { referral }, 'Referral cancelled');
  } catch (err) {
    next(err);
  }
};

// ── HOSPITAL: list referrals directed at this hospital ────────────────────────
const listHospitalReferrals = async (req, res, next) => {
  try {
    const { Hospital } = require('../models');
    const hospital = await Hospital.findOne({ createdBy: req.user.sub });
    if (!hospital) return success(res, { referrals: [], total: 0 }, 'No hospital profile');

    const { status, page = 1, limit = 20 } = req.query;
    const filter = { destinationHospitalId: hospital._id };
    if (status) filter.status = status.toUpperCase();

    const referrals = await Referral.find(filter)
      .populate('patientId', 'name email phone')
      .populate('sourceProfessionalId', 'name specialization')
      .populate('sourceHospitalId', 'name city')
      .populate('destinationProfessionalId', 'name specialization phone')
      .populate('appointmentId', 'date time status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Referral.countDocuments(filter);
    return success(res, { referrals, total, page: Number(page) }, 'Referrals retrieved');
  } catch (err) {
    next(err);
  }
};

// ── HOSPITAL: get single referral ─────────────────────────────────────────────
const getHospitalReferral = async (req, res, next) => {
  try {
    const { Hospital } = require('../models');
    const hospital = await Hospital.findOne({ createdBy: req.user.sub });
    if (!hospital) return next(new AppError('Hospital profile not found', 404));

    const referral = await Referral.findOne({
      _id: req.params.id,
      destinationHospitalId: hospital._id,
    })
      .populate('patientId', 'name email phone')
      .populate('sourceProfessionalId', 'name specialization phone')
      .populate('sourceHospitalId', 'name city phone')
      .populate('destinationProfessionalId', 'name specialization phone')
      .populate('appointmentId', 'date time status consultationType');

    if (!referral) return next(new AppError('Referral not found', 404));
    return success(res, { referral }, 'Referral retrieved');
  } catch (err) {
    next(err);
  }
};

// ── HOSPITAL: update referral status ─────────────────────────────────────────
const updateHospitalReferralStatus = async (req, res, next) => {
  try {
    const { Hospital } = require('../models');
    const hospital = await Hospital.findOne({ createdBy: req.user.sub });
    if (!hospital) return next(new AppError('Hospital profile not found', 404));

    const referral = await Referral.findOne({
      _id: req.params.id,
      destinationHospitalId: hospital._id,
    });
    if (!referral) return next(new AppError('Referral not found', 404));

    const { status, note, nextAction } = req.body;
    if (!status) return fail(res, 'status is required', 400);

    const newStatus = status.toUpperCase();
    if (!Object.values(REFERRAL_STATUS).includes(newStatus)) {
      return fail(res, 'Invalid status value', 400);
    }

    if (!isValidTransition(referral.status, newStatus)) {
      return fail(
        res,
        `Cannot transition referral from ${referral.status} to ${newStatus}`,
        400
      );
    }

    referral.status = newStatus;
    referral.statusHistory.push({
      status: newStatus,
      changedBy: req.user.sub,
      note: note || null,
    });
    if (nextAction !== undefined) referral.nextAction = nextAction;
    await referral.save();

    return success(res, { referral }, 'Referral status updated');
  } catch (err) {
    next(err);
  }
};

// ── HOSPITAL: assign a professional to a referral ─────────────────────────────
const assignProfessionalToReferral = async (req, res, next) => {
  try {
    const { Hospital, Professional } = require('../models');
    const hospital = await Hospital.findOne({ createdBy: req.user.sub });
    if (!hospital) return next(new AppError('Hospital profile not found', 404));

    const referral = await Referral.findOne({
      _id: req.params.id,
      destinationHospitalId: hospital._id,
    });
    if (!referral) return next(new AppError('Referral not found', 404));

    const { professionalId, note } = req.body;
    if (!professionalId) return fail(res, 'professionalId is required', 400);

    // Verify the professional is associated with this hospital
    const professional = await Professional.findOne({
      _id: professionalId,
      hospitalAssociations: {
        $elemMatch: { hospitalId: hospital._id, status: 'APPROVED' },
      },
    });
    if (!professional) {
      return fail(res, 'Professional is not associated with this hospital', 400);
    }

    referral.destinationProfessionalId = professionalId;
    if (note) {
      referral.statusHistory.push({
        status: referral.status,
        changedBy: req.user.sub,
        note: `Assigned professional: ${professional.name}${note ? ` — ${note}` : ''}`,
      });
    }
    await referral.save();

    await referral.populate('destinationProfessionalId', 'name specialization phone');
    return success(res, { referral }, 'Professional assigned to referral');
  } catch (err) {
    next(err);
  }
};

// ── PROFESSIONAL: list referrals assigned to this professional ────────────────
const listProfessionalReferrals = async (req, res, next) => {
  try {
    const { Professional } = require('../models');
    const profile = await Professional.findOne({ userId: req.user.sub });
    if (!profile) return success(res, { referrals: [] }, 'No professional profile');

    const { status } = req.query;
    // Show referrals where this professional is either the source or the destination
    const filter = {
      $or: [
        { sourceProfessionalId: profile._id },
        { destinationProfessionalId: profile._id },
      ],
    };
    if (status) filter.status = status.toUpperCase();

    const referrals = await Referral.find(filter)
      .populate('patientId', 'name email phone')
      .populate('sourceHospitalId', 'name city')
      .populate('destinationHospitalId', 'name city')
      .populate('sourceProfessionalId', 'name specialization')
      .populate('appointmentId', 'date time status')
      .sort({ createdAt: -1 })
      .limit(100);

    return success(res, { referrals, total: referrals.length }, 'Referrals retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PROFESSIONAL: get single assigned referral ─────────────────────────────────
const getProfessionalReferral = async (req, res, next) => {
  try {
    const { Professional } = require('../models');
    const profile = await Professional.findOne({ userId: req.user.sub });
    if (!profile) return next(new AppError('Professional profile not found', 404));

    const referral = await Referral.findOne({
      _id: req.params.id,
      $or: [
        { sourceProfessionalId: profile._id },
        { destinationProfessionalId: profile._id },
      ],
    })
      .populate('patientId', 'name email phone')
      .populate('sourceHospitalId', 'name city phone')
      .populate('destinationHospitalId', 'name city phone address')
      .populate('sourceProfessionalId', 'name specialization')
      .populate('appointmentId', 'date time status consultationType');

    if (!referral) return next(new AppError('Referral not found', 404));
    return success(res, { referral }, 'Referral retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PROFESSIONAL: create referral for a patient ───────────────────────────────
const createProfessionalReferral = async (req, res, next) => {
  try {
    const { Professional } = require('../models');
    const profile = await Professional.findOne({ userId: req.user.sub });
    if (!profile) return fail(res, 'Create your professional profile first', 400);

    const {
      patientId, reason, category, priority,
      destinationProfessionalId, destinationHospitalId, destinationName,
      notes, nextAction,
    } = req.body;

    if (!patientId) return fail(res, 'patientId is required', 400);
    if (!reason || !reason.trim()) return fail(res, 'Reason is required', 400);
    if (!destinationProfessionalId && !destinationHospitalId && !destinationName) {
      return fail(res, 'At least one destination must be specified', 400);
    }

    const referral = await Referral.create({
      patientId,
      sourceProfessionalId: profile._id,
      reason: reason.trim(),
      category: category || null,
      priority: priority || 'NORMAL',
      destinationProfessionalId: destinationProfessionalId || null,
      destinationHospitalId: destinationHospitalId || null,
      destinationName: destinationName || null,
      notes: notes || null,
      nextAction: nextAction || null,
      statusHistory: [{ status: REFERRAL_STATUS.CREATED, changedBy: req.user.sub }],
    });

    return success(res, { referral }, 'Referral created', 201);
  } catch (err) {
    next(err);
  }
};

// ── PROFESSIONAL: update referral status ──────────────────────────────────────
const updateReferralStatus = async (req, res, next) => {
  try {
    const { Professional } = require('../models');
    const profile = await Professional.findOne({ userId: req.user.sub });
    if (!profile) return next(new AppError('Professional profile not found', 404));

    const referral = await Referral.findOne({
      _id: req.params.id,
      $or: [
        { sourceProfessionalId: profile._id },
        { destinationProfessionalId: profile._id },
      ],
    });
    if (!referral) return next(new AppError('Referral not found', 404));

    const { status, note, nextAction, appointmentId } = req.body;
    if (!status) return fail(res, 'status is required', 400);

    const newStatus = status.toUpperCase();
    if (!Object.values(REFERRAL_STATUS).includes(newStatus)) {
      return fail(res, 'Invalid status', 400);
    }

    if (!isValidTransition(referral.status, newStatus)) {
      return fail(
        res,
        `Cannot transition referral from ${referral.status} to ${newStatus}`,
        400
      );
    }

    referral.status = newStatus;
    referral.statusHistory.push({ status: newStatus, changedBy: req.user.sub, note: note || null });
    if (nextAction !== undefined) referral.nextAction = nextAction;
    if (appointmentId !== undefined) referral.appointmentId = appointmentId || null;
    await referral.save();

    return success(res, { referral }, 'Referral status updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // User
  listUserReferrals,
  getUserReferral,
  createUserReferral,
  cancelUserReferral,
  // Hospital
  listHospitalReferrals,
  getHospitalReferral,
  updateHospitalReferralStatus,
  assignProfessionalToReferral,
  // Professional
  listProfessionalReferrals,
  getProfessionalReferral,
  createProfessionalReferral,
  updateReferralStatus,
};
