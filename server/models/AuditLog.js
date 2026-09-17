/**
 * AuditLog model — CarePath AI
 *
 * Immutable record of every sensitive action in the platform.
 * Audit logs are NEVER deleted. They are the security and compliance trail.
 *
 * Written by:
 *   - authService (login, logout, register)
 *   - reportController (upload, view, download)
 *   - consentService (consent change)
 *   - adminController (verification, user management)
 *   - appointmentController (status changes)
 *   - healthRecordController (access)
 */

const mongoose = require('mongoose');
const { ROLES, AUDIT_ACTIONS, AUDIT_RESOURCES } = require('../utils/constants');

const AuditLogSchema = new mongoose.Schema(
  {
    // ── Actor ─────────────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,   // null for system-initiated actions
    },
    role: {
      type: String,
      enum: {
        values: [...Object.values(ROLES), 'SYSTEM', 'ANONYMOUS'],
        message: 'Invalid role in audit log: {VALUE}',
      },
      default: 'ANONYMOUS',
    },

    // ── Action ────────────────────────────────────────────────────────────────
    action: {
      type: String,
      enum: {
        values: Object.values(AUDIT_ACTIONS),
        message: 'Invalid audit action: {VALUE}',
      },
      required: [true, 'Audit action is required'],
    },

    // ── Resource ──────────────────────────────────────────────────────────────
    resource: {
      type: String,
      enum: {
        values: Object.values(AUDIT_RESOURCES),
        message: 'Invalid audit resource: {VALUE}',
      },
      required: [true, 'Audit resource is required'],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,   // the ID of the affected document
    },

    // ── Context ───────────────────────────────────────────────────────────────
    ipAddress: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Outcome ───────────────────────────────────────────────────────────────
    outcome: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'BLOCKED'],
      default: 'SUCCESS',
    },

    // ── Arbitrary metadata ────────────────────────────────────────────────────
    // Keep sensitive values OUT of here. This is for non-secret context
    // (e.g. { previousStatus: 'PENDING', newStatus: 'VERIFIED' }).
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ── Timestamp ─────────────────────────────────────────────────────────────
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,  // audit timestamps must not be modified
    },
  },
  {
    // No updatedAt — audit logs are immutable
    timestamps: { createdAt: 'timestamp', updatedAt: false },
    versionKey: false,
  }
);

// ── Indexes — optimised for the admin audit log queries ───────────────────────
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ role: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ resource: 1 });
AuditLogSchema.index({ resourceId: 1 });
AuditLogSchema.index({ timestamp: -1 });                        // latest-first default sort
AuditLogSchema.index({ userId: 1, timestamp: -1 });             // user activity history
AuditLogSchema.index({ resource: 1, resourceId: 1 });           // "who touched this record?"
AuditLogSchema.index({ action: 1, timestamp: -1 });             // action frequency over time
AuditLogSchema.index({ outcome: 1, timestamp: -1 });            // failure/blocked monitoring

// ── Prevent accidental deletion ───────────────────────────────────────────────
// Mongoose does not enforce this natively, but we document the intent.
// In production, the DB user account should have no DELETE privilege on this collection.
AuditLogSchema.set('strict', true);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
