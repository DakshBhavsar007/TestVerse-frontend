import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";


const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 };
const input = { width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box", outline: "none" };
const lbl = { fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6 };

const statusColors = { active: "#10b981", expiring_soon: "#f59e0b", expired: "#ef4444" };
const statusLabels = { active: "Active", expiring_soon: "Expiring Soon", expired: "Expired" };

export default function Compliance() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("security");
  const [securitySummary, setSecuritySummary] = useState(null);
  const [keyPolicy, setKeyPolicy] = useState({ rotation_days: 90, notify_days_before: 14, auto_revoke: false });
  const [retentionPolicy, setRetentionPolicy] = useState({ test_results_days: 90, audit_logs_days: 365, notification_logs_days: 30 });
  const [keyStatuses, setKeyStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [msg, setMsg] = useState("");
  const [rotatingKey, setRotatingKey] = useState(null);
  const [newKeySecret, setNewKeySecret] = useState(null);
  const [purging, setPurging] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [gdprExporting, setGdprExporting] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [secRes, kpRes, krRes, retRes] = await Promise.all([
        authFetch(`${API}/compliance/security-summary`),
        authFetch(`${API}/compliance/key-rotation-policy`),
        authFetch(`${API}/compliance/key-rotation-status`),
        authFetch(`${API}/compliance/data-retention`),
      ]);
      if (secRes.ok) setSecuritySummary((await secRes.json()).summary);
      if (kpRes.ok) setKeyPolicy((await kpRes.json()).policy);
      if (krRes.ok) setKeyStatuses((await krRes.json()).keys || []);
      if (retRes.ok) setRetentionPolicy((await retRes.json()).policy);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function saveKeyPolicy() {
    setSaving("key"); setMsg("");
    const res = await authFetch(`${API}/compliance/key-rotation-policy`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keyPolicy),
    });
    const d = await res.json();
    setMsg(res.ok ? "✓ Key rotation policy saved" : "✗ " + (d.detail || "Failed"));
    setSaving("");
    if (res.ok) loadAll();
  }

  async function saveRetentionPolicy() {
    setSaving("retention"); setMsg("");
    const res = await authFetch(`${API}/compliance/data-retention`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(retentionPolicy),
    });
    const d = await res.json();
    setMsg(res.ok ? "✓ Data retention policy saved" : "✗ " + (d.detail || "Failed"));
    setSaving("");
  }

  async function rotateKey(keyId) {
    setRotatingKey(keyId); setNewKeySecret(null);
    const res = await authFetch(`${API}/compliance/rotate-key/${keyId}`, { method: "POST" });
    const d = await res.json();
    if (res.ok) { setNewKeySecret(d.new_key); loadAll(); }
    else setMsg("✗ " + (d.detail || "Failed"));
    setRotatingKey(null);
  }

  async function purgeData() {
    setPurging(true); setMsg("");
    const res = await authFetch(`${API}/compliance/purge-old-data`, { method: "POST" });
    const d = await res.json();
    if (res.ok) {
      const total = Object.values(d.purged || {}).reduce((a, b) => a + b, 0);
      setMsg(`✓ Purged ${total} records based on retention policy`);
    } else {
      setMsg("✗ " + (d.detail || "Failed"));
    }
    setPurging(false);
  }

  async function gdprExport() {
    setGdprExporting(true);
    const res = await authFetch(`${API}/compliance/gdpr/export`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ include_test_results: true, include_schedules: true, include_api_keys: false, include_audit_logs: true, include_notifications: true }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `testverse_gdpr_${new Date().toISOString().slice(0,10)}.json`;
      a.click(); URL.revokeObjectURL(url);
    }
    setGdprExporting(false);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE_MY_ACCOUNT") return;
    setDeleting(true);
    const res = await authFetch(`${API}/compliance/gdpr/delete-account?confirm=${deleteConfirm}`, { method: "DELETE" });
    if (res.ok) { logout(); navigate("/login"); }
    else { const d = await res.json(); setMsg("✗ " + (d.detail || "Failed")); }
    setDeleting(false);
  }

  const secScore = securitySummary?.score ?? 0;
  const secColor = secScore >= 80 ? "#10b981" : secScore >= 60 ? "#f59e0b" : "#ef4444";
  const tabBtn = (t, l) => ({
    padding: "8px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: 600, border: "none",
    background: tab === t ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)",
    color: tab === t ? "#fff" : "#9ca3af",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 20, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>COMPLIANCE & SECURITY</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, background: "linear-gradient(135deg,#fff 40%,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Security & Compliance</h1>
          <p style={{ color: "#6b7280", marginTop: 8, fontSize: 15 }}>API key rotation policies, data retention controls, and GDPR tools.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {[["security", "🔐 Security Score"], ["keys", "🔑 Key Rotation"], ["retention", "🗂 Data Retention"], ["gdpr", "⚖️ GDPR"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={tabBtn(t, l)}>{l}</button>
          ))}
        </div>

        {msg && <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: msg.startsWith("✓") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${msg.startsWith("✓") ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, fontSize: 13, color: msg.startsWith("✓") ? "#34d399" : "#ef4444" }}>{msg}</div>}

        {loading && <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}><div style={{ width: 36, height: 36, border: "3px solid rgba(16,185,129,0.3)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />Loading...</div>}

        {/* Security Score Tab */}
        {!loading && tab === "security" && securitySummary && (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
            <div style={{ ...card, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 16px" }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                  <circle cx="70" cy="70" r="58" fill="none" stroke={secColor} strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 58}`}
                    strokeDashoffset={`${2 * Math.PI * 58 * (1 - secScore / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 0.8s" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 34, fontWeight: 800, color: secColor }}>{secScore}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>/ 100</div>
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Security Score</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{secScore >= 80 ? "Good" : secScore >= 60 ? "Needs Attention" : "At Risk"}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["Key rotation policy", securitySummary.key_rotation_policy, "Set up automatic key rotation to prevent credential compromise"],
                ["Data retention policy", securitySummary.data_retention_policy, "Configure how long test data is stored"],
                ["No expired API keys", securitySummary.expired_keys === 0, `${securitySummary.expired_keys} expired key(s) still active — rotate them now`],
              ].map(([title, passed, desc]) => (
                <div key={title} style={{ ...card, display: "flex", gap: 16, alignItems: "center", padding: "16px 20px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: passed ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {passed ? "✅" : "❌"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{!passed ? desc : "✓ Configured"}</div>
                  </div>
                </div>
              ))}
              {securitySummary.recent_logins?.length > 0 && (
                <div style={card}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>🕐 Recent Logins</div>
                  {securitySummary.recent_logins.map((l, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#6b7280", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {l.timestamp?.slice(0, 16).replace("T", " ")} {l.ip ? `· ${l.ip}` : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Rotation Tab */}
        {!loading && tab === "keys" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={card}>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>🔑 Rotation Policy</h3>
              <div style={{ marginBottom: 16 }}>
                <span style={lbl}>Rotate keys every (days)</span>
                <input type="number" min="7" max="365" value={keyPolicy.rotation_days}
                  onChange={e => setKeyPolicy(p => ({ ...p, rotation_days: parseInt(e.target.value) }))} style={input} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={lbl}>Warn before expiry (days)</span>
                <input type="number" min="1" max="30" value={keyPolicy.notify_days_before}
                  onChange={e => setKeyPolicy(p => ({ ...p, notify_days_before: parseInt(e.target.value) }))} style={input} />
              </div>
              <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" id="autoRevoke" checked={keyPolicy.auto_revoke}
                  onChange={e => setKeyPolicy(p => ({ ...p, auto_revoke: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: "pointer" }} />
                <label htmlFor="autoRevoke" style={{ fontSize: 13, color: "#9ca3af", cursor: "pointer" }}>Auto-revoke expired keys</label>
              </div>
              <button onClick={saveKeyPolicy} disabled={saving === "key"} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                {saving === "key" ? "Saving..." : "Save Policy"}
              </button>
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>🗝 API Key Status</h3>
              {newKeySecret && (
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginBottom: 6 }}>⚠️ New key — copy now, shown once:</div>
                  <code style={{ fontSize: 11, color: "#34d399", wordBreak: "break-all" }}>{newKeySecret}</code>
                  <button onClick={() => { navigator.clipboard.writeText(newKeySecret); }} style={{ marginTop: 8, width: "100%", padding: "6px", borderRadius: 6, background: "rgba(16,185,129,0.2)", color: "#10b981", border: "none", fontSize: 11, cursor: "pointer" }}>📋 Copy</button>
                </div>
              )}
              {keyStatuses.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: "#6b7280", fontSize: 13 }}>No API keys found. <button onClick={() => navigate("/apikeys")} style={{ color: "#818cf8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Create one</button></div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {keyStatuses.map(k => (
                    <div key={k.key_id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: `1px solid rgba(255,255,255,${k.status === "active" ? "0.05" : "0.1"})` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{k.name || k.key_preview}</div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{k.key_preview}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: `rgba(${statusColors[k.status].replace("#","").match(/.{2}/g).map(x=>parseInt(x,16)).join(",")},0.15)`, color: statusColors[k.status] }}>
                            {statusLabels[k.status]}
                          </span>
                          <button onClick={() => rotateKey(k.key_id)} disabled={rotatingKey === k.key_id} style={{ padding: "5px 10px", borderRadius: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                            {rotatingKey === k.key_id ? "..." : "🔄 Rotate"}
                          </button>
                        </div>
                      </div>
                      {k.days_until_expiry !== null && (
                        <div style={{ fontSize: 11, color: statusColors[k.status], marginTop: 6 }}>
                          {k.days_until_expiry < 0 ? `Expired ${Math.abs(k.days_until_expiry)} days ago` : `Expires in ${k.days_until_expiry} days`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Retention Tab */}
        {!loading && tab === "retention" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={card}>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>🗂 Retention Policy</h3>
              {[
                ["Test Results", "test_results_days", 7, 365],
                ["Audit Logs", "audit_logs_days", 30, 730],
                ["Notification Logs", "notification_logs_days", 7, 180],
              ].map(([name, key, min, max]) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <span style={lbl}>{name} (days)</span>
                  <input type="number" min={min} max={max} value={retentionPolicy[key]}
                    onChange={e => setRetentionPolicy(p => ({ ...p, [key]: parseInt(e.target.value) }))} style={input} />
                  <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>Range: {min}–{max} days</div>
                </div>
              ))}
              <button onClick={saveRetentionPolicy} disabled={saving === "retention"} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", marginBottom: 12 }}>
                {saving === "retention" ? "Saving..." : "Save Policy"}
              </button>
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>🧹 Manual Purge</h3>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Immediately delete all records older than your retention policy thresholds. This action is permanent and cannot be undone.</p>
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 20, marginBottom: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444", marginBottom: 8 }}>⚠️ Danger Zone</div>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>This will permanently delete old data based on your current retention settings.</p>
                <button onClick={purgeData} disabled={purging} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: purging ? "not-allowed" : "pointer" }}>
                  {purging ? "Purging..." : "🗑 Purge Old Data Now"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GDPR Tab */}
        {!loading && tab === "gdpr" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={card}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>📦 Data Export (Right of Access)</h3>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Download a complete JSON export of all personal data stored under your account. Includes test results, schedules, audit logs, and notification rules.</p>
              <button onClick={gdprExport} disabled={gdprExporting} style={{ width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", opacity: gdprExporting ? 0.7 : 1 }}>
                {gdprExporting ? "Preparing Export..." : "⬇ Export My Data"}
              </button>
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#ef4444" }}>🗑 Delete Account (Right to Erasure)</h3>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Permanently delete your account and all associated data. This action is irreversible — export your data first.</p>
              <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 20 }}>
                <span style={lbl}>Type "DELETE_MY_ACCOUNT" to confirm</span>
                <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE_MY_ACCOUNT" style={{ ...input, marginBottom: 14, borderColor: deleteConfirm === "DELETE_MY_ACCOUNT" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }} />
                <button onClick={deleteAccount} disabled={deleteConfirm !== "DELETE_MY_ACCOUNT" || deleting} style={{ width: "100%", padding: "11px", borderRadius: 10, background: deleteConfirm === "DELETE_MY_ACCOUNT" ? "rgba(239,68,68,0.8)" : "rgba(239,68,68,0.2)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: deleteConfirm !== "DELETE_MY_ACCOUNT" ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? "Deleting..." : "🗑 Permanently Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
