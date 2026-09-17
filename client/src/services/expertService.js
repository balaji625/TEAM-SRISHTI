/**
 * expertService — CarePath AI
 * API calls for the EXPERT role endpoints.
 */

import api from './api';

export const fetchExpertProfile = () =>
  api.get('/expert/profile').then((r) => r.data);

export const upsertExpertProfile = (data) =>
  api.put('/expert/profile', data).then((r) => r.data);

// ── Consultations ─────────────────────────────────────────────────────────────
export const fetchExpertConsultations = (params = {}) =>
  api.get('/expert/consultations', { params }).then((r) => r.data);

export const updateExpertConsultationStatus = (id, status, note) =>
  api.put(`/expert/consultations/${id}/status`, { status, note }).then((r) => r.data);

// ── Requests ──────────────────────────────────────────────────────────────────
export const fetchExpertRequests = (params = {}) =>
  api.get('/expert/requests', { params }).then((r) => r.data);

export const sendRequestToHospital = (hospitalId, description, priority) =>
  api.post('/expert/requests/to-hospital', { hospitalId, description, priority }).then((r) => r.data);

export const sendRequestToAdmin = (subject, description, priority) =>
  api.post('/expert/requests/to-admin', { subject, description, priority }).then((r) => r.data);
