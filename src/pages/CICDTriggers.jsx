import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const SOURCE_META = {
  github:  { icon: "🐙", color: "#e2e8f0", label: "GitHub" },
  gitlab:  { icon: "🦊", color: "#f97316", label: "GitLab" },
  jira:    { icon: "🔷", color: "#3b82f6", label: "Jira" },
  postman: { icon: "📮", color: "#f59e0b", label: "Postman" },
  manual:  { icon: "🖐️", color: "#a78bfa", label: "Manual" },
};

const STATUS_META = {
  success: { icon: "✅", color: "#34d399", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)",  label: "Success" },
  failed:  { icon: "❌", color: "#f87171", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   label: "Failed" },
  running: { icon: "⏳", color: "#60a5fa", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)",  label: "Running" },
  pending: { icon: "🕐", color: "#9ca3af", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)",  label: "Pending" },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function duration(start, end) {
  const s = Math.floor(((end ? new Date(end) : new Date()) - new Date(start)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

const FILTERS = ["all", "github", "gitlab", "jira", "postman"];

export default function CICDTriggers() {
  const { authFetch } = useAuth();
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const r = await authFetch(`${API}/cicd/triggers`);
        if (r.ok) { const d = await r.json(); setTriggers(d.triggers || []); }
      } catch {} finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const filtered = filter === "all" ? triggers : triggers.filter(t => t.source === filter);

  // Summary counts
  const counts = triggers.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -100, left: "20%", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.05) 0%,transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔗</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.7px", background: "linear-gradient(135deg,#e2e8f0 0%,#94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>CI/CD Triggers</h1>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", animation: "pulse 2s ease-in-out infinite", display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Live</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#4b5563" }}>Monitor your automated test runs and deployments</p>
        </div>

        {/* Summary pills */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: triggers.length, color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
            { label: "Success", value: counts.success || 0, color: "#34d399", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
            { label: "Failed", value: counts.failed || 0, color: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
            { label: "Running", value: counts.running || 0, color: "#60a5fa", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: filter === f ? "rgba(99,102,241,0.22)" : "transparent",
              color: filter === f ? "#818cf8" : "#6b7280",
              fontSize: 12, fontWeight: 600, textTransform: "capitalize", transition: "all 0.15s",
            }}>
              {f === "all" ? "All" : (SOURCE_META[f]?.icon + " " + SOURCE_META[f]?.label)}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {/* List */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                <div style={{ color: "#4b5563", fontSize: 14 }}>Loading triggers...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
                <div style={{ color: "#4b5563", fontSize: 14 }}>{filter === "all" ? "No triggers yet. Push to a connected repo to get started." : `No ${filter} triggers found.`}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map(t => {
                  const src = SOURCE_META[t.source] || SOURCE_META.manual;
                  const st = STATUS_META[t.status] || STATUS_META.pending;
                  const isSelected = selected?.id === t.id;
                  return (
                    <div key={t.id} onClick={() => setSelected(isSelected ? null : t)} style={{
                      background: isSelected ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isSelected ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 14, padding: "16px 18px", cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                      onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                        {/* Source icon */}
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                          {src.icon}
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", textTransform: "capitalize" }}>
                              {src.label} · {t.event_type}
                            </span>
                            <span style={{ fontSize: 11, padding: "2px 8px", background: st.bg, border: `1px solid ${st.border}`, borderRadius: 999, color: st.color, fontWeight: 700 }}>
                              {st.icon} {st.label}
                            </span>
                            {t.status === "running" && <span style={{ fontSize: 11, color: "#60a5fa", animation: "pulse 1.5s ease-in-out infinite" }}>● running</span>}
                          </div>

                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                            {t.repository && <span style={{ fontSize: 12, color: "#6b7280" }}>📦 {t.repository}{t.branch && ` · 🌿 ${t.branch}`}</span>}
                            {t.commit && <span style={{ fontSize: 12, color: "#6b7280" }}>📝 <code style={{ color: "#a78bfa" }}>{t.commit.substring(0, 7)}</code>{t.author && ` by ${t.author}`}</span>}
                          </div>
                        </div>

                        {/* Time */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: "#4b5563" }}>{timeAgo(t.triggered_at)}</div>
                          {t.triggered_at && <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>{duration(t.triggered_at, t.completed_at)}</div>}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isSelected && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                          {[
                            { label: "Trigger ID", value: t.id },
                            { label: "Source", value: src.label },
                            { label: "Event", value: t.event_type },
                            { label: "Repository", value: t.repository || "—" },
                            { label: "Branch", value: t.branch || "—" },
                            { label: "Commit", value: t.commit ? t.commit.substring(0, 12) : "—" },
                            { label: "Author", value: t.author || "—" },
                            { label: "Tests Run", value: t.tests_run ?? "—" },
                            { label: "Tests Passed", value: t.tests_passed ?? "—" },
                            { label: "Duration", value: t.triggered_at ? duration(t.triggered_at, t.completed_at) : "—" },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
                              <div style={{ fontSize: 13, color: "#9ca3af", fontFamily: label.includes("ID") || label.includes("Commit") ? "monospace" : "inherit" }}>{String(value)}</div>
                            </div>
                          ))}
                          {t.commit_message && (
                            <div style={{ gridColumn: "1/-1" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Commit Message</div>
                              <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>{t.commit_message}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}
