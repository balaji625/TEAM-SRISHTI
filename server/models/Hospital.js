/**
 * Hospital model — CarePath AI
 *
 * Represents a verified (or pending) healthcare institution.
 * Hospital ownership and user association are handled in later stages.
 */

const mongoose = require('mongoose');
const { VERIFICATION_STATUS } = require('../utils/constants');

// ── Sub-schema: geo-coordinates ───────────────────────────────────────────────
const LocationSchema = new mongoose.Schema(
  {
    latitude:  { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

// ── Sub-schema: address ───────────────────────────────────────────────────────
const AddressSchema = new mongoose.Schema(
  {
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    country: { type: String, trim: true },
    zip:     { type: String, trim: true },
  },
  { _id: false }
);

// ── Main Hospital schema ──────────────────────────────────────────────────────
const HospitalSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      minlength: [2, 'Hospital name must be at least 2 characters'],
      maxlength: [200, 'Hospital name must not exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },
    email: {
      type: String,
      required: [true, 'Hospital email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },

    // ── Address ───────────────────────────────────────────────────────────────
    address: {
      type: AddressSchema,
      default: () => ({}),
    },

    // ── Top-level city/state/country for indexing & filtering ─────────────────
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },

    // ── Geo-coordinates ───────────────────────────────────────────────────────
    location: {
      type: LocationSchema,
      default: () => ({}),
    },

    // ── Capabilities ──────────────────────────────────────────────────────────
    specialties: [{ type: String, trim: true }],
    services:    [{ type: String, trim: true }],
    facilities:  [{ type: String, trim: true }],

    emergencyAvailable: {
      type: Boolean,
      default: false,
    },

    // ── Ownership (linked to the User account that registered the hospital) ────
    // Full association logic is wired in Stage 7
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Verification ──────────────────────────────────────────────────────────
    verificationStatus: {
      type: String,
      enum: {
        values: Object.values(VERIFICATION_STATUS),
        message: 'Invalid verification status: {VALUE}',
      },
      default: VERIFICATION_STATUS.PENDING,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',   // ADMIN user who verified
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Status ────────────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
HospitalSchema.index({ name: 1 });
HospitalSchema.index({ city: 1 });
HospitalSchema.index({ state: 1 });
HospitalSchema.index({ country: 1 });
HospitalSchema.index({ verificationStatus: 1 });
HospitalSchema.index({ specialties: 1 });
HospitalSchema.index({ emergencyAvailable: 1 });
HospitalSchema.index({ createdBy: 1 });
HospitalSchema.index({ createdAt: -1 });
// 2dsphere index for future geo-queries
HospitalSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

module.exports = mongoose.model('Hospital', HospitalSchema);
