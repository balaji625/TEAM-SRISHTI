/**
 * Axios base instance — CarePath AI
 *
 * All API calls go through the Vite proxy → http://localhost:5000
 * in development, and use VITE_API_URL in production builds.
 */

import axios from 'axios';

const TOKEN_KEY = 'cp_token';

// In dev: Vite proxy handles /api → localhost:5000
// In prod build: set VITE_API_URL to your backend URL
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT from localStorage ────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale token and broadcast so AuthContext can reset user state immediately
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('carepath:auth:expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
