/**
 * adminService — CarePath AI
 * API calls for ADMIN role endpoints.
 */

import api from './api';

// ── Overview ──────────────────────────────────────────────────────────────────
export const fetchOverview = () =>
  api.get('/admin/overview').then((r) => r.data);

// ── Users ─────────────────────────────────────────────────────────────────────
export const fetchUsers = (params = {}) =>
  api.get('/admin/users', { params }).then((r) => r.data);

export const toggleUserActive = (id) =>
  api.put(`/admin/users/${id}/toggle-active`).then((r) => r.data);

// ── Hospitals ─────────────────────────────────────────────────────────────────
export const fetchHospitals = (params = {}) =>
  api.get('/admin/hospitals', { params }).then((r) => r.data);

export const fetchPendingHospitals = () =>
  api.get('/admin/hospitals/pending').then((r) => r.data);

export const verifyHospital = (id, action, reason) =>
  api.put(`/admin/hospitals/${id}/verify`, { action, reason }).then((r) => r.data);

export const createHospital = (data) =>
  api.post('/admin/hospitals/create', data).then((r) => r.data);

// ── Professionals ─────────────────────────────────────────────────────────────
export const fetchProfessionals = (params = {}) =>
  api.get('/admin/professionals', { params }).then((r) => r.data);

export const fetchPendingProfessionals = () =>
  api.get('/admin/professionals/pending').then((r) => r.data);

export const verifyProfessional = (id, action, reason) =>
  api.put(`/admin/professionals/${id}/verify`, { action, reason }).then((r) => r.data);

// ── Experts ───────────────────────────────────────────────────────────────────
export const fetchExperts = (params = {}) =>
  api.get('/admin/experts', { params }).then((r) => r.data);

export const fetchPendingExperts = () =>
  api.get('/admin/experts/pending').then((r) => r.data);

export const verifyExpert = (id, action, reason) =>
  api.put(`/admin/experts/${id}/verify`, { action, reason }).then((r) => r.data);

export const createExpert = (data) =>
  api.post('/admin/experts/create', data).then((r) => r.data);

export const createDoctor = (data) =>
  api.post('/admin/professionals/create', data).then((r) => r.data);

// ── Appointments ──────────────────────────────────────────────────────────────
export const fetchAdminAppointments = (params = {}) =>
  api.get('/admin/appointments', { params }).then((r) => r.data);

// ── Requests ──────────────────────────────────────────────────────────────────
export const fetchAdminRequests = (params = {}) =>
  api.get('/admin/requests', { params }).then((r) => r.data);

export const respondAdminRequest = (id, status, message) =>
  api.put(`/admin/requests/${id}/respond`, { status, message }).then((r) => r.data);

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const fetchAuditLogs = (params = {}) =>
  api.get('/admin/audit-logs', { params }).then((r) => r.data);

// ── Analytics ─────────────────────────────────────────────────────────────────
export const fetchAdminAnalytics = () =>
  api.get('/admin/analytics').then((r) => r.data);

// ── Settings ──────────────────────────────────────────────────────────────────
export const fetchAdminSettings = () =>
  api.get('/admin/settings').then((r) => r.data);
