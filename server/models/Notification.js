/**
 * Notification model — CarePath AI
 *
 * Stores in-app notifications for every role.
 * Notifications are created by services (e.g. appointmentService, adminService)
 * and consumed by the frontend via the notifications API (Stage 15).
 */

const mongoose = require('mongoose');
const { NOTIFICATION_TYPES, PRIORITY } = require('../utils/constants');

const NotificationSchema = new mongoose.Schema(
  {
    // ── Recipient ─────────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
    },

    // ── Content ───────────────────────────────────────────────────────────────
    title: {
      type: String,
      trim: true,
      required: [true, 'Notification title is required'],
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    message: {
      type: String,
      trim: true,
      required: [true, 'Notification message is required'],
      maxlength: [1000, 'Message must not exceed 1000 characters'],
    },

    // ── Classification ────────────────────────────────────────────────────────
    type: {
      type: String,
      enum: {
        values: Object.values(NOTIFICATION_TYPES),
        message: 'Invalid notification type: {VALUE}',
      },
      required: [true, 'Notification type is required'],
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

    // ── Read state ────────────────────────────────────────────────────────────
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },

    // ── Related entity (deep-link from notification to the relevant object) ────
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['Appointment', 'Request', 'HealthReport', 'Hospital', 'Professional', 'Expert', 'User', null],
        default: null,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
  },
  {
    timestamps: true,   // createdAt = when the notification was sent
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ userId: 1, read: 1 });              // unread count query
NotificationSchema.index({ userId: 1, createdAt: -1 });        // notification list, newest first
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: -1 });

// ── Static: count unread for a user ──────────────────────────────────────────
NotificationSchema.statics.countUnread = function (userId) {
  return this.countDocuments({ userId, read: false });
};

module.exports = mongoose.model('Notification', NotificationSchema);
