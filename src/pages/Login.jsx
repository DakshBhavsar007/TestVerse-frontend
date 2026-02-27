import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";
import "./Login.css";

const ROLES = [
  { id: "admin",     icon: "👑", label: "Admin",     desc: "Full access — billing, team, config", color: "#f59e0b" },
  { id: "developer", icon: "💻", label: "Developer", desc: "Run tests, schedules, API keys",       color: "#6366f1" },
  { id: "viewer",    icon: "👁️",  label: "Viewer",    desc: "Read-only — results & reports",       color: "#6b7280" },
];

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 8,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff", fontSize: 14, boxSizing: "border-box", outline: "none",
};

const btnPrimary = (disabled) => ({
  width: "100%", padding: "12px", borderRadius: 10, border: "none",
  background: disabled ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
  color: "#fff", fontWeight: 600, fontSize: 15,
  cursor: disabled ? "not-allowed" : "pointer", transition: "opacity 0.2s",
});

const Spinner = () => (
  <div style={{
    width: 18, height: 18, margin: "0 auto",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  }} />
);

// ─── OTP Input — 6 boxes (fixed: refs declared outside map) ──────────────────
function OTPInput({ value, onChange }) {
  const ref0 = useRef(null);
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const ref4 = useRef(null);
  const ref5 = useRef(null);
  const refs = [ref0, ref1, ref2, ref3, ref4, ref5];

  const digits = (value + "      ").slice(0, 6).split("");

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) refs[i - 1].current?.focus();
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const arr = (value + "      ").slice(0, 6).split("");
    arr[i] = e.key;
    onChange(arr.join("").trimEnd().slice(0, 6));
    if (i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      refs[Math.min(pasted.length, 5)].current?.focus();
    }
    e.preventDefault();
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "24px 0" }}>
      {digits.map((d, i) => {
        const filled = d.trim() !== "";
        return (
          <input
            key={i}
            ref={refs[i]}
            value={filled ? d : ""}
            onChange={() => {}}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            maxLength={1}
            inputMode="numeric"
            style={{
              width: 46, height: 56, textAlign: "center", fontSize: 24, fontWeight: 700,
              borderRadius: 10,
              border: `2px solid ${filled ? "#6366f1" : "rgba(255,255,255,0.15)"}`,
              background: filled ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
              color: "#fff", outline: "none", transition: "all 0.15s",
              boxShadow: filled ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Role Picker ──────────────────────────────────────────────────────────────
function RolePicker({ selected, onSelect }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ROLES.map((r) => (
        <button key={r.id} type="button" onClick={() => onSelect(r.id)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", borderRadius: 10, cursor: "pointer",
            background: selected === r.id ? `${r.color}20` : "rgba(255,255,255,0.03)",
            border: `1px solid ${selected === r.id ? r.color : "rgba(255,255,255,0.1)"}`,
            transition: "all 0.2s", textAlign: "left",
          }}
        >
          <span style={{ fontSize: 22 }}>{r.icon}</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", color: selected === r.id ? r.color : "#fff", fontWeight: 600, fontSize: 14 }}>{r.label}</span>
            <span style={{ display: "block", color: "#6b7280", fontSize: 12 }}>{r.desc}</span>
          </span>
          {selected === r.id && <span style={{ color: r.color, fontWeight: 700, fontSize: 16 }}>✓</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Overlay + Modal helpers ──────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
      }}>
      <div style={{
        background: "#0f1623", border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: 16, padding: 32, width: 400, maxWidth: "90vw",
      }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ color: "#fff", fontSize: 20, margin: 0 }}>{title}</h2>
      <button onClick={onClose}
        style={{ background: "none", border: "none", color: "#6b7280", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>✕</button>
    </div>
  );
}

function StatusCard({ icon, color, title, body, onClose, closeLabel }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      <p style={{ color, fontWeight: 600, marginBottom: 8, fontSize: 16 }}>{title}</p>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>{body}</p>
      <button onClick={onClose}
        style={{ padding: "10px 28px", borderRadius: 8, border: "none",
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
          cursor: "pointer", fontWeight: 600 }}>
        {closeLabel}
      </button>
    </div>
  );
}

// ─── Forgot Password Modal ────────────────────────────────────────────────────
function ForgotModal({ onClose, forgotPassword }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setStatus("");
    try {
      const data = await forgotPassword(email);
      setStatus(data.message === "google_account" ? "google" : "sent");
    } catch { setStatus("error"); }
    finally { setLoading(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="🔐 Forgot Password" onClose={onClose} />
      {!status && (
        <>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>Enter your email and we'll send you a reset link.</p>
          <input type="email" placeholder="Your email address" value={email}
            onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} />
          <button onClick={submit} disabled={loading || !email} style={btnPrimary(loading || !email)}>
            {loading ? <Spinner /> : "Send Reset Link →"}
          </button>
        </>
      )}
      {status === "sent" && <StatusCard icon="📬" color="#10b981" title="Reset link sent!"
        body="Check your inbox. The link expires in 1 hour." onClose={onClose} closeLabel="Close" />}
      {status === "google" && <StatusCard icon="🔗" color="#f59e0b" title="Google Account Detected"
        body={<>This email uses Google Sign-In.<br />Please use <strong style={{ color: "#fff" }}>Sign in with Google</strong> instead.</>}
        onClose={onClose} closeLabel="Got it" />}
      {status === "error" && <p style={{ color: "#ef4444", fontSize: 14 }}>Something went wrong. Please try again.</p>}
    </Overlay>
  );
}

// ─── Google Role Modal ────────────────────────────────────────────────────────
function GoogleRoleModal({ onConfirm, onCancel, loading }) {
  const [role, setRole] = useState("developer");
  return (
    <Overlay onClose={onCancel}>
      <ModalHeader title="🎭 Select Your Role" onClose={onCancel} />
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>Choose how you'll use TestVerse</p>
      <RolePicker selected={role} onSelect={setRole} />
      <p style={{ color: "#6b7280", fontSize: 12, margin: "12px 0 20px" }}>ℹ️ Can be changed later by an Admin.</p>
      <button onClick={() => onConfirm(role)} disabled={loading} style={btnPrimary(loading)}>
        {loading ? <Spinner /> : "Continue with Google →"}
      </button>
    </Overlay>
  );
}

// ─── OTP Screen ───────────────────────────────────────────────────────────────
function OTPScreen({ email, onSuccess, onBack, verifyOtp, resendOtp }) {
  const [otp,     setOtp]     = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [resent,  setResent]  = useState(false);
  const [timer,   setTimer]   = useState(30);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const handleVerify = async () => {
    if (otp.replace(/\s/g, "").length !== 6) { setError("Please enter all 6 digits."); return; }
    setError(""); setLoading(true);
    try {
      await verifyOtp(email, otp.replace(/\s/g, ""));
      onSuccess();
    } catch (err) {
      setError(err.message); setOtp("");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(""); setResent(false);
    try {
      await resendOtp(email);
      setResent(true); setTimer(30); setOtp("");
    } catch (err) { setError(err.message); }
  };

  const filledCount = otp.replace(/\s/g, "").length;

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <div className="logo-container">
            <svg className="logo-icon" viewBox="0 0 24 24" width="32" height="32"
              stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            <h1 className="brand-name">TestVerse</h1>
          </div>
          <p className="tagline">Automated Website Testing</p>
        </header>

        <div style={{ padding: "0 4px" }}>
          {/* ← Back button */}
          <button
            type="button"
            onClick={onBack}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", color: "#6b7280",
              fontSize: 13, cursor: "pointer", padding: "0 0 16px 0",
              fontWeight: 500, transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
          >
            ← Back to Register
          </button>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 44 }}>📧</span>
          </div>
          <h2 style={{ color: "#fff", textAlign: "center", fontSize: 20, marginBottom: 8 }}>
            Verify your email
          </h2>
          <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center", marginBottom: 4 }}>
            We sent a 6-digit code to
          </p>
          <p style={{ color: "#6366f1", fontSize: 14, textAlign: "center", fontWeight: 600, marginBottom: 4 }}>
            {email}
          </p>
          <p style={{ color: "#6b7280", fontSize: 12, textAlign: "center", marginBottom: 0 }}>
            Code expires in 10 minutes
          </p>

          {/* ✅ 6 OTP boxes */}
          <OTPInput value={otp} onChange={setOtp} />

          {error && (
            <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || filledCount !== 6}
            style={btnPrimary(loading || filledCount !== 6)}
          >
            {loading ? <Spinner /> : "Verify & Continue →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            {resent && <p style={{ color: "#10b981", fontSize: 13, marginBottom: 8 }}>✓ New code sent!</p>}
            {timer > 0 ? (
              <p style={{ color: "#6b7280", fontSize: 13 }}>
                Resend code in <strong style={{ color: "#fff" }}>{timer}s</strong>
              </p>
            ) : (
              <button onClick={handleResend}
                style={{ background: "none", border: "none", color: "#6366f1",
                  fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                Resend code
              </button>
            )}
          </div>
        </div>
      </div>
      <GlobalStyles />
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      .sr-only {
        position: absolute; width: 1px; height: 1px; padding: 0;
        margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
        white-space: nowrap; border-width: 0;
      }
    `}</style>
  );
}

// ─── Main Login ───────────────────────────────────────────────────────────────
export default function Login() {
  const { login, register, verifyOtp, resendOtp, googleLogin, forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [mode,          setMode]         = useState("login");
  const [screen,        setScreen]       = useState("form");
  const [form,          setForm]         = useState({ email: "", password: "", name: "" });
  const [role,          setRole]         = useState("developer");
  const [error,         setError]        = useState("");
  const [loading,       setLoading]      = useState(false);
  const [showPassword,  setShowPassword] = useState(false);
  const [googleToken,   setGoogleToken]  = useState(null);
  const [showRoleModal, setShowRoleModal]= useState(false);
  const [googleLoading, setGoogleLoading]= useState(false);
  const [showForgot,    setShowForgot]   = useState(false);
  const [otpEmail,      setOtpEmail]     = useState("");

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    if (e) e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        navigate("/");
      } else {
        await register(form.email, form.password, form.name, role);
        setOtpEmail(form.email);
        setScreen("otp");
      }
    } catch (err) {
      // "email_not_verified" — user tried to login before verifying
      // "email_pending_verification" — user went back from OTP screen and re-registered
      if (err.message === "email_not_verified" || err.message === "email_pending_verification") {
        setOtpEmail(form.email);
        setScreen("otp");
      } else {
        setError(err.message);
      }
    } finally { setLoading(false); }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setGoogleToken(credentialResponse.credential);
    setShowRoleModal(true);
  };

  const handleGoogleRoleConfirm = async (selectedRole) => {
    setGoogleLoading(true);
    try {
      await googleLogin(googleToken, selectedRole);
      navigate("/");
    } catch (err) {
      setError(err.message); setShowRoleModal(false);
    } finally { setGoogleLoading(false); }
  };

  if (screen === "otp") {
    return (
      <OTPScreen
        email={otpEmail}
        onSuccess={() => navigate("/")}
        onBack={() => { setScreen("form"); setMode("register"); setError(""); }}
        verifyOtp={verifyOtp}
        resendOtp={resendOtp}
      />
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <header className="login-header">
          <div className="logo-container">
            <svg className="logo-icon" viewBox="0 0 24 24" width="32" height="32"
              stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            <h1 className="brand-name">TestVerse</h1>
          </div>
          <p className="tagline">Automated Website Testing</p>
        </header>

        <nav className="login-tabs">
          <button className={`tab-button ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }} type="button">Login</button>
          <button className={`tab-button ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); }} type="button">Register</button>
        </nav>

        <form className="login-form" onSubmit={submit}>

          {mode === "register" && (
            <div className="form-field">
              <label htmlFor="name" className="sr-only">Full Name</label>
              <div className="input-container">
                <input id="name" name="name" type="text" placeholder="Full name"
                  className="auth-input" value={form.name} onChange={handle} required />
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="form-field">
              <label className="role-label">Select Your Role</label>
              <div className="role-options">
                {ROLES.map((r) => (
                  <button key={r.id} type="button" onClick={() => setRole(r.id)}
                    className={`role-option ${role === r.id ? "role-option--active" : ""}`}
                    style={role === r.id ? { "--role-color": r.color } : {}}>
                    <span className="role-icon">{r.icon}</span>
                    <span className="role-text">
                      <span className="role-name" style={role === r.id ? { color: r.color } : {}}>{r.label}</span>
                      <span className="role-desc">{r.desc}</span>
                    </span>
                    <span className={`role-radio ${role === r.id ? "role-radio--checked" : ""}`}
                      style={role === r.id ? { background: r.color, borderColor: r.color } : {}}>
                      {role === r.id && "✓"}
                    </span>
                  </button>
                ))}
              </div>
              <p className="role-hint">ℹ️ Can be changed later by an Admin.</p>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email" className="sr-only">Email Address</label>
            <div className="input-container">
              <input id="email" name="email" type="email" placeholder="Email address"
                className="auth-input" value={form.email} onChange={handle} required />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="input-container password-wrapper">
              <input id="password" name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 8 chars)" className="auth-input"
                value={form.password} onChange={handle} required minLength={8} />
              <button type="button" className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {mode === "login" && (
              <button type="button" onClick={() => setShowForgot(true)}
                style={{ background: "none", border: "none", color: "#6366f1",
                  fontSize: 13, cursor: "pointer", fontWeight: 500,
                  padding: "6px 0", display: "block", marginLeft: "auto" }}>
                Forgot password?
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? <Spinner /> : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 6px" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ color: "#4b5563", fontSize: 12, whiteSpace: "nowrap" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google sign-in failed. Please try again.")}
              theme="filled_black"
              shape="rectangular"
              text={mode === "login" ? "signin_with" : "signup_with"}
              width="320"
            />
          </div>

        </form>
      </div>

      {showRoleModal && (
        <GoogleRoleModal
          onConfirm={handleGoogleRoleConfirm}
          onCancel={() => setShowRoleModal(false)}
          loading={googleLoading}
        />
      )}

      {showForgot && (
        <ForgotModal
          onClose={() => setShowForgot(false)}
          forgotPassword={forgotPassword}
        />
      )}

      <GlobalStyles />
    </div>
  );
}