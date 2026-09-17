/**
 * Professional model — CarePath AI
 *
 * Represents a healthcare professional (doctor, specialist, etc.).
 * Linked to a User account for login; carries its own professional fields.
 * Hospital association workflow is implemented in Stage 8.
 */

const mongoose = require('mongoose');
const { VERIFICATION_STATUS, CONSULTATION_MODES } = require('../utils/constants');

// ── Sub-schema: a single credential document ──────────────────────────────────
const CredentialSchema = new mongoose.Schema(
  {
    title:       { type: String, trim: true, required: true },
    institution: { type: String, trim: true },
    year:        { type: Number },
    documentUrl: { type: String, trim: true },   // uploaded in Stage 11
  },
  { _id: true, timestamps: false }
);

// ── Sub-schema: a hospital association record ─────────────────────────────────
const HospitalAssociationSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    department:  { type: String, trim: true },
    role:        { type: String, trim: true },       // e.g. "Consultant", "Resident"
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REMOVED'],
      default: 'PENDING',
    },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt:  { type: Date, default: null },
  },
  { _id: true, timestamps: false }
);

// ── Sub-schema: availability slot ─────────────────────────────────────────────
const AvailabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      required: true,
    },
    startTime: { type: String, trim: true },  // e.g. "09:00"
    endTime:   { type: String, trim: true },  // e.g. "17:00"
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

// ── Main Professional schema ───────────────────────────────────────────────────
const ProfessionalSchema = new mongoose.Schema(
  {
    // ── Link to User account ──────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Professional must be linked to a User account'],
      unique: true,    // one Professional profile per User
    },

    // ── Identity (mirrors User but kept here for quick queries) ───────────────
    name:         { type: String, trim: true, required: [true, 'Name is required'] },
    email:        { type: String, trim: true, lowercase: true },
    phone:        { type: String, trim: true },
    profileImage: { type: String, default: null },

    // ── Professional details ──────────────────────────────────────────────────
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      default: 0,
    },
    licenseNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,    // allows multiple null values
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [2000, 'Bio must not exceed 2000 characters'],
    },

    // ── Credentials ───────────────────────────────────────────────────────────
    credentials: [CredentialSchema],

    // ── Hospital associations ─────────────────────────────────────────────────
    hospitalAssociations: [HospitalAssociationSchema],

    // ── Availability ──────────────────────────────────────────────────────────
    availability: [AvailabilitySchema],

    // ── Consultation modes ────────────────────────────────────────────────────
    consultationModes: [
      {
        type: String,
        enum: {
          values: Object.values(CONSULTATION_MODES),
          message: 'Invalid consultation mode: {VALUE}',
        },
      },
    ],

    // ── Verification ──────────────────────────────────────────────────────────
    verificationStatus: {
      type: String,
      enum: {
        values: Object.values(VERIFICATION_STATUS),
        message: 'Invalid verification status: {VALUE}',
      },
      default: VERIFICATION_STATUS.PENDING,
    },
    verifiedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt:      { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: null },

    // ── Status ────────────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// NOTE: userId is NOT listed here — unique:true on the field already creates the index.
// NOTE: licenseNumber is NOT listed here — unique+sparse on the field creates the index.
ProfessionalSchema.index({ specialization: 1 });
ProfessionalSchema.index({ verificationStatus: 1 });
ProfessionalSchema.index({ 'hospitalAssociations.hospitalId': 1 });
ProfessionalSchema.index({ 'hospitalAssociations.status': 1 });
ProfessionalSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Professional', ProfessionalSchema);
