/**
 * User model — CarePath AI
 *
 * Represents every authenticated account across all roles.
 * Password is excluded from default queries via `select: false`.
 * Password hashing is handled in Stage 4 (authService), not here.
 */

const mongoose = require('mongoose');

const { ROLES } = require('../utils/constants');

// ── Sub-schema: consent preferences (inline on User) ──────────────────────────
const ConsentPrefsSchema = new mongoose.Schema(
  {
    healthDataStorage: { type: Boolean, default: false },
    reportAnalysis:    { type: Boolean, default: false },
    personalization:   { type: Boolean, default: false },
    expertSharing:     { type: Boolean, default: false },
    hospitalSharing:   { type: Boolean, default: false },
    notifications:     { type: Boolean, default: true },
  },
  { _id: false }
);

// ── Sub-schema: basic health profile snapshot ─────────────────────────────────
const HealthProfileSchema = new mongoose.Schema(
  {
    bloodType:       { type: String, trim: true },
    allergies:       [{ type: String, trim: true }],
    chronicConditions: [{ type: String, trim: true }],
    currentMedications: [{ type: String, trim: true }],
    emergencyContact: {
      name:         { type: String, trim: true },
      phone:        { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
  },
  { _id: false }
);

// ── Sub-schema: location ──────────────────────────────────────────────────────
const LocationSchema = new mongoose.Schema(
  {
    city:      { type: String, trim: true },
    state:     { type: String, trim: true },
    country:   { type: String, trim: true },
    latitude:  { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

// ── Main User schema ──────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+\d\s\-().]{7,20}$/, 'Please provide a valid phone number'],
    },

    // ── Auth ──────────────────────────────────────────────────────────────────
    // select: false ensures password is NEVER returned in normal queries.
    // Hashing is performed in Stage 4 (authService), not in this model.
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    // ── Role ──────────────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: 'Invalid role: {VALUE}',
      },
      default: ROLES.USER,
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    profileImage: {
      type: String,
      trim: true,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY', 'OTHER'],
      default: null,
    },
    language: {
      type: String,
      trim: true,
      default: 'en',
    },
    location: {
      type: LocationSchema,
      default: () => ({}),
    },

    // ── Consent preferences (summary — full history in Consent model) ─────────
    consent: {
      type: ConsentPrefsSchema,
      default: () => ({}),
    },

    // ── Health profile snapshot ───────────────────────────────────────────────
    healthProfile: {
      type: HealthProfileSchema,
      default: () => ({}),
    },

    // ── Account status ────────────────────────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },

    // ── Password reset (tokens added Stage 4) ────────────────────────────────
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// NOTE: email is NOT listed here — unique:true on the field already creates the index.
UserSchema.index({ role: 1 });
UserSchema.index({ isVerified: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
// Useful for display; does not persist to DB
UserSchema.virtual('displayName').get(function () {
  return this.name || this.email;
});

// ── Static helpers ────────────────────────────────────────────────────────────
// Convenience used by authService in Stage 4
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

UserSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+password');
};

module.exports = mongoose.model('User', UserSchema);
