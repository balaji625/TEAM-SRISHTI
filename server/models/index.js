/**
 * Models index — CarePath AI
 *
 * Central import point for all Mongoose models.
 * Import from here in controllers/services:
 *   const { User, Hospital, Appointment } = require('../models');
 *
 * Note: Models register themselves with Mongoose on first require().
 * Importing this file in server.js ensures all models are registered
 * before any queries run.
 */

const User         = require('./User');
const Hospital     = require('./Hospital');
const Professional = require('./Professional');
const Expert       = require('./Expert');
const Appointment  = require('./Appointment');
const Request      = require('./Request');
const HealthReport = require('./HealthReport');
const HealthRecord = require('./HealthRecord');
const Consent      = require('./Consent');
const Notification = require('./Notification');
const AuditLog     = require('./AuditLog');
const Referral     = require('./Referral');

module.exports = {
  User,
  Hospital,
  Professional,
  Expert,
  Appointment,
  Request,
  HealthReport,
  HealthRecord,
  Consent,
  Notification,
  AuditLog,
  Referral,
};
