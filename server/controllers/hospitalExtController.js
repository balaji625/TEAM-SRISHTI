/**
 * hospitalExtController — CarePath AI
 *
 * Extended hospital endpoints:
 *   Requests, Analytics, Associations management
 *
 * GET  /api/hospital/requests             — list requests targeted at this hospital
 * PUT  /api/hospital/requests/:id/respond — respond to a request
 * GET  /api/hospital/analytics            — summary analytics
 * GET  /api/hospital/associations         — list ALL doctor association requests (any status)
 * PUT  /api/hospital/associations/:assocId/approve — approve doctor association
 * PUT  /api/hospital/associations/:assocId/reject  — reject doctor association
 */

'use strict';

const { Hospital, Professional, Appointment, Request } = require('../models');
const { success, fail } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');

// ── Helper: resolve hospital for this user ────────────────────────────────────
const getHospital = (userId) => Hospital.findOne({ createdBy: userId });

// ── GET /api/hospital/requests ────────────────────────────────────────────────
const listRequests = async (req, res, next) => {
  try {
    const hospital = await getHospital(req.user.sub);
    if (!hospital) return success(res, { requests: [], total: 0 }, 'No hospital profile');

    const { status, page = 1, limit = 20 } = req.query;
    const filter = { hospitalId: hospital._id };
    if (status) filter.status = status;

    const requests = await Request.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Request.countDocuments(filter);
    return success(res, { requests, total, page: Number(page) }, 'Requests retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/hospital/requests/:id/respond ─────────────────────────────────
const respondRequest = async (req, res, next) => {
  try {
    const hospital = await getHospital(req.user.sub);
    if (!hospital) return next(new AppError('Hospital profile not found', 404));

    const { status, message } = req.body;
    const validStatuses = ['APPROVED', 'REJECTED', 'RESOLVED'];
    if (!validStatuses.includes(status)) return fail(res, 'Invalid status', 400);

    const request = await Request.findOneAndUpdate(
      { _id: req.params.id, hospitalId: hospital._id },
      {
        $set: {
          status,
          'response.message': message || null,
          'response.respondedBy': req.user.sub,
          'response.respondedAt': new Date(),
          resolvedAt: ['RESOLVED', 'REJECTED'].includes(status) ? new Date() : null,
        },
      },
      { new: true }
    );
    if (!request) return next(new AppError('Request not found', 404));
    return success(res, { request }, 'Request updated');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hospital/analytics ───────────────────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    const hospital = await getHospital(req.user.sub);
    if (!hospital) return success(res, { analytics: {} }, 'No hospital profile');

    const [
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      totalDoctors,
      pendingAssociations,
      totalRequests,
      pendingRequests,
    ] = await Promise.all([
      Appointment.countDocuments({ hospitalId: hospital._id }),
      Appointment.countDocuments({ hospitalId: hospital._id, status: 'PENDING' }),
      Appointment.countDocuments({ hospitalId: hospital._id, status: 'CONFIRMED' }),
      Appointment.countDocuments({ hospitalId: hospital._id, status: 'COMPLETED' }),
      Appointment.countDocuments({ hospitalId: hospital._id, status: 'CANCELLED' }),
      Professional.countDocuments({
        'hospitalAssociations': { $elemMatch: { hospitalId: hospital._id, status: 'APPROVED' } },
      }),
      Professional.countDocuments({
        'hospitalAssociations': { $elemMatch: { hospitalId: hospital._id, status: 'PENDING' } },
      }),
      Request.countDocuments({ hospitalId: hospital._id }),
      Request.countDocuments({ hospitalId: hospital._id, status: 'PENDING' }),
    ]);

    // Last 7 days appointments
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAppointments = await Appointment.countDocuments({
      hospitalId: hospital._id,
      createdAt: { $gte: sevenDaysAgo },
    });

    const analytics = {
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        last7Days: recentAppointments,
      },
      doctors: {
        total: totalDoctors,
        pendingAssociations,
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
      },
      verificationStatus: hospital.verificationStatus,
    };

    return success(res, { analytics }, 'Analytics retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hospital/associations ────────────────────────────────────────────
const listAssociations = async (req, res, next) => {
  try {
    const hospital = await getHospital(req.user.sub);
    if (!hospital) return success(res, { associations: [] }, 'No hospital profile');

    const { status } = req.query;

    const matchFilter = { hospitalId: hospital._id };
    if (status) matchFilter.status = status;

    const professionals = await Professional.find({
      'hospitalAssociations': { $elemMatch: matchFilter },
    }).select('name specialization email phone experience verificationStatus hospitalAssociations');

    // Flatten to association list with professional info attached
    const associations = [];
    for (const prof of professionals) {
      const assoc = prof.hospitalAssociations.find(
        (a) => String(a.hospitalId) === String(hospital._id) && (!status || a.status === status)
      );
      if (assoc) {
        associations.push({
          _id: assoc._id,
          professionalId: prof._id,
          professionalName: prof.name,
          specialization: prof.specialization,
          email: prof.email,
          experience: prof.experience,
          department: assoc.department,
          role: assoc.role,
          status: assoc.status,
          requestedAt: assoc.requestedAt,
          resolvedAt: assoc.resolvedAt,
        });
      }
    }

    associations.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    return success(res, { associations, total: associations.length }, 'Associations retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/hospital/associations/:assocId/approve ───────────────────────────
const approveAssociation = async (req, res, next) => {
  try {
    const hospital = await getHospital(req.user.sub);
    if (!hospital) return next(new AppError('Hospital profile not found', 404));

    const professional = await Professional.findOne({
      'hospitalAssociations._id': req.params.assocId,
      'hospitalAssociations.hospitalId': hospital._id,
    });
    if (!professional) return next(new AppError('Association not found', 404));

    const assoc = professional.hospitalAssociations.id(req.params.assocId);
    if (!assoc) return next(new AppError('Association not found', 404));
    if (assoc.status !== 'PENDING') return fail(res, 'Only PENDING associations can be approved', 400);

    assoc.status = 'APPROVED';
    assoc.resolvedAt = new Date();
    await professional.save();

    return success(res, {}, 'Association approved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/hospital/associations/:assocId/reject ────────────────────────────
const rejectAssociation = async (req, res, next) => {
  try {
    const hospital = await getHospital(req.user.sub);
    if (!hospital) return next(new AppError('Hospital profile not found', 404));

    const professional = await Professional.findOne({
      'hospitalAssociations._id': req.params.assocId,
      'hospitalAssociations.hospitalId': hospital._id,
    });
    if (!professional) return next(new AppError('Association not found', 404));

    const assoc = professional.hospitalAssociations.id(req.params.assocId);
    if (!assoc) return next(new AppError('Association not found', 404));
    if (assoc.status !== 'PENDING') return fail(res, 'Only PENDING associations can be rejected', 400);

    assoc.status = 'REJECTED';
    assoc.resolvedAt = new Date();
    await professional.save();

    return success(res, {}, 'Association rejected');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listRequests, respondRequest, getAnalytics,
  listAssociations, approveAssociation, rejectAssociation,
};
