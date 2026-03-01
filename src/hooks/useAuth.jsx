/**
 * useAuth.jsx — Auth context + hook
 * Wrap your app root with <AuthProvider>, then call useAuth() anywhere.
 * Stores JWT in localStorage.
 *
 * Provides:
 *   login, register, googleLogin, logout, authFetch
 *   sendOtp (alias: register), verifyOtp, resendOtp
 *   forgotPassword
 */
import { createContext, useContext, useState, useCallback } from "react";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const KEY = "testverse_token";
const AuthContext = createContext(null);

function _decodeUser(token) {
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return { email: p.sub, name: p.name, id: p.id || p.sub };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(KEY));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem(KEY);
    return t ? _decodeUser(t) : null;
  });
  const [loading, setLoading] = useState(false);

  const _store = useCallback((tok, userData) => {
    localStorage.setItem(KEY, tok);
    setToken(tok);
    setUser(userData);
  }, []);

  // ── Register (step 1) — sends OTP, does NOT log user in yet ──────────────
  const register = useCallback(async (email, password, name, role = "developer") => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Registration failed");
    // Returns { message: "otp_sent", email }  — no token yet
    return data;
  }, []);

  // ── Verify OTP (step 2) — activates account and logs user in ─────────────
  const verifyOtp = useCallback(async (email, otp) => {
    const res = await fetch(`${API}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "OTP verification failed");
    _store(data.access_token, data.user);
    return data;
  }, [_store]);

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const resendOtp = useCallback(async (email) => {
    const res = await fetch(`${API}/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Could not resend OTP");
    return data;
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }).toString(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Login failed");
    _store(data.access_token, data.user);
    return data;
  }, [_store]);

  // ── Google Login ──────────────────────────────────────────────────────────
  const googleLogin = useCallback(async (googleToken, role = "developer") => {
    const res = await fetch(`${API}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: googleToken, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Google login failed");
    _store(data.access_token, data.user);
    return data;
  }, [_store]);

  // ── Forgot Password ───────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email) => {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Request failed");
    return data; // { message: "google_account" | "If that email exists..." }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setToken(null);
    setUser(null);
  }, []);

  // ── Authenticated fetch ───────────────────────────────────────────────────
  const authFetch = useCallback(async (url, options = {}) => {
    // Don't force JSON Content-Type when sending FormData (file uploads)
    const isFormData = options.body instanceof FormData;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error("Session expired — please log in again");
    }
    return res;
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{
      user, setUser, token, loading,
      login, register, verifyOtp, resendOtp,
      googleLogin, forgotPassword,
      logout, authFetch,
      isLoggedIn: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}
