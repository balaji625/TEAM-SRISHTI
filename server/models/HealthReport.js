/**
 * HealthReport model — CarePath AI
 *
 * Stores metadata and AI analysis for an uploaded health document.
 * SENSITIVE: A user must NEVER be able to access another user's report.
 * Authorization is enforced in Stage 11 route middleware.
 *
 * Actual files are stored on disk/cloud, NOT in MongoDB.
 * This model stores only paths/URLs and extracted text.
 */

const mongoose = require('mongoose');
const { REPORT_FILE_TYPES } = require('../utils/constants');

// ── Sub-schema: individual extracted value (e.g. blood glucose: 5.4 mmol/L) ──
const ExtractedValueSchema = new mongoose.Schema(
  {
    name:      { type: String, trim: true },
    value:     { type: mongoose.Schema.Types.Mixed },  // string or number
    unit:      { type: String, trim: true },
    normalMin: { type: Number, default: null },
    normalMax: { type: Number, default: null },
    flag:      { type: String, enum: ['NORMAL', 'LOW', 'HIGH', 'CRITICAL', null], default: null },
  },
  { _id: false }
);

const HealthReportSchema = new mongoose.Schema(
  {
    // ── Owner — index is critical; used to authorize every report query ────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report must belong to a user'],
    },

    // ── File metadata ─────────────────────────────────────────────────────────
    fileName: {
      type: String,
      trim: true,
      required: [true, 'File name is required'],
    },
    fileUrl: {
      type: String,
      trim: true,
      required: [true, 'File URL/path is required'],
    },
    fileType: {
      type: String,
      enum: {
        values: Object.values(REPORT_FILE_TYPES),
        message: 'Invalid file type: {VALUE}',
      },
      default: REPORT_FILE_TYPES.PDF,
    },
    fileSize: {
      type: Number,  // bytes
      default: null,
    },

    // ── OCR / extracted text ──────────────────────────────────────────────────
    ocrText: {
      type: String,
      default: null,
      // Not indexed — full-text search added when needed
    },

    // ── AI analysis (Stage 12) ────────────────────────────────────────────────
    summary: {
      type: String,
      trim: true,
      default: null,
    },
    extractedValues: [ExtractedValueSchema],
    analysis: {
      plainLanguageSummary: { type: String, default: null },
      flaggedItems:         [{ type: String }],
      disclaimer:           { type: String, default: 'This is an AI-generated explanation, not a medical diagnosis.' },
      generatedAt:          { type: Date, default: null },
    },

    // ── Consent ───────────────────────────────────────────────────────────────
    // Report analysis is ONLY stored when user has given explicit consent
    consentGiven: {
      type: Boolean,
      required: [true, 'Consent status is required'],
      default: false,
    },

    // ── Access audit (who viewed this report, when) ───────────────────────────
    accessLog: [
      {
        accessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        accessedAt: { type: Date, default: Date.now },
        action:     { type: String, enum: ['VIEW', 'DOWNLOAD', 'SHARE'], default: 'VIEW' },
        _id: false,
      },
    ],
  },
  {
    timestamps: true,   // createdAt is the upload timestamp
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// userId is the primary authorization gate — must be fast
HealthReportSchema.index({ userId: 1 });
HealthReportSchema.index({ userId: 1, createdAt: -1 });   // user's report list, newest first
HealthReportSchema.index({ consentGiven: 1 });
HealthReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('HealthReport', HealthReportSchema);
