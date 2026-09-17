/**
 * HealthRecord model — CarePath AI
 *
 * Stores structured health record entries (vitals, labs, symptoms, history).
 * Distinct from HealthReport: a HealthReport is an uploaded document;
 * a HealthRecord is a structured data entry.
 *
 * SENSITIVE: Only the owning user and authorized providers may access these.
 */

const mongoose = require('mongoose');
const { HEALTH_RECORD_TYPES, VISIBILITY } = require('../utils/constants');

// ── Sub-schema: a key-value pair for structured values ────────────────────────
const ValueSchema = new mongoose.Schema(
  {
    key:   { type: String, trim: true, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    unit:  { type: String, trim: true, default: null },
  },
  { _id: false }
);

const HealthRecordSchema = new mongoose.Schema(
  {
    // ── Owner ──────────────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Health record must belong to a user'],
    },

    // ── Record classification ─────────────────────────────────────────────────
    recordType: {
      type: String,
      enum: {
        values: Object.values(HEALTH_RECORD_TYPES),
        message: 'Invalid record type: {VALUE}',
      },
      required: [true, 'Record type is required'],
    },

    // ── Content ───────────────────────────────────────────────────────────────
    title: {
      type: String,
      trim: true,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description must not exceed 5000 characters'],
      default: null,
    },

    // Structured values (e.g. [{ key: 'blood_pressure', value: '120/80', unit: 'mmHg' }])
    values: [ValueSchema],

    // ── Source ────────────────────────────────────────────────────────────────
    source: {
      type: String,
      trim: true,
      default: null,   // e.g. hospital name, lab name, "self-reported"
    },
    date: {
      type: Date,
      default: Date.now,
    },

    // ── Access control ────────────────────────────────────────────────────────
    visibility: {
      type: String,
      enum: {
        values: Object.values(VISIBILITY),
        message: 'Invalid visibility: {VALUE}',
      },
      default: VISIBILITY.PRIVATE,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
HealthRecordSchema.index({ userId: 1 });
HealthRecordSchema.index({ userId: 1, recordType: 1 });
HealthRecordSchema.index({ userId: 1, date: -1 });
HealthRecordSchema.index({ recordType: 1 });
HealthRecordSchema.index({ createdAt: -1 });

module.exports = mongoose.model('HealthRecord', HealthRecordSchema);
