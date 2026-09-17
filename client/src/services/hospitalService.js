/**
 * hospitalService — CarePath AI
 * API calls for the HOSPITAL role endpoints.
 */

import api from './api';

/** Fetch the authenticated hospital's profile (null if not yet created) */
export const fetchHospitalProfile = () =>
  api.get('/hospital/profile').then((r) => r.data);

/** Create or update the hospital profile */
export const upsertHospitalProfile = (data) =>
  api.put('/hospital/profile', data).then((r) => r.data);

/** List associated doctors (professionals) */
export const fetchDoctors = (status = 'APPROVED') =>
  api.get('/hospital/doctors', { params: { status } }).then((r) => r.data);

// ── Appointments ──────────────────────────────────────────────────────────────
export const fetchHospitalAppointments = (params = {}) =>
  api.get('/hospital/appointments', { params }).then((r) => r.data);

export const updateAppointmentStatus = (id, status, note) =>
  api.put(`/hospital/appointments/${id}/status`, { status, note }).then((r) => r.data);

// ── Notifications ─────────────────────────────────────────────────────────────
export const fetchHospitalNotifications = (params = {}) =>
  api.get('/hospital/notifications', { params }).then((r) => r.data);

export const fetchHospitalUnreadCount = () =>
  api.get('/hospital/notifications/count').then((r) => r.data);

export const markHospitalNotificationRead = (id) =>
  api.put(`/hospital/notifications/${id}/read`).then((r) => r.data);

export const markAllHospitalNotificationsRead = () =>
  api.put('/hospital/notifications/read-all').then((r) => r.data);

// ── Requests ──────────────────────────────────────────────────────────────────
export const fetchHospitalRequests = (params = {}) =>
  api.get('/hospital/requests', { params }).then((r) => r.data);

export const respondToRequest = (id, status, message) =>
  api.put(`/hospital/requests/${id}/respond`, { status, message }).then((r) => r.data);

// ── Analytics ─────────────────────────────────────────────────────────────────
export const fetchHospitalAnalytics = () =>
  api.get('/hospital/analytics').then((r) => r.data);

// ── Associations ──────────────────────────────────────────────────────────────
export const fetchAssociations = (params = {}) =>
  api.get('/hospital/associations', { params }).then((r) => r.data);

export const approveAssociation = (assocId) =>
  api.put(`/hospital/associations/${assocId}/approve`).then((r) => r.data);

export const rejectAssociation = (assocId) =>
  api.put(`/hospital/associations/${assocId}/reject`).then((r) => r.data);

// ── Referrals ──────────────────────────────────────────────────────────────────
export const fetchHospitalReferrals = (params = {}) =>
  api.get('/hospital/referrals', { params }).then((r) => r.data);

export const fetchHospitalReferral = (id) =>
  api.get(`/hospital/referrals/${id}`).then((r) => r.data);

export const updateHospitalReferralStatus = (id, status, note, nextAction) =>
  api.put(`/hospital/referrals/${id}/status`, { status, note, nextAction }).then((r) => r.data);

export const assignProfessionalToReferral = (id, professionalId, note) =>
  api.put(`/hospital/referrals/${id}/assign`, { professionalId, note }).then((r) => r.data);
