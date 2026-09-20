/**
 * userService — CarePath AI
 * API calls for the USER role endpoints.
 */

import api from './api';

/** Fetch the authenticated user's full profile */
export const fetchProfile = () =>
  api.get('/user/profile').then((r) => r.data);

/** Update basic profile fields (name, phone, gender, dob, language, location) */
export const updateProfile = (data) =>
  api.put('/user/profile', data).then((r) => r.data);

/** Update the health profile snapshot (blood type, allergies, etc.) */
export const updateHealthProfile = (data) =>
  api.put('/user/health-profile', data).then((r) => r.data);

/** Update consent preferences */
export const updateConsent = (data) =>
  api.put('/user/consent', data).then((r) => r.data);

// ── Appointments (HSPL — hospital + professional, existing flow) ───────────────
export const fetchAppointments = (params = {}) =>
  api.get('/user/appointments', { params }).then((r) => r.data);

export const bookAppointment = (data) =>
  api.post('/user/appointments', data).then((r) => r.data);

export const fetchAppointment = (id) =>
  api.get(`/user/appointments/${id}`).then((r) => r.data);

export const cancelAppointment = (id, reason) =>
  api.put(`/user/appointments/${id}/cancel`, { reason }).then((r) => r.data);

// ── Expert Appointments (separate flow) ───────────────────────────────────────
export const fetchExpertAppointments = (params = {}) =>
  api.get('/user/expert-appointments', { params }).then((r) => r.data);

export const bookExpertAppointment = (data) =>
  api.post('/user/expert-appointments', data).then((r) => r.data);

// ── Professional (direct) Appointments (separate flow) ────────────────────────
export const fetchProfessionalAppointments = (params = {}) =>
  api.get('/user/professional-appointments', { params }).then((r) => r.data);

export const bookProfessionalAppointment = (data) =>
  api.post('/user/professional-appointments', data).then((r) => r.data);

// ── Search Experts ────────────────────────────────────────────────────────────
export const searchExperts = (params = {}) =>
  api.get('/search/experts', { params }).then((r) => r.data);

// ── Notifications ─────────────────────────────────────────────────────────────
export const fetchNotifications = (params = {}) =>
  api.get('/user/notifications', { params }).then((r) => r.data);

export const fetchUnreadCount = () =>
  api.get('/user/notifications/count').then((r) => r.data);

export const markNotificationRead = (id) =>
  api.put(`/user/notifications/${id}/read`).then((r) => r.data);

export const markAllNotificationsRead = () =>
  api.put('/user/notifications/read-all').then((r) => r.data);

// ── Health Records (History) ──────────────────────────────────────────────────
export const fetchHealthRecords = (params = {}) =>
  api.get('/user/history', { params }).then((r) => r.data);

export const createHealthRecord = (data) =>
  api.post('/user/history', data).then((r) => r.data);

export const fetchHealthRecord = (id) =>
  api.get(`/user/history/${id}`).then((r) => r.data);

export const updateHealthRecord = (id, data) =>
  api.put(`/user/history/${id}`, data).then((r) => r.data);

export const deleteHealthRecord = (id) =>
  api.delete(`/user/history/${id}`).then((r) => r.data);

// ── Search (public) ───────────────────────────────────────────────────────────
export const searchHospitals = (params = {}) =>
  api.get('/search/hospitals', { params }).then((r) => r.data);

export const fetchHospitalById = (id) =>
  api.get(`/search/hospitals/${id}`).then((r) => r.data);

export const searchProfessionals = (params = {}) =>
  api.get('/search/professionals', { params }).then((r) => r.data);

export const fetchProfessionalById = (id) =>
  api.get(`/search/professionals/${id}`).then((r) => r.data);

// ── Availability (dynamic slot fetching) ─────────────────────────────────────
export const fetchProfessionalSlots = (id, date) =>
  api.get(`/search/availability/professional/${id}`, { params: { date } }).then((r) => r.data);

export const fetchExpertSlots = (id, date) =>
  api.get(`/search/availability/expert/${id}`, { params: { date } }).then((r) => r.data);

// ── Nearby healthcare discovery ───────────────────────────────────────────────
export const fetchNearbyHospitals = (params = {}) =>
  api.get('/search/nearby', { params }).then((r) => r.data);

// ── Referrals ─────────────────────────────────────────────────────────────────
export const fetchReferrals = (params = {}) =>
  api.get('/user/referrals', { params }).then((r) => r.data);

export const createReferral = (data) =>
  api.post('/user/referrals', data).then((r) => r.data);

export const fetchReferral = (id) =>
  api.get(`/user/referrals/${id}`).then((r) => r.data);

export const cancelReferral = (id) =>
  api.put(`/user/referrals/${id}/cancel`).then((r) => r.data);

// ── Expert Requests / Escalations (user → expert) ────────────────────────────
export const fetchUserExpertRequests = (params = {}) =>
  api.get('/user/expert-requests', { params }).then((r) => r.data);

export const createUserExpertRequest = (expertId, description, priority) =>
  api.post('/user/expert-requests', { expertId, description, priority }).then((r) => r.data);
