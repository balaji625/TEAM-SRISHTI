/**
 * Server-wide constants — CarePath AI
 * Single source of truth for every enum used by Mongoose models,
 * middleware, controllers, and services.
 */

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
  USER:         'USER',
  HOSPITAL:     'HOSPITAL',
  PROFESSIONAL: 'PROFESSIONAL',
  EXPERT:       'EXPERT',
  ADMIN:        'ADMIN',
});

// ── Verification statuses (Hospitals, Professionals, Experts) ─────────────────
const VERIFICATION_STATUS = Object.freeze({
  PENDING:   'PENDING',
  VERIFIED:  'VERIFIED',
  REJECTED:  'REJECTED',
  SUSPENDED: 'SUSPENDED',
});

// ── Appointment statuses ──────────────────────────────────────────────────────
const APPOINTMENT_STATUS = Object.freeze({
  PENDING:     'PENDING',
  CONFIRMED:   'CONFIRMED',
  REJECTED:    'REJECTED',
  CANCELLED:   'CANCELLED',
  COMPLETED:   'COMPLETED',
  RESCHEDULED: 'RESCHEDULED',
});

// ── Request types ─────────────────────────────────────────────────────────────
const REQUEST_TYPES = Object.freeze({
  APPOINTMENT:           'APPOINTMENT',
  EXPERT_ESCALATION:     'EXPERT_ESCALATION',
  HOSPITAL_REQUEST:      'HOSPITAL_REQUEST',
  PROFESSIONAL_REQUEST:  'PROFESSIONAL_REQUEST',
  EMERGENCY:             'EMERGENCY',
  GENERAL:               'GENERAL',
});

// ── Request / association statuses ───────────────────────────────────────────
const REQUEST_STATUS = Object.freeze({
  PENDING:   'PENDING',
  APPROVED:  'APPROVED',
  REJECTED:  'REJECTED',
  CANCELLED: 'CANCELLED',
  RESOLVED:  'RESOLVED',
});

// ── Priority levels ───────────────────────────────────────────────────────────
const PRIORITY = Object.freeze({
  LOW:      'LOW',
  NORMAL:   'NORMAL',
  HIGH:     'HIGH',
  URGENT:   'URGENT',
  CRITICAL: 'CRITICAL',
});

// ── Consultation / appointment modes ─────────────────────────────────────────
const CONSULTATION_MODES = Object.freeze({
  IN_PERSON:  'IN_PERSON',
  VIDEO:      'VIDEO',
  PHONE:      'PHONE',
  CHAT:       'CHAT',
});

// ── Notification types ────────────────────────────────────────────────────────
const NOTIFICATION_TYPES = Object.freeze({
  APPOINTMENT_REQUEST:    'APPOINTMENT_REQUEST',
  APPOINTMENT_CONFIRMED:  'APPOINTMENT_CONFIRMED',
  APPOINTMENT_REJECTED:   'APPOINTMENT_REJECTED',
  APPOINTMENT_CANCELLED:  'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED:  'APPOINTMENT_COMPLETED',
  ASSOCIATION_REQUEST:    'ASSOCIATION_REQUEST',
  ASSOCIATION_APPROVED:   'ASSOCIATION_APPROVED',
  ASSOCIATION_REJECTED:   'ASSOCIATION_REJECTED',
  VERIFICATION_APPROVED:  'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED:  'VERIFICATION_REJECTED',
  EXPERT_ESCALATION:      'EXPERT_ESCALATION',
  HEALTH_REPORT_READY:    'HEALTH_REPORT_READY',
  CONSENT_UPDATED:        'CONSENT_UPDATED',
  SYSTEM:                 'SYSTEM',
  EMERGENCY:              'EMERGENCY',
});

// ── Consent types (legacy — kept for backwards compat) ────────────────────────
const CONSENT_TYPES = Object.freeze({
  HEALTH_DATA_STORAGE: 'HEALTH_DATA_STORAGE',
  AI_ANALYSIS:         'AI_ANALYSIS',
  DATA_SHARING:        'DATA_SHARING',
  MARKETING:           'MARKETING',
});

// ── Health record types ───────────────────────────────────────────────────────
const HEALTH_RECORD_TYPES = Object.freeze({
  LAB_REPORT:              'LAB_REPORT',
  MEDICAL_HISTORY:         'MEDICAL_HISTORY',
  SYMPTOM:                 'SYMPTOM',
  VITAL:                   'VITAL',
  DIAGNOSIS_REFERENCE:     'DIAGNOSIS_REFERENCE',
  PRESCRIPTION_REFERENCE:  'PRESCRIPTION_REFERENCE',
  OTHER:                   'OTHER',
});

// ── Health report file types ──────────────────────────────────────────────────
const REPORT_FILE_TYPES = Object.freeze({
  PDF:  'PDF',
  JPG:  'JPG',
  JPEG: 'JPEG',
  PNG:  'PNG',
  DOCX: 'DOCX',
  TXT:  'TXT',
});

// ── Health record visibility ──────────────────────────────────────────────────
const VISIBILITY = Object.freeze({
  PRIVATE:         'PRIVATE',          // only the owner
  SHARED_HOSPITAL: 'SHARED_HOSPITAL',  // owner + their hospital
  SHARED_EXPERT:   'SHARED_EXPERT',    // owner + assigned expert
  PUBLIC:          'PUBLIC',           // (rare; for anonymised data)
});

// ── Audit actions ─────────────────────────────────────────────────────────────
const AUDIT_ACTIONS = Object.freeze({
  // Auth
  LOGIN:              'LOGIN',
  LOGOUT:             'LOGOUT',
  REGISTER:           'REGISTER',
  PASSWORD_RESET:     'PASSWORD_RESET',
  // Health data
  REPORT_UPLOAD:      'REPORT_UPLOAD',
  REPORT_VIEW:        'REPORT_VIEW',
  REPORT_DOWNLOAD:    'REPORT_DOWNLOAD',
  REPORT_DELETE:      'REPORT_DELETE',
  RECORD_ACCESS:      'RECORD_ACCESS',
  RECORD_CREATE:      'RECORD_CREATE',
  RECORD_UPDATE:      'RECORD_UPDATE',
  RECORD_DELETE:      'RECORD_DELETE',
  // Consent
  CONSENT_GRANT:      'CONSENT_GRANT',
  CONSENT_REVOKE:     'CONSENT_REVOKE',
  CONSENT_UPDATE:     'CONSENT_UPDATE',
  // Admin
  HOSPITAL_VERIFY:    'HOSPITAL_VERIFY',
  HOSPITAL_REJECT:    'HOSPITAL_REJECT',
  HOSPITAL_SUSPEND:   'HOSPITAL_SUSPEND',
  PROFESSIONAL_VERIFY:'PROFESSIONAL_VERIFY',
  PROFESSIONAL_REJECT:'PROFESSIONAL_REJECT',
  EXPERT_VERIFY:      'EXPERT_VERIFY',
  EXPERT_REJECT:      'EXPERT_REJECT',
  USER_SUSPEND:       'USER_SUSPEND',
  USER_ACTIVATE:      'USER_ACTIVATE',
  USER_DELETE:        'USER_DELETE',
  // Appointments
  APPOINTMENT_CREATE: 'APPOINTMENT_CREATE',
  APPOINTMENT_UPDATE: 'APPOINTMENT_UPDATE',
  APPOINTMENT_CANCEL: 'APPOINTMENT_CANCEL',
  // Association
  ASSOCIATION_REQUEST:'ASSOCIATION_REQUEST',
  ASSOCIATION_APPROVE:'ASSOCIATION_APPROVE',
  ASSOCIATION_REJECT: 'ASSOCIATION_REJECT',
  // System
  SYSTEM_EVENT:       'SYSTEM_EVENT',
});

// ── Audit resources ───────────────────────────────────────────────────────────
const AUDIT_RESOURCES = Object.freeze({
  USER:         'USER',
  HOSPITAL:     'HOSPITAL',
  PROFESSIONAL: 'PROFESSIONAL',
  EXPERT:       'EXPERT',
  APPOINTMENT:  'APPOINTMENT',
  REQUEST:      'REQUEST',
  HEALTH_REPORT:'HEALTH_REPORT',
  HEALTH_RECORD:'HEALTH_RECORD',
  CONSENT:      'CONSENT',
  NOTIFICATION: 'NOTIFICATION',
  AUDIT_LOG:    'AUDIT_LOG',
  SYSTEM:       'SYSTEM',
});

module.exports = {
  ROLES,
  VERIFICATION_STATUS,
  APPOINTMENT_STATUS,
  REQUEST_TYPES,
  REQUEST_STATUS,
  PRIORITY,
  CONSULTATION_MODES,
  NOTIFICATION_TYPES,
  CONSENT_TYPES,
  HEALTH_RECORD_TYPES,
  REPORT_FILE_TYPES,
  VISIBILITY,
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
};
