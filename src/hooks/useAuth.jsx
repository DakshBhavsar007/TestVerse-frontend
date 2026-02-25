/**
 * useAuth.js — Auth context + hook
 * Wrap your app root with <AuthProvider>, then call useAuth() anywhere.
 * Stores JWT in localStorage. Provides login, register, logout, authFetch.
 */
import { createContext, useContext, useState, useCallback } from "react";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const KEY = "testverse_token";
const AuthContext = createContext(null);

function _decodeUser(token) {
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return { email: p.sub, name: p.name, id: p.id || p.sub };
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(KEY));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem(KEY);
    return t ? _decodeUser(t) : null;
  });

  const _store = useCallback((tok, userData) => {
    localStorage.setItem(KEY, tok);
    setToken(tok);
    setUser(userData);
  }, []);

  const register = useCallback(async (email, password, name) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Registration failed");
    _store(data.access_token, data.user);
    return data;
  }, [_store]);

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

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) { logout(); throw new Error("Session expired — please log in again"); }
    return res;
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, register, logout, authFetch, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}
