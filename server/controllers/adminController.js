/**
 * adminController — CarePath AI
 *
 * Platform admin overview. Read-only stats + pending verification queues.
 * All routes require ADMIN role.
 *
 * Routes:
 *   GET /api/admin/overview                  — platform-wide counts
 *   GET /api/admin/users                     — list users (paginated, filterable)
 *   PUT /api/admin/users/:id/toggle-active   — activate/deactivate user
 *   GET /api/admin/hospitals                 — list all hospitals
 *   GET /api/admin/hospitals/pending         — hospitals awaiting verification
 *   PUT /api/admin/hospitals/:id/verify      — approve/reject hospital
 *   GET /api/admin/professionals             — list all professionals
 *   GET /api/admin/professionals/pending     — professionals awaiting verification
 *   PUT /api/admin/professionals/:id/verify  — approve/reject professional
 *   GET /api/admin/experts                   — list all experts
 *   GET /api/admin/experts/pending           — experts awaiting verification
 *   PUT /api/admin/experts/:id/verify        — approve/reject expert
 *   GET /api/admin/appointments              — list all appointments
 *   GET /api/admin/requests                  — list all requests (incl expert→admin)
 *   PUT /api/admin/requests/:id/respond      — respond to request
 *   GET /api/admin/audit-logs                — list audit log entries
 *   GET /api/admin/analytics                 — platform analytics
 *   GET /api/admin/settings                  — admin settings (placeholder)
 */

'use strict';

const bcrypt = require('bcryptjs');
const { User, Hospital, Professional, Expert, AuditLog, Request } = require('../models');
const { success, fail } = require('../utils/responseHelper');
const { AppError }      = require('../middleware/errorHandler');
const { VERIFICATION_STATUS, ROLES, REQUEST_TYPES, REQUEST_STATUS } = require('../utils/constants');

// ── GET /api/admin/overview ───────────────────────────────────────────────────
const getOverview = async (req, res, next) => {
  try {
    const [
      totalUsers, totalHospitals, totalProfessionals, totalExperts,
      pendingHospitals, pendingProfessionals, pendingExperts,
      activeUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Hospital.countDocuments(),
      Professional.countDocuments(),
      Expert.countDocuments(),
      Hospital.countDocuments({ verificationStatus: VERIFICATION_STATUS.PENDING }),
      Professional.countDocuments({ verificationStatus: VERIFICATION_STATUS.PENDING }),
      Expert.countDocuments({ verificationStatus: VERIFICATION_STATUS.PENDING }),
      User.countDocuments({ isActive: true }),
    ]);

    return success(res, {
      overview: {
        users:            { total: totalUsers, active: activeUsers },
        hospitals:        { total: totalHospitals, pendingVerification: pendingHospitals },
        professionals:    { total: totalProfessionals, pendingVerification: pendingProfessionals },
        experts:          { total: totalExperts, pendingVerification: pendingExperts },
        totalPending:     pendingHospitals + pendingProfessionals + pendingExperts,
      },
    }, 'Platform overview retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role.toUpperCase();
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(100, Number(limit))).select('-password'),
      User.countDocuments(filter),
    ]);
    return success(res, { users, total, page: Number(page), limit: Number(limit) }, 'Users retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/admin/users/:id/toggle-active ────────────────────────────────────
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));
    if (user.role === 'ADMIN') return fail(res, 'Cannot deactivate admin accounts', 403);
    user.isActive = !user.isActive;
    await user.save();
    return success(res, { user: { _id: user._id, isActive: user.isActive } },
      `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/hospitals ───────────────────────────────────────────────────
const listHospitals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status.toUpperCase();
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city:  { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
    const [hospitals, total] = await Promise.all([
      Hospital.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(100, Number(limit))),
      Hospital.countDocuments(filter),
    ]);
    return success(res, { hospitals, total, page: Number(page) }, 'Hospitals retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/hospitals/pending ─────────────────────────────────────────
const getPendingHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find({ verificationStatus: VERIFICATION_STATUS.PENDING })
      .sort({ createdAt: 1 }).limit(50);
    return success(res, { hospitals, total: hospitals.length }, 'Pending hospitals retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/professionals ──────────────────────────────────────────────
const listProfessionals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status.toUpperCase();
    if (search) {
      filter.$or = [
        { name:           { $regex: search, $options: 'i' } },
        { email:          { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
    const [professionals, total] = await Promise.all([
      Professional.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(100, Number(limit))),
      Professional.countDocuments(filter),
    ]);
    return success(res, { professionals, total, page: Number(page) }, 'Professionals retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/professionals/pending ──────────────────────────────────────
const getPendingProfessionals = async (req, res, next) => {
  try {
    const professionals = await Professional.find({ verificationStatus: VERIFICATION_STATUS.PENDING })
      .sort({ createdAt: 1 }).limit(50);
    return success(res, { professionals, total: professionals.length }, 'Pending professionals retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/experts ────────────────────────────────────────────────────
const listExperts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status.toUpperCase();
    if (search) {
      filter.$or = [
        { name:           { $regex: search, $options: 'i' } },
        { email:          { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
    const [experts, total] = await Promise.all([
      Expert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(100, Number(limit))),
      Expert.countDocuments(filter),
    ]);
    return success(res, { experts, total, page: Number(page) }, 'Experts retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/experts/pending ────────────────────────────────────────────
const getPendingExperts = async (req, res, next) => {
  try {
    const experts = await Expert.find({ verificationStatus: VERIFICATION_STATUS.PENDING })
      .sort({ createdAt: 1 }).limit(50);
    return success(res, { experts, total: experts.length }, 'Pending experts retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/admin/hospitals/:id/verify ───────────────────────────────────────
const verifyHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return fail(res, 'action must be "approve" or "reject"', 400);
    }
    const update = {
      verificationStatus: action === 'approve' ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.REJECTED,
      verifiedBy: req.user.sub,
      verifiedAt: new Date(),
    };
    if (action === 'reject' && reason) update.rejectionReason = reason;
    const hospital = await Hospital.findByIdAndUpdate(id, update, { new: true });
    if (!hospital) return next(new AppError('Hospital not found', 404));
    return success(res, { hospital }, `Hospital ${action}d successfully`);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/admin/professionals/:id/verify ───────────────────────────────────
const verifyProfessional = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return fail(res, 'action must be "approve" or "reject"', 400);
    }
    const update = {
      verificationStatus: action === 'approve' ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.REJECTED,
      verifiedBy: req.user.sub,
      verifiedAt: new Date(),
    };
    if (action === 'reject' && reason) update.rejectionReason = reason;
    const professional = await Professional.findByIdAndUpdate(id, update, { new: true });
    if (!professional) return next(new AppError('Professional not found', 404));
    return success(res, { professional }, `Professional ${action}d successfully`);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/admin/experts/:id/verify ─────────────────────────────────────────
const verifyExpert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return fail(res, 'action must be "approve" or "reject"', 400);
    }
    const update = {
      verificationStatus: action === 'approve' ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.REJECTED,
      verifiedBy: req.user.sub,
      verifiedAt: new Date(),
    };
    if (action === 'reject' && reason) update.rejectionReason = reason;
    const expert = await Expert.findByIdAndUpdate(id, update, { new: true });
    if (!expert) return next(new AppError('Expert not found', 404));
    return success(res, { expert }, `Expert ${action}d successfully`);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/appointments ───────────────────────────────────────────────
const listAppointments = async (req, res, next) => {
  try {
    // Dynamic import to avoid circular deps if Appointment isn't in models/index yet
    const { Appointment } = require('../models');
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status.toUpperCase();
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('userId', 'name email')
        .populate('hospitalId', 'name city')
        .populate('professionalId', 'name specialization')
        .sort({ createdAt: -1 }).skip(skip).limit(Math.min(100, Number(limit))),
      Appointment.countDocuments(filter),
    ]);
    return success(res, { appointments, total, page: Number(page) }, 'Appointments retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/requests ───────────────────────────────────────────────────
const listRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, requestType, search } = req.query;
    const filter = {};
    if (status) filter.status = status.toUpperCase();
    if (requestType) filter.requestType = requestType.toUpperCase();
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
    const [requests, total] = await Promise.all([
      Request.find(filter)
        .populate('userId', 'name email role')
        .populate('hospitalId', 'name city')
        .populate('professionalId', 'name specialization')
        .populate('expertId', 'name specialization')
        .sort({ createdAt: -1 }).skip(skip).limit(Math.min(100, Number(limit))),
      Request.countDocuments(filter),
    ]);
    return success(res, { requests, total, page: Number(page) }, 'Requests retrieved');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/admin/requests/:id/respond ───────────────────────────────────────
const respondRequest = async (req, res, next) => {
  try {
    const { status, message } = req.body;
    const validStatuses = ['APPROVED', 'REJECTED', 'RESOLVED'];
    if (!validStatuses.includes(status)) return fail(res, 'Invalid status', 400);
    const request = await Request.findByIdAndUpdate(
      req.params.id,
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

// ── GET /api/admin/audit-logs ─────────────────────────────────────────────────
const listAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, action, resource, userId } = req.query;
    const filter = {};
    if (action)   filter.action   = action.toUpperCase();
    if (resource) filter.resource = resource.toUpperCase();
    if (userId)   filter.userId   = userId;
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 }).skip(skip).limit(Math.min(100, Number(limit))),
      AuditLog.countDocuments(filter),
    ]);
    return success(res, { logs, total, page: Number(page) }, 'Audit logs retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    const { Appointment } = require('../models');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeUsers, newUsersLast30,
      totalHospitals, verifiedHospitals, pendingHospitals,
      totalProfessionals, verifiedProfessionals, pendingProfessionals,
      totalExperts, verifiedExperts, pendingExperts,
      totalAppointments, appointmentsLast7,
      totalRequests, pendingRequests,
      usersByRole,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Hospital.countDocuments(),
      Hospital.countDocuments({ verificationStatus: 'VERIFIED' }),
      Hospital.countDocuments({ verificationStatus: 'PENDING' }),
      Professional.countDocuments(),
      Professional.countDocuments({ verificationStatus: 'VERIFIED' }),
      Professional.countDocuments({ verificationStatus: 'PENDING' }),
      Expert.countDocuments(),
      Expert.countDocuments({ verificationStatus: 'VERIFIED' }),
      Expert.countDocuments({ verificationStatus: 'PENDING' }),
      Appointment.countDocuments().catch(() => 0),
      Appointment.countDocuments({ createdAt: { $gte: sevenDaysAgo } }).catch(() => 0),
      Request.countDocuments(),
      Request.countDocuments({ status: 'PENDING' }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    const roleBreakdown = {};
    for (const r of usersByRole) roleBreakdown[r._id] = r.count;

    return success(res, {
      analytics: {
        users: { total: totalUsers, active: activeUsers, newLast30Days: newUsersLast30, byRole: roleBreakdown },
        hospitals: { total: totalHospitals, verified: verifiedHospitals, pending: pendingHospitals },
        professionals: { total: totalProfessionals, verified: verifiedProfessionals, pending: pendingProfessionals },
        experts: { total: totalExperts, verified: verifiedExperts, pending: pendingExperts },
        appointments: { total: totalAppointments, last7Days: appointmentsLast7 },
        requests: { total: totalRequests, pending: pendingRequests },
      },
    }, 'Analytics retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/settings ───────────────────────────────────────────────────
const getSettings = async (req, res, next) => {
  try {
    return success(res, {
      settings: {
        platformName: 'CarePath AI',
        maintenanceMode: false,
        registrationOpen: true,
        maxFileUploadMB: 10,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@carepath.ai',
      },
    }, 'Settings retrieved');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/admin/experts/create ───────────────────────────────────────────
// Admin creates a new Expert: User account + Expert profile, pre-verified.
const createExpert = async (req, res, next) => {
  try {
    const {
      name, email, password,
      specialization, qualification, experience, bio, consultationModes, phone,
    } = req.body;

    // Basic validation
    if (!name || !email || !password || !specialization) {
      return fail(res, 'name, email, password and specialization are required', 400);
    }
    if (password.length < 8) {
      return fail(res, 'Password must be at least 8 characters', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return fail(res, 'An account with this email address already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create User account (role = EXPERT, pre-verified by admin)
    const user = await User.create({
      name:       name.trim(),
      email:      normalizedEmail,
      password:   passwordHash,
      role:       ROLES.EXPERT,
      phone:      phone?.trim() || undefined,
      isVerified: true,
      isActive:   true,
    });

    // Create Expert profile (status = VERIFIED since admin is creating it)
    const expert = await Expert.create({
      userId:             user._id,
      name:               name.trim(),
      email:              normalizedEmail,
      phone:              phone?.trim() || undefined,
      specialization:     specialization.trim(),
      qualification:      qualification?.trim() || undefined,
      experience:         experience != null ? Number(experience) : 0,
      bio:                bio?.trim() || undefined,
      consultationModes:  Array.isArray(consultationModes) ? consultationModes : [],
      verificationStatus: VERIFICATION_STATUS.VERIFIED,
      verifiedBy:         req.user.sub,
      verifiedAt:         new Date(),
    });

    return success(res, {
      user:   { _id: user._id, name: user.name, email: user.email, role: user.role },
      expert: { _id: expert._id, specialization: expert.specialization, verificationStatus: expert.verificationStatus },
    }, 'Expert account created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/admin/professionals/create ──────────────────────────────────────
// Admin directly creates a doctor (PROFESSIONAL) account + profile, pre-verified.
const createDoctor = async (req, res, next) => {
  try {
    const {
      name, email, password, phone,
      specialization, qualification, experience, licenseNumber, bio, consultationModes,
    } = req.body;

    if (!name || !email || !password || !specialization) {
      return fail(res, 'name, email, password and specialization are required', 400);
    }
    if (password.length < 8) {
      return fail(res, 'Password must be at least 8 characters', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return fail(res, 'An account with this email address already exists', 409);
    }

    if (licenseNumber) {
      const existingLic = await Professional.findOne({ licenseNumber });
      if (existingLic) {
        return fail(res, 'A professional with this license number already exists', 409);
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create User account (role = PROFESSIONAL, pre-verified by admin)
    const user = await User.create({
      name:       name.trim(),
      email:      normalizedEmail,
      password:   passwordHash,
      role:       ROLES.PROFESSIONAL,
      phone:      phone?.trim() || undefined,
      isVerified: true,
      isActive:   true,
    });

    // Create Professional profile (VERIFIED since admin is onboarding them)
    const professional = await Professional.create({
      userId:             user._id,
      name:               name.trim(),
      email:              normalizedEmail,
      phone:              phone?.trim() || undefined,
      specialization:     specialization.trim(),
      qualification:      qualification?.trim() || undefined,
      experience:         experience != null ? Number(experience) : 0,
      licenseNumber:      licenseNumber?.trim() || undefined,
      bio:                bio?.trim() || undefined,
      consultationModes:  Array.isArray(consultationModes) ? consultationModes : [],
      verificationStatus: VERIFICATION_STATUS.VERIFIED,
      verifiedBy:         req.user.sub,
      verifiedAt:         new Date(),
    });

    return success(res, {
      user:         { _id: user._id, name: user.name, email: user.email, role: user.role },
      professional: { _id: professional._id, specialization: professional.specialization, verificationStatus: professional.verificationStatus },
    }, 'Doctor account created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/admin/hospitals/create ─────────────────────────────────────────
// Admin directly creates a hospital account + Hospital profile, pre-verified.
const createHospital = async (req, res, next) => {
  try {
    const {
      name, email, password, phone, contactName,
      city, state, country, description,
      specialties, services, facilities, emergencyAvailable,
    } = req.body;

    if (!name || !email || !password) {
      return fail(res, 'name, email and password are required', 400);
    }
    if (password.length < 8) {
      return fail(res, 'Password must be at least 8 characters', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate User email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return fail(res, 'An account with this email address already exists', 409);
    }

    // Check duplicate Hospital email
    const existingHosp = await Hospital.findOne({ email: normalizedEmail });
    if (existingHosp) {
      return fail(res, 'A hospital with this email address already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create User account (role = HOSPITAL, pre-verified by admin)
    const user = await User.create({
      name:       (contactName || name).trim(),
      email:      normalizedEmail,
      password:   passwordHash,
      role:       ROLES.HOSPITAL,
      phone:      phone?.trim() || undefined,
      isVerified: true,
      isActive:   true,
    });

    // Create Hospital profile (VERIFIED immediately since admin is creating it)
    const hospital = await Hospital.create({
      name:               name.trim(),
      email:              normalizedEmail,
      phone:              phone?.trim() || undefined,
      description:        description?.trim() || undefined,
      city:               city?.trim() || undefined,
      state:              state?.trim() || undefined,
      country:            country?.trim() || undefined,
      specialties:        Array.isArray(specialties) ? specialties : [],
      services:           Array.isArray(services) ? services : [],
      facilities:         Array.isArray(facilities) ? facilities : [],
      emergencyAvailable: emergencyAvailable === true || emergencyAvailable === 'true',
      createdBy:          user._id,
      verificationStatus: VERIFICATION_STATUS.VERIFIED,
      verifiedBy:         req.user.sub,
      verifiedAt:         new Date(),
    });

    return success(res, {
      user:     { _id: user._id, name: user.name, email: user.email, role: user.role },
      hospital: { _id: hospital._id, name: hospital.name, verificationStatus: hospital.verificationStatus },
    }, 'Hospital account created successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  listUsers, toggleUserActive,
  listHospitals, getPendingHospitals,
  listProfessionals, getPendingProfessionals,
  listExperts, getPendingExperts,
  verifyHospital, verifyProfessional, verifyExpert,
  createExpert, createDoctor, createHospital,
  listAppointments,
  listRequests, respondRequest,
  listAuditLogs,
  getAnalytics,
  getSettings,
};
