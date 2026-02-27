/**
 * src/pages/ResetPassword.jsx
 * Accessed via /reset-password?token=xxx (link from forgot-password email)
 */
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 8, marginBottom: 14,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff", fontSize: 14, boxSizing: "border-box", outline: "none",
};

const Spinner = () => (
  <div style={{
    width: 18, height: 18, margin: "0 auto",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  }} />
);

export default function ResetPassword() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get("token");

  const [status,      setStatus]      = useState("verifying"); // verifying | valid | invalid | success
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    fetch(`${API}/auth/verify-reset-token/${token}`)
      .then((r) => r.json())
      .then((d) => setStatus(d.valid ? "valid" : "invalid"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");
      setStatus("success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const Card = ({ children }) => (
    <div style={{
      minHeight: "100vh", background: "#080b12",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        background: "#0f1623", border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: 16, padding: 40, width: 420, maxWidth: "90vw",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <svg viewBox="0 0 24 24" width="28" height="28" stroke="#6366f1"
            strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>TestVerse</span>
        </div>
        {children}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (status === "verifying") return (
    <Card>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <Spinner />
        <p style={{ color: "#6b7280", marginTop: 16 }}>Verifying your reset link…</p>
      </div>
    </Card>
  );

  if (status === "invalid") return (
    <Card>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
        <h2 style={{ color: "#ef4444", marginBottom: 8, fontSize: 20 }}>Invalid Link</h2>
        <p style={{ color: "#6b7280", marginBottom: 28, fontSize: 14 }}>
          This reset link is invalid or has already been used.<br />
          Please request a new one.
        </p>
        <button onClick={() => navigate("/login")} style={{
          padding: "11px 28px", borderRadius: 8, border: "none",
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          color: "#fff", cursor: "pointer", fontWeight: 600,
        }}>
          Back to Login
        </button>
      </div>
    </Card>
  );

  if (status === "success") return (
    <Card>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#10b981", marginBottom: 8, fontSize: 20 }}>Password Reset!</h2>
        <p style={{ color: "#6b7280", marginBottom: 28, fontSize: 14 }}>
          Your password has been updated successfully.<br />
          You can now sign in with your new password.
        </p>
        <button onClick={() => navigate("/login")} style={{
          padding: "11px 28px", borderRadius: 8, border: "none",
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          color: "#fff", cursor: "pointer", fontWeight: 600,
        }}>
          Go to Login →
        </button>
      </div>
    </Card>
  );

  // status === "valid" → show form
  return (
    <Card>
      <h2 style={{ color: "#fff", marginBottom: 6, fontSize: 20 }}>🔑 Set New Password</h2>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        Choose a strong password for your account.
      </p>

      <form onSubmit={handleReset}>
        {/* New password */}
        <div style={{ position: "relative", marginBottom: 4 }}>
          <input
            type={showPass ? "text" : "password"}
            placeholder="New password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, paddingRight: 44 }}
            required minLength={8}
          />
          <button type="button" onClick={() => setShowPass(!showPass)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 0 }}>
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Password strength hint */}
        {password.length > 0 && (
          <p style={{
            fontSize: 12, marginBottom: 12,
            color: password.length >= 12 ? "#10b981" : password.length >= 8 ? "#f59e0b" : "#ef4444"
          }}>
            {password.length >= 12 ? "✓ Strong password" :
             password.length >= 8  ? "⚠ Acceptable — longer is better" :
             "✗ Too short"}
          </p>
        )}

        {/* Confirm password */}
        <div style={{ position: "relative", marginBottom: 4 }}>
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, paddingRight: 44 }}
            required
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 0 }}>
            {showConfirm ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Match indicator */}
        {confirm.length > 0 && (
          <p style={{
            fontSize: 12, marginBottom: 16,
            color: password === confirm ? "#10b981" : "#ef4444"
          }}>
            {password === confirm ? "✓ Passwords match" : "✗ Passwords don't match"}
          </p>
        )}

        {error && (
          <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 14 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || password !== confirm || password.length < 8}
          style={{
            width: "100%", padding: "12px", borderRadius: 10, border: "none",
            background: (loading || password !== confirm || password.length < 8)
              ? "rgba(99,102,241,0.4)"
              : "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff", fontWeight: 600, fontSize: 15,
            cursor: (loading || password !== confirm || password.length < 8) ? "not-allowed" : "pointer",
          }}
        >
          {loading ? <Spinner /> : "Reset Password →"}
        </button>
      </form>
    </Card>
  );
}
