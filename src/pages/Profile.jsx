import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const INPUT = {
  width: "100%", boxSizing: "border-box", padding: "11px 14px",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 10, fontSize: "0.9rem", color: "#e2e8f0",
  fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border 0.15s",
};
const LABEL = { display: "block", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 };
const CARD  = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px" };

const ROLE_META = {
  admin:     { icon: "👑", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
  developer: { icon: "💻", color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.25)" },
  viewer:    { icon: "👁️",  color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.25)" },
};

function Avatar({ name, size = 72 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const hue = (name || "?").charCodeAt(0) * 7 % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},45%,28%)`, border: "3px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 800, color: "#e2e8f0", flexShrink: 0, letterSpacing: "-1px" }}>
      {initials}
    </div>
  );
}

export default function Profile() {
  const { authFetch, user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [role, setRole]       = useState("viewer");
  const [stats, setStats]     = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ name: "", email: "" });
  const [pwForm, setPwForm]   = useState({ current: "", newPw: "", confirm: "" });
  const [saving, setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [toast, setToast]     = useState(null);
  const [showPw, setShowPw]   = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, roleRes, statsRes] = await Promise.all([
          authFetch(`${API}/auth/me`),
          authFetch(`${API}/rbac/my-role`),
          authFetch(`${API}/dashboard/stats`),
        ]);
        if (meRes.ok) {
          const d = await meRes.json();
          const u = d.user || d;
          setProfile(u);
          setForm({ name: u.name || "", email: u.email || "" });
        }
        if (roleRes.ok) { const d = await roleRes.json(); setRole(d.role || "viewer"); }
        if (statsRes.ok) { const d = await statsRes.json(); setStats(d); }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const r = await authFetch(`${API}/auth/update-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        const d = await r.json();
        setProfile(prev => ({ ...prev, ...form }));
        setEditing(false);
        showToast("Profile updated successfully!");
      } else {
        const d = await r.json();
        showToast(d.detail || "Update failed", "error");
      }
    } catch { showToast("Update failed", "error"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) { showToast("Passwords don't match", "error"); return; }
    if (pwForm.newPw.length < 8) { showToast("Password must be at least 8 characters", "error"); return; }
    setPwSaving(true);
    try {
      const r = await authFetch(`${API}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      if (r.ok) { setPwForm({ current: "", newPw: "", confirm: "" }); showToast("Password changed!"); }
      else { const d = await r.json(); showToast(d.detail || "Failed", "error"); }
    } catch { showToast("Failed", "error"); }
    finally { setPwSaving(false); }
  };

  const rm = ROLE_META[role] || ROLE_META.viewer;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080b12", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -80, left: "30%", width: 600, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)", filter: "blur(50px)" }} />
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header card */}
        <div style={{ ...CARD, marginBottom: 24, background: "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(129,140,248,0.05))", border: "1px solid rgba(99,102,241,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <Avatar name={profile?.name || profile?.email} size={80} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", color: "#e2e8f0", marginBottom: 4 }}>
                {profile?.name || "User"}
              </div>
              <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 10 }}>{profile?.email}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", background: rm.bg, border: `1px solid ${rm.border}`, borderRadius: 999, fontSize: 12, fontWeight: 700, color: rm.color }}>
                  {rm.icon} {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
                {profile?.created_at && (
                  <span style={{ fontSize: 12, color: "#374151" }}>
                    Joined {new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setEditing(!editing)} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.3)", background: editing ? "rgba(99,102,241,0.2)" : "transparent", color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              {editing ? "Cancel" : "✏️ Edit Profile"}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Tests Run", value: stats.total_tests ?? profile?.tests_run ?? "—", icon: "🧪" },
            { label: "Monitors", value: stats.sites_monitored ?? "—", icon: "📡" },
            { label: "Avg Response", value: stats.avg_response_ms ? `${stats.avg_response_ms}ms` : "—", icon: "⚡" },
            { label: "Uptime Accuracy", value: stats.uptime_accuracy ? `${stats.uptime_accuracy}%` : "—", icon: "✅" },
          ].map(s => (
            <div key={s.label} style={{ ...CARD, textAlign: "center", padding: "18px 16px" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", letterSpacing: "-0.5px" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#4b5563", marginTop: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Edit profile */}
          <div style={{ ...CARD, gridColumn: editing ? "1/-1" : "1" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>👤 Profile Info</div>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={LABEL}>Full Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" style={INPUT}
                    onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
                </div>
                <div>
                  <label style={LABEL}>Email</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" type="email" style={INPUT}
                    onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveProfile} disabled={saving} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Saving..." : "💾 Save Changes"}
                  </button>
                  <button onClick={() => { setEditing(false); setForm({ name: profile?.name || "", email: profile?.email || "" }); }} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[{ label: "Full Name", value: profile?.name || "—" }, { label: "Email", value: profile?.email || "—" }, { label: "Role", value: `${rm.icon} ${role.charAt(0).toUpperCase() + role.slice(1)}` }].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                    <span style={{ fontSize: 14, color: "#e2e8f0" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change password */}
          {!editing && (
            <div style={CARD}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🔒 Change Password</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { key: "current", label: "Current Password", ph: "••••••••" },
                  { key: "newPw",   label: "New Password",     ph: "Min. 8 characters" },
                  { key: "confirm", label: "Confirm New",      ph: "Repeat new password" },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label style={LABEL}>{label}</label>
                    <div style={{ position: "relative" }}>
                      <input type={showPw[key] ? "text" : "password"} value={pwForm[key]} onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                        placeholder={ph} style={{ ...INPUT, paddingRight: 40 }}
                        onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
                      <button onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4b5563", fontSize: 15, padding: 0 }}>
                        {showPw[key] ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={changePassword} disabled={pwSaving || !pwForm.current || !pwForm.newPw} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: pwForm.current && pwForm.newPw ? "linear-gradient(135deg,#6366f1,#818cf8)" : "rgba(99,102,241,0.2)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: pwForm.current && pwForm.newPw ? "pointer" : "not-allowed" }}>
                  {pwSaving ? "Saving..." : "🔑 Change Password"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, color: toast.type === "success" ? "#34d399" : "#f87171", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "slideUp 0.25s ease" }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
