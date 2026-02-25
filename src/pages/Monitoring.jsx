import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";


const STATUS_META = {
  up:       { color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  icon: "🟢" },
  down:     { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   icon: "🔴" },
  degraded: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  icon: "🟡" },
  unknown:  { color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)",  icon: "⚪" },
};

const STAT_CARDS = [
  { key: "total_monitors", label: "Total Monitors", icon: "📡", color: "#6366f1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)" },
  { key: "monitors_up",    label: "Monitors Up",    icon: "🟢", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)" },
  { key: "monitors_down",  label: "Monitors Down",  icon: "🔴", color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)" },
  { key: "open_incidents", label: "Open Incidents", icon: "⚠️", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
];

const BLANK_FORM = { name: "", url: "", interval_minutes: 5, response_time_threshold_ms: 3000, uptime_threshold_percent: 99.9 };

export default function Monitoring() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [monitors, setMonitors]     = useState([]);
  const [dashboard, setDashboard]   = useState(null);
  const [selected, setSelected]     = useState(null);
  const [history, setHistory]       = useState([]);
  const [incidents, setIncidents]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(BLANK_FORM);
  const [saving, setSaving]         = useState(false);
  const [checking, setChecking]     = useState(null);
  const [error, setError]           = useState("");

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = async () => {
    try {
      const [dash, mons] = await Promise.all([
        authFetch(`${API}/monitoring/dashboard`).then(r => r.json()),
        authFetch(`${API}/monitoring/monitors`).then(r => r.json()),
      ]);
      setDashboard(dash.dashboard);
      setMonitors(mons.monitors || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [authFetch]);

  const selectMonitor = async (mon) => {
    setSelected(mon);
    try {
      const [hist, inc] = await Promise.all([
        authFetch(`${API}/monitoring/monitors/${mon.monitor_id}/history?hours=24`).then(r => r.json()),
        authFetch(`${API}/monitoring/monitors/${mon.monitor_id}/incidents`).then(r => r.json()),
      ]);
      setHistory(hist.checks || []);
      setIncidents(inc.incidents || []);
    } catch (e) { setError(e.message); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const r = await authFetch(`${API}/monitoring/monitors`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Failed");
      setShowCreate(false); setForm(BLANK_FORM); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleCheck = async (monitorId) => {
    setChecking(monitorId);
    try {
      await authFetch(`${API}/monitoring/monitors/${monitorId}/check`, { method: "POST" });
      await load();
      if (selected?.monitor_id === monitorId) await selectMonitor(selected);
    } catch (e) { setError(e.message); }
    finally { setChecking(null); }
  };

  const maxRt = history.length ? Math.max(...history.map(c => c.response_time_ms || 0), 1) : 1;

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: "50%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)", transform: "translateX(-50%)" }} />
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              📡 Performance Monitoring
            </h1>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Real-time uptime tracking and SLA reporting</p>
          </div>
          <button onClick={() => setShowCreate(p => !p)}
            style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            {showCreate ? "✕ Cancel" : "+ New Monitor"}
          </button>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

        {/* Stats */}
        {dashboard && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {STAT_CARDS.map(({ key, label, icon, color, bg, border }) => (
              <div key={key} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{icon} {label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color }}>{dashboard[key] ?? "—"}</div>
              </div>
            ))}
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: "24px", marginBottom: 24, animation: "fadeIn 0.2s ease" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 }}>Create Monitor</div>
            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>Monitor Name *</label>
                  <input required value={form.name} onChange={e => f("name", e.target.value)} placeholder="Production API"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>URL *</label>
                  <input required type="url" value={form.url} onChange={e => f("url", e.target.value)} placeholder="https://api.example.com"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                {[
                  { key: "interval_minutes",            label: "Check Interval (min)", min: 1, max: 1440, step: 1 },
                  { key: "response_time_threshold_ms",  label: "Response Threshold (ms)", min: 100, step: 100 },
                  { key: "uptime_threshold_percent",    label: "Uptime Target (%)", min: 0, max: 100, step: 0.1 },
                ].map(({ key, label, ...rest }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>{label}</label>
                    <input type="number" value={form[key]} onChange={e => f(key, parseFloat(e.target.value))} {...rest}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={saving}
                  style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creating…" : "Create Monitor"}
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

          {/* Monitors grid */}
          {monitors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#374151" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
              <p style={{ fontSize: 14 }}>No monitors yet. Create your first one above.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {monitors.map(mon => {
                const meta = STATUS_META[mon.current_status] || STATUS_META.unknown;
                const isSel = selected?.monitor_id === mon.monitor_id;
                return (
                  <div key={mon.monitor_id} onClick={() => selectMonitor(mon)}
                    style={{ background: meta.bg, border: `1px solid ${isSel ? meta.color : meta.border}`, borderRadius: 16, padding: "20px 22px", cursor: "pointer", transition: "all 0.15s", transform: isSel ? "scale(1.01)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 18 }}>{meta.icon}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{mon.name}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{mon.url}</div>
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleCheck(mon.monitor_id); }} disabled={checking === mon.monitor_id}
                        title="Run health check now"
                        style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#9ca3af", fontSize: 12, cursor: checking === mon.monitor_id ? "not-allowed" : "pointer", opacity: checking === mon.monitor_id ? 0.5 : 1, flexShrink: 0 }}>
                        {checking === mon.monitor_id ? "…" : "▶ Check"}
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>STATUS</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: meta.color, textTransform: "capitalize" }}>{mon.current_status || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>24H UPTIME</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{mon.uptime_24h != null ? `${mon.uptime_24h.toFixed(2)}%` : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>AVG RESPONSE</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{mon.avg_response_24h != null ? `${mon.avg_response_24h.toFixed(0)}ms` : "—"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected monitor detail */}
          {selected && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px", animation: "fadeIn 0.2s ease" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 }}>📊 {selected.name} — 24h History</div>

              {/* Response time chart */}
              {history.length > 0 ? (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>Response Time (last 48 checks)</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" }}>
                    {history.slice(0, 48).reverse().map((check, idx) => {
                      const h = check.response_time_ms ? Math.max(4, (check.response_time_ms / maxRt) * 60) : 4;
                      const color = { up: "#10b981", degraded: "#f59e0b", down: "#ef4444" }[check.status] || "#374151";
                      return (
                        <div key={idx} style={{ flex: 1, background: color, borderRadius: "3px 3px 0 0", height: h, transition: "height 0.3s", opacity: 0.9 }}
                          title={`${check.response_time_ms?.toFixed(0) ?? "—"}ms — ${check.status}`} />
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                    {[["🟢", "#10b981", "Up"], ["🟡", "#f59e0b", "Degraded"], ["🔴", "#ef4444", "Down"]].map(([icon, color, label]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} /> {label}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color: "#374151", fontSize: 13, marginBottom: 24 }}>No check history yet — run a check to start collecting data.</div>
              )}

              {/* Incidents */}
              {incidents.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12 }}>RECENT INCIDENTS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {incidents.slice(0, 5).map(inc => (
                      <div key={inc.incident_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 16px" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{inc.title}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            {new Date(inc.started_at).toLocaleString()}
                            {inc.duration_minutes ? ` · ${inc.duration_minutes}m` : ""}
                          </div>
                        </div>
                        <div style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: inc.status === "resolved" ? "rgba(16,185,129,0.1)" : inc.status === "acknowledged" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                          color:      inc.status === "resolved" ? "#10b981"              : inc.status === "acknowledged" ? "#f59e0b"              : "#ef4444",
                          border:     `1px solid ${inc.status === "resolved" ? "rgba(16,185,129,0.25)" : inc.status === "acknowledged" ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)"}`,
                        }}>
                          {inc.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </>)}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
