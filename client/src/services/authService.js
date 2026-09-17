/**
 * authService (client) — CarePath AI
 *
 * All auth-related API calls. Called by AuthContext.
 * Never stores passwords. Token stored in localStorage.
 */

import api from './api';

// ── Register ──────────────────────────────────────────────────────────────────
export const registerUser = async (data) => {
  const res = await api.post('/auth/register', data);
  return res.data;  // { success, message, data: { token, user } }
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginUser = async ({ email, password }) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

// ── Get current user ──────────────────────────────────────────────────────────
export const fetchMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore — we always clear the token locally
  }
};
