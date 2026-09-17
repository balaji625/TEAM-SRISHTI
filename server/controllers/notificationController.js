/**
 * notificationController — CarePath AI
 *
 * Serves in-app notifications for the authenticated user.
 *
 * GET  /api/user/notifications          — list notifications (newest first)
 * PUT  /api/user/notifications/:id/read — mark one as read
 * PUT  /api/user/notifications/read-all — mark all as read
 * GET  /api/user/notifications/count    — unread count
 *
 * HOSPITAL equivalent:
 * GET  /api/hospital/notifications
 * PUT  /api/hospital/notifications/:id/read
 * PUT  /api/hospital/notifications/read-all
 */

'use strict';

const { Notification } = require('../models');
const { success } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');

// ── List notifications ────────────────────────────────────────────────────────
const listNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, unreadOnly } = req.query;
    const filter = { userId: req.user.sub };
    if (unreadOnly === 'true') filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countUnread(req.user.sub);

    return success(res, { notifications, total, unreadCount, page: Number(page) }, 'Notifications retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Unread count only ────────────────────────────────────────────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countUnread(req.user.sub);
    return success(res, { count }, 'Unread count retrieved');
  } catch (err) {
    next(err);
  }
};

// ── Mark one as read ─────────────────────────────────────────────────────────
const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.sub },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );
    if (!notification) return next(new AppError('Notification not found', 404));
    return success(res, { notification }, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

// ── Mark all as read ─────────────────────────────────────────────────────────
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.sub, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    return success(res, {}, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = { listNotifications, getUnreadCount, markRead, markAllRead };
