import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const NAV = [
  ["Dashboard", "/dashboard"], ["History", "/history"], ["Trends", "/trends"],
  ["Diff", "/diff"], ["Schedules", "/schedules"], ["Teams", "/teams"],
  ["Slack", "/slack"], ["API Keys", "/apikeys"], ["Bulk Test", "/bulk"],
  ["Branding", "/whitelabel"], ["Analytics", "/analytics"],
  ["Roles", "/roles"], ["Alerts", "/notifications"], ["Templates", "/templates"], ["Monitors", "/monitoring"],
  ["New Test", "/"],
];

function Navbar({ user, logout, active }) {
  const navigate = useNavigate();
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>TestVerse</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#6b7280", marginRight: 4 }}>{user?.email}</span>
        {NAV.map(([label, path]) => (
          <button key={label} onClick={() => navigate(path)} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 500,
            background: active === label ? "rgba(99,102,241,0.15)" : "transparent",
            border: active === label ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: active === label ? "#818cf8" : "#9ca3af",
          }}>{label}</button>
        ))}
        <button onClick={() => { logout(); navigate("/login"); }} style={{ padding: "5px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>Logout</button>
      </div>
    </nav>
  );
}

const TRIGGERS = [
  { value: "test_complete",        label: "Test Complete",         icon: "✅" },
  { value: "test_failed",          label: "Test Failed",           icon: "❌" },
  { value: "score_drop",           label: "Score Drop",            icon: "📉" },
  { value: "score_below_threshold",label: "Score Below Threshold", icon: "⚠️" },
  { value: "uptime_down",          label: "Uptime Down",           icon: "🔴" },
  { value: "ssl_expiring",         label: "SSL Expiring",          icon: "🔒" },
  { value: "slow_response",        label: "Slow Response",         icon: "🐢" },
];
const CHANNELS = [
  { value: "email",   label: "Email",   icon: "✉️" },
  { value: "webhook", label: "Webhook", icon: "🔗" },
  { value: "slack",   label: "Slack",   icon: "💬" },
];

const statusColor = s => ({ sent: "#10b981", failed: "#ef4444", pending: "#f59e0b" }[s] || "#6b7280");

const BLANK_FORM = {
  name: "", trigger: "test_complete", url_pattern: "",
  score_threshold: "", response_time_ms: "", ssl_days_threshold: "",
  channels: ["email"], webhook_url: "", email_recipients: "", slack_channel: "",
};

export default function NotificationRules() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [rules, setRules]         = useState([]);
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]           = useState(BLANK_FORM);
  const [saving, setSaving]       = useState(false);
  const [testing, setTesting]     = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [error, setError]         = useState("");

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    Promise.all([
      authFetch(`${API}/notifications/rules`).then(r => r.json()),
      authFetch(`${API}/notifications/logs?limit=20`).then(r => r.json()),
    ]).then(([r, l]) => {
      setRules(r.rules || []);
      setLogs(l.logs || []);
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [authFetch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        score_threshold:    form.score_threshold    ? parseInt(form.score_threshold)    : null,
        response_time_ms:   form.response_time_ms   ? parseInt(form.response_time_ms)   : null,
        ssl_days_threshold: form.ssl_days_threshold ? parseInt(form.ssl_days_threshold) : null,
        email_recipients:   form.email_recipients   ? form.email_recipients.split(",").map(e => e.trim()) : null,
      };
      const r = await authFetch(`${API}/notifications/rules`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Failed");
      const data = await authFetch(`${API}/notifications/rules`).then(r => r.json());
      setRules(data.rules || []);
      setShowCreate(false); setForm(BLANK_FORM);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (ruleId) => {
    if (!confirm("Delete this notification rule?")) return;
    setDeleting(ruleId);
    try {
      await authFetch(`${API}/notifications/rules/${ruleId}`, { method: "DELETE" });
      setRules(p => p.filter(r => r.rule_id !== ruleId));
    } catch (e) { setError(e.message); }
    finally { setDeleting(null); }
  };

  const handleTest = async (ruleId) => {
    setTesting(ruleId);
    try {
      await authFetch(`${API}/notifications/test-rule`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rule_id: ruleId }),
      });
      const data = await authFetch(`${API}/notifications/logs?limit=20`).then(r => r.json());
      setLogs(data.logs || []);
      alert("Test notification sent! Check your channels.");
    } catch (e) { setError(e.message); }
    finally { setTesting(null); }
  };

  const toggleChannel = (ch) => {
    f("channels", form.channels.includes(ch)
      ? form.channels.filter(c => c !== ch)
      : [...form.channels, ch]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
      </div>
      <Navbar user={user} logout={logout} active="Alerts" />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              🔔 Notification Rules
            </h1>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Configure alerts and webhooks for test events</p>
          </div>
          <button onClick={() => setShowCreate(p => !p)} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            {showCreate ? "✕ Cancel" : "+ New Rule"}
          </button>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

        {/* Create Form */}
        {showCreate && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: "24px", marginBottom: 24, animation: "fadeIn 0.2s ease" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 }}>Create Notification Rule</div>
            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>Rule Name *</label>
                  <input required value={form.name} onChange={e => f("name", e.target.value)} placeholder='e.g. "Production Alert"'
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>Trigger Event *</label>
                  <select value={form.trigger} onChange={e => f("trigger", e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none" }}>
                    {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                {[
                  { key: "score_threshold",    label: "Score Threshold",    placeholder: "70" },
                  { key: "response_time_ms",   label: "Response Time (ms)", placeholder: "3000" },
                  { key: "ssl_days_threshold", label: "SSL Days Warning",   placeholder: "30" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>{label}</label>
                    <input type="number" value={form[key]} onChange={e => f(key, e.target.value)} placeholder={placeholder}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 10, fontWeight: 600 }}>Channels</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {CHANNELS.map(ch => (
                    <label key={ch.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 16px", borderRadius: 10, background: form.channels.includes(ch.value) ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${form.channels.includes(ch.value) ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`, transition: "all 0.15s" }}>
                      <input type="checkbox" checked={form.channels.includes(ch.value)} onChange={() => toggleChannel(ch.value)} style={{ accentColor: "#6366f1" }} />
                      <span style={{ fontSize: 13 }}>{ch.icon}</span>
                      <span style={{ fontSize: 13, color: form.channels.includes(ch.value) ? "#818cf8" : "#9ca3af", fontWeight: 500 }}>{ch.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.channels.includes("webhook") && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>Webhook URL</label>
                  <input type="url" value={form.webhook_url} onChange={e => f("webhook_url", e.target.value)} placeholder="https://hooks.example.com/..."
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              )}
              {form.channels.includes("email") && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>Additional Email Recipients</label>
                  <input type="text" value={form.email_recipients} onChange={e => f("email_recipients", e.target.value)} placeholder="email1@example.com, email2@example.com"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={saving}
                  style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creating…" : "Create Rule"}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setForm(BLANK_FORM); }}
                  style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 14, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : (<>

          {/* Rules Grid */}
          {rules.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#374151" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔕</div>
              <p style={{ fontSize: 14 }}>No notification rules yet. Create your first one above.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {rules.map(rule => {
                const trigger = TRIGGERS.find(t => t.value === rule.trigger);
                return (
                  <div key={rule.rule_id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{trigger?.icon} {rule.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{trigger?.label}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleTest(rule.rule_id)} disabled={testing === rule.rule_id} title="Send test notification"
                          style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: 13, cursor: "pointer", opacity: testing === rule.rule_id ? 0.5 : 1 }}>
                          {testing === rule.rule_id ? "…" : "▶ Test"}
                        </button>
                        <button onClick={() => handleDelete(rule.rule_id)} disabled={deleting === rule.rule_id} title="Delete rule"
                          style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, cursor: "pointer", opacity: deleting === rule.rule_id ? 0.5 : 1 }}>
                          {deleting === rule.rule_id ? "…" : "✕"}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {rule.channels?.map(ch => {
                        const c = CHANNELS.find(x => x.value === ch);
                        return (
                          <div key={ch} style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "#9ca3af" }}>
                            {c?.icon} {c?.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Delivery Logs */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>📨 Recent Notifications</div>
            {logs.length === 0 ? (
              <div style={{ color: "#374151", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No notifications sent yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {logs.map(log => (
                  <div key={log.log_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: statusColor(log.status) }}>{log.status?.toUpperCase()}</span>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>{log.trigger?.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: 12, color: "#4b5563" }}>→ {log.channel}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#374151" }}>{new Date(log.sent_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </>)}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: #1a1d2e; color: #e2e8f0; }
      `}</style>
    </div>
  );
}
