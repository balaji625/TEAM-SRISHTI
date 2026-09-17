/**
 * Expert model — CarePath AI
 *
 * Represents an independent healthcare expert.
 * Must be VERIFIED before accepting consultations (enforced in Stage 9 RBAC middleware).
 */

const mongoose = require('mongoose');
const { VERIFICATION_STATUS, CONSULTATION_MODES } = require('../utils/constants');

// ── Sub-schema: credential ────────────────────────────────────────────────────
const CredentialSchema = new mongoose.Schema(
  {
    title:       { type: String, trim: true, required: true },
    institution: { type: String, trim: true },
    year:        { type: Number },
    documentUrl: { type: String, trim: true },
  },
  { _id: true }
);

// ── Sub-schema: availability slot ─────────────────────────────────────────────
const AvailabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      required: true,
    },
    startTime: { type: String, trim: true },
    endTime:   { type: String, trim: true },
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

// ── Main Expert schema ────────────────────────────────────────────────────────
const ExpertSchema = new mongoose.Schema(
  {
    // ── Link to User account ──────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Expert must be linked to a User account'],
      unique: true,
    },

    // ── Identity ──────────────────────────────────────────────────────────────
    name:         { type: String, trim: true, required: [true, 'Name is required'] },
    email:        { type: String, trim: true, lowercase: true },
    phone:        { type: String, trim: true },
    profileImage: { type: String, default: null },

    // ── Expertise ─────────────────────────────────────────────────────────────
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    qualification: { type: String, trim: true },
    experience:    { type: Number, min: 0, default: 0 },
    bio: {
      type: String,
      trim: true,
      maxlength: [2000, 'Bio must not exceed 2000 characters'],
    },

    // ── Credentials ───────────────────────────────────────────────────────────
    credentials: [CredentialSchema],

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

    // ── Verification — CRITICAL: unverified experts cannot accept consultations
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
ExpertSchema.index({ specialization: 1 });
ExpertSchema.index({ verificationStatus: 1 });
ExpertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Expert', ExpertSchema);
