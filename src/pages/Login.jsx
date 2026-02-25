import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Login.css";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    if (e) e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.email, form.password, form.name);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <div className="logo-container">
            <svg
              className="logo-icon"
              viewBox="0 0 24 24"
              width="32"
              height="32"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
            <h1 className="brand-name">TestVerse</h1>
          </div>
          <p className="tagline">Automated Website Testing</p>
        </header>

        <nav className="login-tabs">
          <button
            className={`tab-button ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`tab-button ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
            type="button"
          >
            Register
          </button>
        </nav>

        <form className="login-form" onSubmit={submit}>
          {mode === "register" && (
            <div className="form-field">
              <label htmlFor="name" className="sr-only">Full Name</label>
              <div className="input-container">
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Full name"
                  className="auth-input"
                  value={form.name}
                  onChange={handle}
                  required={mode === "register"}
                />
              </div>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email" className="sr-only">Email Address</label>
            <div className="input-container">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                className="auth-input"
                value={form.email}
                onChange={handle}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="input-container password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 8 chars)"
                className="auth-input"
                value={form.password}
                onChange={handle}
                required
                minLength={8}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {mode === "login" && (
              <a href="#forgot" className="forgot-password">Forgot password?</a>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? (
              <div className="spinner-sm" style={{
                width: "18px",
                height: "18px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite"
              }} />
            ) : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </div>
  );
}
