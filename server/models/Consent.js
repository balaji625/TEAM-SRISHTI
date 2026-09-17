/**
 * Consent model — CarePath AI
 *
 * Records a user's explicit consent decisions over time.
 * Each document is an immutable consent snapshot — revisions create new documents.
 * This allows full consent history/versioning.
 *
 * The User model has a `consent` sub-document for quick reads;
 * this model is the authoritative audit trail.
 *
 * IMPORTANT: Do NOT silently assume consent. Check this model before
 * storing or exposing sensitive health data.
 */

const mongoose = require('mongoose');

const ConsentSchema = new mongoose.Schema(
  {
    // ── Owner ──────────────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Consent must belong to a user'],
    },

    // ── Consent flags ─────────────────────────────────────────────────────────
    // Each flag must be explicitly set — no defaults that silently grant consent.
    healthDataStorage: {
      type: Boolean,
      required: [true, 'healthDataStorage consent must be explicitly set'],
    },
    reportAnalysis: {
      type: Boolean,
      required: [true, 'reportAnalysis consent must be explicitly set'],
    },
    personalization: {
      type: Boolean,
      required: [true, 'personalization consent must be explicitly set'],
    },
    expertSharing: {
      type: Boolean,
      required: [true, 'expertSharing consent must be explicitly set'],
    },
    hospitalSharing: {
      type: Boolean,
      required: [true, 'hospitalSharing consent must be explicitly set'],
    },
    notifications: {
      type: Boolean,
      required: [true, 'notifications consent must be explicitly set'],
    },

    // ── Versioning ────────────────────────────────────────────────────────────
    // Increment version whenever the user changes any consent flag.
    // Allows auditing what the consent was at any point in time.
    version: {
      type: Number,
      default: 1,
      min: [1, 'Version must be at least 1'],
    },

    // ── Timestamp of this particular consent record ───────────────────────────
    // Use `timestamp` (singular) per spec; createdAt also set via timestamps.
    timestamp: {
      type: Date,
      default: Date.now,
    },

    // ── Source of the consent change ──────────────────────────────────────────
    source: {
      type: String,
      enum: ['USER', 'ADMIN', 'SYSTEM'],
      default: 'USER',
    },

    // ── Optional note (e.g. "Revoked AI analysis consent during privacy review") ─
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note must not exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true,   // createdAt is when this version was recorded
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
ConsentSchema.index({ userId: 1 });
ConsentSchema.index({ userId: 1, createdAt: -1 });   // latest consent for a user
ConsentSchema.index({ version: 1 });

// ── Static: get the latest consent record for a user ─────────────────────────
ConsentSchema.statics.latestForUser = function (userId) {
  return this.findOne({ userId }).sort({ version: -1, createdAt: -1 });
};

module.exports = mongoose.model('Consent', ConsentSchema);
