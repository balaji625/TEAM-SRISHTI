/**
 * Appointment model — CarePath AI
 *
 * Tracks a single scheduled or requested appointment between a User and
 * a Professional, Expert, and/or Hospital.
 */

const mongoose = require('mongoose');
const { APPOINTMENT_STATUS, CONSULTATION_MODES } = require('../utils/constants');

const AppointmentSchema = new mongoose.Schema(
  {
    // ── Participants ──────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Appointment must belong to a user'],
    },
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

    // ── Scheduling ────────────────────────────────────────────────────────────
    date: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    time: {
      type: String,
      trim: true,
      required: [true, 'Appointment time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format'],
    },

    // ── Details ───────────────────────────────────────────────────────────────
    reason: {
      type: String,
      trim: true,
      required: [true, 'Reason for appointment is required'],
      maxlength: [500, 'Reason must not exceed 500 characters'],
    },
    consultationType: {
      type: String,
      enum: {
        values: Object.values(CONSULTATION_MODES),
        message: 'Invalid consultation type: {VALUE}',
      },
      default: CONSULTATION_MODES.IN_PERSON,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes must not exceed 2000 characters'],
      default: null,
    },

    // ── Status lifecycle ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: Object.values(APPOINTMENT_STATUS),
        message: 'Invalid appointment status: {VALUE}',
      },
      default: APPOINTMENT_STATUS.PENDING,
    },

    // ── Status change history (audit trail) ───────────────────────────────────
    statusHistory: [
      {
        status:    { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note:      { type: String, trim: true },
        _id: false,
      },
    ],

    // ── Cancellation/rejection ────────────────────────────────────────────────
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
AppointmentSchema.index({ userId: 1 });
AppointmentSchema.index({ hospitalId: 1 });
AppointmentSchema.index({ professionalId: 1 });
AppointmentSchema.index({ expertId: 1 });
AppointmentSchema.index({ date: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ userId: 1, status: 1 });          // common user dashboard query
AppointmentSchema.index({ professionalId: 1, date: 1 });    // professional schedule query
AppointmentSchema.index({ createdAt: -1 });

// ── Double-booking prevention: sparse partial unique indexes ──────────────────
// Prevents two ACTIVE (PENDING/CONFIRMED) appointments for the same slot.
// Uses separate indexes because professionalId/expertId can be null.
AppointmentSchema.index(
  { professionalId: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      professionalId: { $ne: null },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    },
    name: 'professional_slot_unique',
  }
);
AppointmentSchema.index(
  { expertId: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      expertId: { $ne: null },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    },
    name: 'expert_slot_unique',
  }
);

// ── Validation: at least one provider must be specified ───────────────────────
AppointmentSchema.pre('validate', function (next) {
  if (!this.professionalId && !this.expertId && !this.hospitalId) {
    this.invalidate(
      'professionalId',
      'At least one of hospitalId, professionalId, or expertId is required'
    );
  }
  next();
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
