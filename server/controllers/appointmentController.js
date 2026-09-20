/**
 * appointmentController — CarePath AI
 *
 * Handles appointment CRUD for USER and HOSPITAL roles.
 *
 * Routes mounted:
 *   USER:
 *     GET  /api/user/appointments           — list own appointments
 *     POST /api/user/appointments           — book new appointment
 *     GET  /api/user/appointments/:id       — get single appointment
 *     PUT  /api/user/appointments/:id/cancel — cancel own appointment
 *
 *   HOSPITAL:
 *     GET  /api/hospital/appointments       — list hospital appointments
 *     PUT  /api/hospital/appointments/:id/status — update status
 */

'use strict';

const { validationResult } = require('express-validator');
const { Appointment, Hospital, Professional } = require('../models');
const { success, fail } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');
const { APPOINTMENT_STATUS } = require('../utils/constants');

// ── USER: list own appointments ───────────────────────────────────────────────
const listUserAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.sub };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('hospitalId', 'name city country')
      .populate('professionalId', 'name specialization')
      .populate('expertId', 'name specialization')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);
    return success(res, { appointments, total, page: Number(page) }, 'Appointments retrieved');
  } catch (err) {
    next(err);
  }
};

// ── USER: book HSPL appointment (hospital + professional required) ─────────────
const bookAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, errors.array()[0].msg, 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { date, time, reason, consultationType, hospitalId, professionalId, expertId, notes } = req.body;

    // ── Require both hospital and professional (unless using expert) ───────────
    if (!expertId) {
      if (!hospitalId) {
        return fail(res, 'Hospital selection is required to book an appointment', 400);
      }
      if (!professionalId) {
        return fail(res, 'Doctor/Professional selection is required to book an appointment', 400);
      }
    }

    // ── Validate hospital exists ──────────────────────────────────────────────
    if (hospitalId) {
      const hospital = await Hospital.findOne({ _id: hospitalId, isActive: true });
      if (!hospital) {
        return fail(res, 'Selected hospital does not exist or is not active', 400);
      }
    }

    // ── Cross-hospital validation: professional must belong to the hospital ────
    if (hospitalId && professionalId) {
      const professional = await Professional.findOne({
        _id: professionalId,
        hospitalAssociations: {
          $elemMatch: { hospitalId, status: 'APPROVED' },
        },
      });
      if (!professional) {
        return fail(
          res,
          'The selected doctor is not associated with the selected hospital. Please select a doctor from this hospital.',
          400
        );
      }
    }

    // ── Backend double-booking check (race-condition protection) ───────────────
    // Re-check slot availability immediately before creating the appointment.
    // This is the authoritative check — frontend slot display is informational only.
    const activeStatuses = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED];

    if (professionalId) {
      const conflict = await Appointment.findOne({
        professionalId,
        date: new Date(date),
        time,
        status: { $in: activeStatuses },
      });
      if (conflict) {
        return fail(
          res,
          'This slot was just booked by another user. Please select another available slot.',
          409
        );
      }
    }

    if (expertId) {
      const conflict = await Appointment.findOne({
        expertId,
        date: new Date(date),
        time,
        status: { $in: activeStatuses },
      });
      if (conflict) {
        return fail(
          res,
          'This slot was just booked by another user. Please select another available slot.',
          409
        );
      }
    }

    try {
      const appointment = await Appointment.create({
        userId: req.user.sub,
        date, time, reason,
        consultationType: consultationType || 'IN_PERSON',
        hospitalId: hospitalId || null,
        professionalId: professionalId || null,
        expertId: expertId || null,
        notes: notes || null,
        statusHistory: [{ status: 'PENDING', changedBy: req.user.sub }],
      });
      return success(res, { appointment }, 'Appointment booked', 201);
    } catch (createErr) {
      // MongoDB unique index violation — another request won the race
      if (createErr.code === 11000) {
        return fail(
          res,
          'This slot was just booked by another user. Please select another available slot.',
          409
        );
      }
      throw createErr;
    }
  } catch (err) {
    next(err);
  }
};

// ── USER: get single appointment ─────────────────────────────────────────────
const getUserAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, userId: req.user.sub })
      .populate('hospitalId', 'name city country phone')
      .populate('professionalId', 'name specialization phone')
      .populate('expertId', 'name specialization');

    if (!appointment) return next(new AppError('Appointment not found', 404));
    return success(res, { appointment }, 'Appointment retrieved');
  } catch (err) {
    next(err);
  }
};

// ── USER: cancel appointment ─────────────────────────────────────────────────
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!appointment) return next(new AppError('Appointment not found', 404));

    const cancellable = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED];
    if (!cancellable.includes(appointment.status)) {
      return fail(res, `Cannot cancel a ${appointment.status.toLowerCase()} appointment`, 400);
    }

    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    appointment.cancellationReason = req.body.reason || null;
    appointment.statusHistory.push({ status: APPOINTMENT_STATUS.CANCELLED, changedBy: req.user.sub });
    await appointment.save();

    return success(res, { appointment }, 'Appointment cancelled');
  } catch (err) {
    next(err);
  }
};

// ── HOSPITAL: list appointments ───────────────────────────────────────────────
const listHospitalAppointments = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ createdBy: req.user.sub });
    if (!hospital) return success(res, { appointments: [], total: 0 }, 'No hospital profile');

    const { status, page = 1, limit = 20 } = req.query;
    const filter = { hospitalId: hospital._id };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('userId', 'name email phone')
      .populate('professionalId', 'name specialization')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);
    return success(res, { appointments, total, page: Number(page) }, 'Appointments retrieved');
  } catch (err) {
    next(err);
  }
};

// ── HOSPITAL: update appointment status ──────────────────────────────────────
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ createdBy: req.user.sub });
    if (!hospital) return next(new AppError('Hospital profile not found', 404));

    const appointment = await Appointment.findOne({ _id: req.params.id, hospitalId: hospital._id });
    if (!appointment) return next(new AppError('Appointment not found', 404));

    const { status, note } = req.body;
    const validStatuses = Object.values(APPOINTMENT_STATUS);
    if (!validStatuses.includes(status)) return fail(res, 'Invalid status', 400);

    appointment.status = status;
    appointment.statusHistory.push({ status, changedBy: req.user.sub, note: note || null });
    await appointment.save();

    return success(res, { appointment }, 'Appointment status updated');
  } catch (err) {
    next(err);
  }
};

// ── USER: book Expert appointment (direct — no hospital required) ─────────────
const bookExpertAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, errors.array()[0].msg, 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { Expert } = require('../models');
    const { date, time, reason, consultationType, expertId, notes } = req.body;

    if (!expertId) return fail(res, 'Expert selection is required', 400);

    // Validate expert exists and is verified
    const expert = await Expert.findOne({ _id: expertId, verificationStatus: 'VERIFIED', isActive: true });
    if (!expert) return fail(res, 'Selected expert does not exist, is not verified, or is not active', 400);

    const activeStatuses = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED];
    const conflict = await Appointment.findOne({
      expertId,
      date: new Date(date),
      time,
      status: { $in: activeStatuses },
    });
    if (conflict) {
      return fail(res, 'This slot was just booked by another user. Please select another available slot.', 409);
    }

    try {
      const appointment = await Appointment.create({
        userId: req.user.sub,
        date, time, reason,
        consultationType: consultationType || 'IN_PERSON',
        expertId,
        hospitalId: null,
        professionalId: null,
        notes: notes || null,
        statusHistory: [{ status: 'PENDING', changedBy: req.user.sub }],
      });
      return success(res, { appointment }, 'Expert appointment booked', 201);
    } catch (createErr) {
      if (createErr.code === 11000) {
        return fail(res, 'This slot was just booked by another user. Please select another available slot.', 409);
      }
      throw createErr;
    }
  } catch (err) {
    next(err);
  }
};

// ── USER: book Professional appointment (direct — no hospital required) ────────
const bookProfessionalAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, errors.array()[0].msg, 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { date, time, reason, consultationType, professionalId, notes } = req.body;

    if (!professionalId) return fail(res, 'Professional selection is required', 400);

    // Validate professional exists and is verified
    const professional = await Professional.findOne({ _id: professionalId, verificationStatus: 'VERIFIED', isActive: true });
    if (!professional) return fail(res, 'Selected professional does not exist, is not verified, or is not active', 400);

    const activeStatuses = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED];
    const conflict = await Appointment.findOne({
      professionalId,
      date: new Date(date),
      time,
      status: { $in: activeStatuses },
    });
    if (conflict) {
      return fail(res, 'This slot was just booked by another user. Please select another available slot.', 409);
    }

    try {
      const appointment = await Appointment.create({
        userId: req.user.sub,
        date, time, reason,
        consultationType: consultationType || 'IN_PERSON',
        professionalId,
        hospitalId: null,
        expertId: null,
        notes: notes || null,
        statusHistory: [{ status: 'PENDING', changedBy: req.user.sub }],
      });
      return success(res, { appointment }, 'Professional appointment booked', 201);
    } catch (createErr) {
      if (createErr.code === 11000) {
        return fail(res, 'This slot was just booked by another user. Please select another available slot.', 409);
      }
      throw createErr;
    }
  } catch (err) {
    next(err);
  }
};

// ── USER: list Expert appointments only ───────────────────────────────────────
const listExpertAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.sub, expertId: { $ne: null }, professionalId: null, hospitalId: null };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('expertId', 'name specialization')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);
    return success(res, { appointments, total, page: Number(page) }, 'Expert appointments retrieved');
  } catch (err) {
    next(err);
  }
};

// ── USER: list Professional (direct) appointments only ────────────────────────
const listProfessionalAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.sub, professionalId: { $ne: null }, hospitalId: null };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('professionalId', 'name specialization')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);
    return success(res, { appointments, total, page: Number(page) }, 'Professional appointments retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUserAppointments,
  bookAppointment,
  bookExpertAppointment,
  bookProfessionalAppointment,
  listExpertAppointments,
  listProfessionalAppointments,
  getUserAppointment,
  cancelAppointment,
  listHospitalAppointments,
  updateAppointmentStatus,
};
