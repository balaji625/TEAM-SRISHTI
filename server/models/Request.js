/**
 * Request model — CarePath AI
 *
 * Represents a user-initiated request that requires action from another party.
 * Covers: appointment requests, expert escalations, emergency, hospital/professional enquiries.
 */

const mongoose = require('mongoose');
const { REQUEST_TYPES, REQUEST_STATUS, PRIORITY } = require('../utils/constants');

const RequestSchema = new mongoose.Schema(
  {
    // ── Origin ────────────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Request must belong to a user'],
    },

    // ── Type ──────────────────────────────────────────────────────────────────
    requestType: {
      type: String,
      enum: {
        values: Object.values(REQUEST_TYPES),
        message: 'Invalid request type: {VALUE}',
      },
      required: [true, 'Request type is required'],
    },

    // ── Target entities (one or more may apply) ───────────────────────────────
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional',
      default: null,
    },
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expert',
      default: null,
    },

    // ── Content ───────────────────────────────────────────────────────────────
    description: {
      type: String,
      trim: true,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },

    // ── Priority ──────────────────────────────────────────────────────────────
    priority: {
      type: String,
      enum: {
        values: Object.values(PRIORITY),
        message: 'Invalid priority: {VALUE}',
      },
      default: PRIORITY.NORMAL,
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: Object.values(REQUEST_STATUS),
        message: 'Invalid status: {VALUE}',
      },
      default: REQUEST_STATUS.PENDING,
    },

    // ── Response from the receiving party ─────────────────────────────────────
    response: {
      message:    { type: String, trim: true, default: null },
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      respondedAt: { type: Date, default: null },
    },

    // ── Resolution ────────────────────────────────────────────────────────────
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
RequestSchema.index({ userId: 1 });
RequestSchema.index({ requestType: 1 });
RequestSchema.index({ status: 1 });
RequestSchema.index({ priority: 1 });
RequestSchema.index({ hospitalId: 1 });
RequestSchema.index({ professionalId: 1 });
RequestSchema.index({ expertId: 1 });
RequestSchema.index({ userId: 1, status: 1 });
RequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Request', RequestSchema);
