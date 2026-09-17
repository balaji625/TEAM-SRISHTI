/**
 * Referral model — CarePath AI
 *
 * Tracks a patient referral from one facility/professional to another.
 * Supports the PHC → District Hospital → Specialist pathway common in rural India.
 */

'use strict';

const mongoose = require('mongoose');

const REFERRAL_STATUS = Object.freeze({
  CREATED:     'CREATED',
  ACCEPTED:    'ACCEPTED',
  SCHEDULED:   'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED:   'COMPLETED',
  REJECTED:    'REJECTED',
  CANCELLED:   'CANCELLED',
});

const REFERRAL_PRIORITY = Object.freeze({
  LOW:    'LOW',
  NORMAL: 'NORMAL',
  HIGH:   'HIGH',
  URGENT: 'URGENT',
});

const ReferralSchema = new mongoose.Schema(
  {
    // ── Patient ───────────────────────────────────────────────────────────────
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
    },

    // ── Source (who is referring) ─────────────────────────────────────────────
    sourceProfessionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional',
      default: null,
    },
    sourceHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    sourceName: {
      type: String,
      trim: true,
      default: null,  // e.g. "PHC Nellore" if not in system
    },

    // ── Destination (where referred to) ───────────────────────────────────────
    destinationProfessionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional',
      default: null,
    },
    destinationHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    destinationName: {
      type: String,
      trim: true,
      default: null,  // e.g. "District Hospital Vizag"
    },

    // ── Details ───────────────────────────────────────────────────────────────
    reason: {
      type: String,
      trim: true,
      required: [true, 'Referral reason is required'],
      maxlength: [1000, 'Reason must not exceed 1000 characters'],
    },
    category: {
      type: String,
      trim: true,
      default: null,  // e.g. "Cardiology", "Orthopedics"
    },
    priority: {
      type: String,
      enum: Object.values(REFERRAL_PRIORITY),
      default: REFERRAL_PRIORITY.NORMAL,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes must not exceed 2000 characters'],
      default: null,
    },

    // ── Linked appointment (if scheduled) ────────────────────────────────────
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },

    // ── Status lifecycle ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(REFERRAL_STATUS),
      default: REFERRAL_STATUS.CREATED,
    },
    statusHistory: [
      {
        status:    { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note:      { type: String, trim: true },
        _id: false,
      },
    ],

    // ── Next action hint ──────────────────────────────────────────────────────
    nextAction: {
      type: String,
      trim: true,
      default: null,  // e.g. "Attend appointment on 18 Sep, 10:30 AM"
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
ReferralSchema.index({ patientId: 1 });
ReferralSchema.index({ status: 1 });
ReferralSchema.index({ patientId: 1, status: 1 });
ReferralSchema.index({ sourceProfessionalId: 1 });
ReferralSchema.index({ sourceHospitalId: 1 });
ReferralSchema.index({ destinationProfessionalId: 1 });
ReferralSchema.index({ destinationHospitalId: 1 });
ReferralSchema.index({ createdAt: -1 });

// Validation: at least one source or destination must be specified
ReferralSchema.pre('validate', function (next) {
  const hasSource = this.sourceProfessionalId || this.sourceHospitalId || this.sourceName;
  const hasDest   = this.destinationProfessionalId || this.destinationHospitalId || this.destinationName;
  if (!hasDest) {
    this.invalidate('destinationName', 'At least one destination must be specified');
  }
  next();
});

module.exports = mongoose.model('Referral', ReferralSchema);
module.exports.REFERRAL_STATUS = REFERRAL_STATUS;
module.exports.REFERRAL_PRIORITY = REFERRAL_PRIORITY;
