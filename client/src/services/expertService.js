/**
 * expertService — CarePath AI
 * API calls for the EXPERT role endpoints.
 */

import api from './api';

export const fetchExpertProfile = () =>
  api.get('/expert/profile').then((r) => r.data);

export const upsertExpertProfile = (data) =>
  api.put('/expert/profile', data).then((r) => r.data);

// ── Availability ──────────────────────────────────────────────────────────────
export const fetchExpertAvailability = () =>
  api.get('/expert/availability').then((r) => r.data);

export const saveExpertAvailability = (availability, consultationModes) =>
  api.put('/expert/availability', { availability, consultationModes }).then((r) => r.data);

// ── Credentials ───────────────────────────────────────────────────────────────
export const fetchExpertCredentials = () =>
  api.get('/expert/credentials').then((r) => r.data);

export const addExpertCredential = (formData) =>
  api.post('/expert/credentials', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const deleteExpertCredential = (credId) =>
  api.delete(`/expert/credentials/${credId}`).then((r) => r.data);

// ── Consultations ─────────────────────────────────────────────────────────────
export const fetchExpertConsultations = (params = {}) =>
  api.get('/expert/consultations', { params }).then((r) => r.data);

export const updateExpertConsultationStatus = (id, status, note) =>
  api.put(`/expert/consultations/${id}/status`, { status, note }).then((r) => r.data);

// ── Outgoing Requests (expert → hospital / admin) ─────────────────────────────
export const fetchExpertRequests = (params = {}) =>
  api.get('/expert/requests', { params }).then((r) => r.data);

export const sendRequestToHospital = (hospitalId, description, priority) =>
  api.post('/expert/requests/to-hospital', { hospitalId, description, priority }).then((r) => r.data);

export const sendRequestToAdmin = (subject, description, priority) =>
  api.post('/expert/requests/to-admin', { subject, description, priority }).then((r) => r.data);

// ── Incoming Requests (from users directed at this expert) ────────────────────
export const fetchIncomingExpertRequests = (params = {}) =>
  api.get('/expert/incoming-requests', { params }).then((r) => r.data);

export const updateIncomingExpertRequest = (id, status, message) =>
  api.put(`/expert/incoming-requests/${id}`, { status, message }).then((r) => r.data);
