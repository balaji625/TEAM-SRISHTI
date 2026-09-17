/**
 * AuthContext — CarePath AI
 *
 * Provides authentication state and actions to the entire React tree.
 * Token stored in localStorage under 'cp_token'.
 * On mount, restores session by calling GET /api/auth/me with the stored token.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { registerUser, loginUser, fetchMe, logoutUser } from '../services/authService';

const AuthContext = createContext(null);

// ── Role → dashboard path map ─────────────────────────────────────────────────
export const ROLE_DASHBOARD = {
  USER:         '/user/dashboard',
  HOSPITAL:     '/hospital/dashboard',
  PROFESSIONAL: '/professional/dashboard',
  EXPERT:       '/expert/dashboard',
  ADMIN:        '/admin/dashboard',
};

const TOKEN_KEY = 'cp_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Restore session on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchMe();
        setUser(data.data.user);
      } catch {
        // Token invalid or expired — clear it silently
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();

    // Listen for 401 events fired by the Axios interceptor (token expired mid-session)
    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('carepath:auth:expired', handleExpired);
    return () => window.removeEventListener('carepath:auth:expired', handleExpired);
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setError(null);
    const data = await loginUser({ email, password });
    localStorage.setItem(TOKEN_KEY, data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    setError(null);
    const data = await registerUser(formData);
    localStorage.setItem(TOKEN_KEY, data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await logoutUser();
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    setError,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    dashboardPath:   user ? (ROLE_DASHBOARD[user.role] ?? '/') : '/',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
