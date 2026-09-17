/**
 * validate-models.js
 *
 * Verifies that all Mongoose models:
 *   1. Require without throwing
 *   2. Have the expected fields
 *   3. Have the expected indexes declared
 *   4. Enum values are correct
 *
 * Does NOT require a live MongoDB connection.
 * Run with: node validate-models.js
 */

'use strict';

// Suppress mongoose connection warnings — we don't connect here
process.env.NODE_ENV = 'test';

let passed = 0;
let failed = 0;

function ok(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓  ${name}`);
    passed++;
  } else {
    console.error(`  ✗  ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(50 - title.length)}`);
}

// ── Load models ───────────────────────────────────────────────────────────────
section('Loading models');

let models;
try {
  models = require('./models');
  ok('All models loaded via models/index.js', true);
} catch (err) {
  console.error('FATAL: Could not load models/index.js:', err.message);
  process.exit(1);
}

const {
  User, Hospital, Professional, Expert,
  Appointment, Request, HealthReport, HealthRecord,
  Consent, Notification, AuditLog,
} = models;

// ── Helper: check a model exists and has a schema ─────────────────────────────
function hasField(model, path) {
  return !!model.schema.path(path);
}

function hasIndex(model, key) {
  const indexes = model.schema.indexes();
  return indexes.some((idx) => idx[0] && idx[0][key] !== undefined);
}

// ── User ──────────────────────────────────────────────────────────────────────
section('User');
ok('Model exists',           !!User);
ok('name field',             hasField(User, 'name'));
ok('email field',            hasField(User, 'email'));
ok('password field (select:false)', User.schema.path('password').options.select === false);
ok('role field',             hasField(User, 'role'));
ok('role enum includes USER', User.schema.path('role').enumValues.includes('USER'));
ok('role enum includes ADMIN',User.schema.path('role').enumValues.includes('ADMIN'));
ok('isVerified field',       hasField(User, 'isVerified'));
ok('isActive field',         hasField(User, 'isActive'));
ok('healthProfile field',    hasField(User, 'healthProfile'));
ok('consent field',          hasField(User, 'consent'));
ok('email index',            hasIndex(User, 'email'));
ok('role index',             hasIndex(User, 'role'));
ok('findByEmail static',     typeof User.findByEmail === 'function');
ok('findByEmailWithPassword static', typeof User.findByEmailWithPassword === 'function');

// ── Hospital ──────────────────────────────────────────────────────────────────
section('Hospital');
ok('Model exists',             !!Hospital);
ok('name field',               hasField(Hospital, 'name'));
ok('email field',              hasField(Hospital, 'email'));
ok('city field',               hasField(Hospital, 'city'));
ok('state field',              hasField(Hospital, 'state'));
ok('country field',            hasField(Hospital, 'country'));
ok('specialties field',        hasField(Hospital, 'specialties'));
ok('services field',           hasField(Hospital, 'services'));
ok('facilities field',         hasField(Hospital, 'facilities'));
ok('emergencyAvailable field', hasField(Hospital, 'emergencyAvailable'));
ok('verificationStatus field', hasField(Hospital, 'verificationStatus'));
ok('verifiedBy field',         hasField(Hospital, 'verifiedBy'));
ok('verifiedAt field',         hasField(Hospital, 'verifiedAt'));
ok('PENDING in enum',          Hospital.schema.path('verificationStatus').enumValues.includes('PENDING'));
ok('VERIFIED in enum',         Hospital.schema.path('verificationStatus').enumValues.includes('VERIFIED'));
ok('SUSPENDED in enum',        Hospital.schema.path('verificationStatus').enumValues.includes('SUSPENDED'));
ok('name index',               hasIndex(Hospital, 'name'));
ok('city index',               hasIndex(Hospital, 'city'));
ok('verificationStatus index', hasIndex(Hospital, 'verificationStatus'));

// ── Professional ──────────────────────────────────────────────────────────────
section('Professional');
ok('Model exists',             !!Professional);
ok('userId field',             hasField(Professional, 'userId'));
ok('specialization field',     hasField(Professional, 'specialization'));
ok('licenseNumber field',      hasField(Professional, 'licenseNumber'));
ok('credentials field',        hasField(Professional, 'credentials'));
ok('hospitalAssociations field', hasField(Professional, 'hospitalAssociations'));
ok('availability field',       hasField(Professional, 'availability'));
ok('verificationStatus field', hasField(Professional, 'verificationStatus'));
ok('userId index',             hasIndex(Professional, 'userId'));
ok('specialization index',     hasIndex(Professional, 'specialization'));

// ── Expert ────────────────────────────────────────────────────────────────────
section('Expert');
ok('Model exists',             !!Expert);
ok('userId field',             hasField(Expert, 'userId'));
ok('specialization field',     hasField(Expert, 'specialization'));
ok('credentials field',        hasField(Expert, 'credentials'));
ok('availability field',       hasField(Expert, 'availability'));
ok('verificationStatus field', hasField(Expert, 'verificationStatus'));
ok('PENDING in enum',          Expert.schema.path('verificationStatus').enumValues.includes('PENDING'));
ok('VERIFIED in enum',         Expert.schema.path('verificationStatus').enumValues.includes('VERIFIED'));
ok('userId index',             hasIndex(Expert, 'userId'));
ok('verificationStatus index', hasIndex(Expert, 'verificationStatus'));

// ── Appointment ───────────────────────────────────────────────────────────────
section('Appointment');
ok('Model exists',          !!Appointment);
ok('userId field',          hasField(Appointment, 'userId'));
ok('hospitalId field',      hasField(Appointment, 'hospitalId'));
ok('professionalId field',  hasField(Appointment, 'professionalId'));
ok('expertId field',        hasField(Appointment, 'expertId'));
ok('date field',            hasField(Appointment, 'date'));
ok('time field',            hasField(Appointment, 'time'));
ok('reason field',          hasField(Appointment, 'reason'));
ok('consultationType field',hasField(Appointment, 'consultationType'));
ok('status field',          hasField(Appointment, 'status'));
ok('notes field',           hasField(Appointment, 'notes'));
ok('PENDING in enum',       Appointment.schema.path('status').enumValues.includes('PENDING'));
ok('CONFIRMED in enum',     Appointment.schema.path('status').enumValues.includes('CONFIRMED'));
ok('COMPLETED in enum',     Appointment.schema.path('status').enumValues.includes('COMPLETED'));
ok('userId index',          hasIndex(Appointment, 'userId'));
ok('date index',            hasIndex(Appointment, 'date'));
ok('status index',          hasIndex(Appointment, 'status'));

// ── Request ───────────────────────────────────────────────────────────────────
section('Request');
ok('Model exists',        !!Request);
ok('userId field',        hasField(Request, 'userId'));
ok('requestType field',   hasField(Request, 'requestType'));
ok('description field',   hasField(Request, 'description'));
ok('priority field',      hasField(Request, 'priority'));
ok('status field',        hasField(Request, 'status'));
ok('APPOINTMENT in type enum',       Request.schema.path('requestType').enumValues.includes('APPOINTMENT'));
ok('EXPERT_ESCALATION in type enum', Request.schema.path('requestType').enumValues.includes('EXPERT_ESCALATION'));
ok('EMERGENCY in type enum',         Request.schema.path('requestType').enumValues.includes('EMERGENCY'));
ok('userId index',        hasIndex(Request, 'userId'));
ok('requestType index',   hasIndex(Request, 'requestType'));
ok('status index',        hasIndex(Request, 'status'));

// ── HealthReport ──────────────────────────────────────────────────────────────
section('HealthReport');
ok('Model exists',       !!HealthReport);
ok('userId field',       hasField(HealthReport, 'userId'));
ok('fileName field',     hasField(HealthReport, 'fileName'));
ok('fileUrl field',      hasField(HealthReport, 'fileUrl'));
ok('fileType field',     hasField(HealthReport, 'fileType'));
ok('ocrText field',      hasField(HealthReport, 'ocrText'));
ok('summary field',      hasField(HealthReport, 'summary'));
ok('consentGiven field', hasField(HealthReport, 'consentGiven'));
ok('userId index',       hasIndex(HealthReport, 'userId'));

// ── HealthRecord ──────────────────────────────────────────────────────────────
section('HealthRecord');
ok('Model exists',      !!HealthRecord);
ok('userId field',      hasField(HealthRecord, 'userId'));
ok('recordType field',  hasField(HealthRecord, 'recordType'));
ok('title field',       hasField(HealthRecord, 'title'));
ok('description field', hasField(HealthRecord, 'description'));
ok('values field',      hasField(HealthRecord, 'values'));
ok('source field',      hasField(HealthRecord, 'source'));
ok('date field',        hasField(HealthRecord, 'date'));
ok('visibility field',  hasField(HealthRecord, 'visibility'));
ok('LAB_REPORT in enum',  HealthRecord.schema.path('recordType').enumValues.includes('LAB_REPORT'));
ok('VITAL in enum',       HealthRecord.schema.path('recordType').enumValues.includes('VITAL'));
ok('SYMPTOM in enum',     HealthRecord.schema.path('recordType').enumValues.includes('SYMPTOM'));
ok('PRIVATE in visibility enum', HealthRecord.schema.path('visibility').enumValues.includes('PRIVATE'));
ok('userId index',      hasIndex(HealthRecord, 'userId'));

// ── Consent ───────────────────────────────────────────────────────────────────
section('Consent');
ok('Model exists',           !!Consent);
ok('userId field',           hasField(Consent, 'userId'));
ok('healthDataStorage field',hasField(Consent, 'healthDataStorage'));
ok('reportAnalysis field',   hasField(Consent, 'reportAnalysis'));
ok('personalization field',  hasField(Consent, 'personalization'));
ok('expertSharing field',    hasField(Consent, 'expertSharing'));
ok('hospitalSharing field',  hasField(Consent, 'hospitalSharing'));
ok('notifications field',    hasField(Consent, 'notifications'));
ok('version field',          hasField(Consent, 'version'));
ok('timestamp field',        hasField(Consent, 'timestamp'));
ok('userId index',           hasIndex(Consent, 'userId'));
ok('latestForUser static',   typeof Consent.latestForUser === 'function');

// ── Notification ──────────────────────────────────────────────────────────────
section('Notification');
ok('Model exists',    !!Notification);
ok('userId field',    hasField(Notification, 'userId'));
ok('title field',     hasField(Notification, 'title'));
ok('message field',   hasField(Notification, 'message'));
ok('type field',      hasField(Notification, 'type'));
ok('read field',      hasField(Notification, 'read'));
ok('read default is false', Notification.schema.path('read').defaultValue === false);
ok('priority field',  hasField(Notification, 'priority'));
ok('SYSTEM in type enum', Notification.schema.path('type').enumValues.includes('SYSTEM'));
ok('EMERGENCY in type enum', Notification.schema.path('type').enumValues.includes('EMERGENCY'));
ok('userId index',    hasIndex(Notification, 'userId'));
ok('read index',      hasIndex(Notification, 'read'));
ok('countUnread static', typeof Notification.countUnread === 'function');

// ── AuditLog ──────────────────────────────────────────────────────────────────
section('AuditLog');
ok('Model exists',     !!AuditLog);
ok('userId field',     hasField(AuditLog, 'userId'));
ok('role field',       hasField(AuditLog, 'role'));
ok('action field',     hasField(AuditLog, 'action'));
ok('resource field',   hasField(AuditLog, 'resource'));
ok('resourceId field', hasField(AuditLog, 'resourceId'));
ok('ipAddress field',  hasField(AuditLog, 'ipAddress'));
ok('metadata field',   hasField(AuditLog, 'metadata'));
ok('timestamp field',  hasField(AuditLog, 'timestamp'));
ok('outcome field',    hasField(AuditLog, 'outcome'));
ok('LOGIN in actions enum',  AuditLog.schema.path('action').enumValues.includes('LOGIN'));
ok('CONSENT_GRANT in actions', AuditLog.schema.path('action').enumValues.includes('CONSENT_GRANT'));
ok('REPORT_UPLOAD in actions', AuditLog.schema.path('action').enumValues.includes('REPORT_UPLOAD'));
ok('HOSPITAL_VERIFY in actions', AuditLog.schema.path('action').enumValues.includes('HOSPITAL_VERIFY'));
ok('userId index',     hasIndex(AuditLog, 'userId'));
ok('action index',     hasIndex(AuditLog, 'action'));
ok('resource index',   hasIndex(AuditLog, 'resource'));
ok('timestamp index',  hasIndex(AuditLog, 'timestamp'));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(55)}`);
console.log(`  RESULT: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(55));

if (failed > 0) {
  console.error('\nSome model checks failed. See output above.');
  process.exit(1);
} else {
  console.log('\n  All model validations passed ✓');
  process.exit(0);
}
