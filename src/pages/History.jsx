import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const scoreColor = (s) => {
  if (s == null) return { text: "#6b7280", bg: "rgba(107,114,128,0.1)", label: "N/A" };
  if (s >= 80) return { text: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Excellent" };
  if (s >= 60) return { text: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Good" };
  if (s >= 40) return { text: "#f97316", bg: "rgba(249,115,22,0.1)", label: "Fair" };
  return { text: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Poor" };
};

const statusStyle = (s) => {
  if (s === "completed") return { text: "#10b981", bg: "rgba(16,185,129,0.12)", dot: "#10b981" };
  if (s === "running") return { text: "#3b82f6", bg: "rgba(59,130,246,0.12)", dot: "#3b82f6" };
  return { text: "#ef4444", bg: "rgba(239,68,68,0.12)", dot: "#ef4444" };
};

const ScoreRing = ({ score, size = 52 }) => {
  const c = scoreColor(score);
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = score != null ? score / 100 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={c.text} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
        style={{ transform: "rotate(90deg) translate(0,-48px)", fontSize: "11px", fontWeight: 700, fill: c.text, fontFamily: "inherit" }}>
        {score ?? "—"}
      </text>
    </svg>
  );
};

function RadarBars({ result }) {
  const checks = [
    { key: "speed", label: "Speed" },
    { key: "ssl", label: "SSL" },
    { key: "seo", label: "SEO" },
    { key: "accessibility", label: "A11y" },
    { key: "security_headers", label: "Security" },
  ];
  const getScore = (r, key) => {
    const d = r[key];
    if (!d) return null;
    if (d.score != null) return d.score;
    if (d.valid === true) return 100;
    if (d.valid === false) return 20;
    if (d.status === "pass") return 90;
    if (d.status === "warning") return 60;
    if (d.status === "fail") return 20;
    return null;
  };
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 28 }}>
      {checks.map(({ key, label }) => {
        const s = getScore(result, key);
        const h = s != null ? Math.max(4, (s / 100) * 24) : 4;
        const col = s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : s >= 40 ? "#f97316" : s != null ? "#ef4444" : "#374151";
        return (
          <div key={key} title={`${label}: ${s ?? "N/A"}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ width: 6, height: h, background: col, borderRadius: 2, transition: "height 0.5s ease" }} />
          </div>
        );
      })}
    </div>
  );
}

export default function History() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    authFetch(`${API}/history`)
      .then(r => r.json()).then(d => setResults(d.results || []))
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [authFetch]);

  const filtered = results.filter(r =>
    filter === "all" ? true : r.status === filter
  );

  const scoredResults = results.filter(r => r.overall_score != null && !isNaN(r.overall_score));
  const avgScore = scoredResults.length
    ? Math.round(scoredResults.reduce((a, r) => a + r.overall_score, 0) / scoredResults.length)
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans', 'Inter', sans-serif", color: "#e2e8f0" }}>
      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>TestVerse</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{user?.email}</span>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Dashboard</button>
          <button onClick={() => navigate("/schedules")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Schedules</button>
          <button onClick={() => navigate("/teams")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Teams</button>
          <button onClick={() => navigate("/slack")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Slack</button>
          <button onClick={() => navigate("/apikeys")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>API Keys</button>
          <button onClick={() => navigate("/bulk")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Bulk Test</button>
          <button onClick={() => navigate("/whitelabel")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Branding</button>
          <button onClick={() => navigate("/analytics")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Analytics</button>
          <button onClick={() => navigate("/roles")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Roles</button>
          <button onClick={() => navigate("/notifications")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Alerts</button>
          <button onClick={() => navigate("/templates")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Templates</button>
          <button onClick={() => navigate("/monitoring")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Monitors</button>
          <button onClick={() => navigate("/reporting")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Reporting</button>
          <button onClick={() => navigate("/billing")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Billing</button>
          <button onClick={() => navigate("/compliance")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Compliance</button>
          <button onClick={() => navigate("/devtools")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Dev Tools</button>
          <button onClick={() => navigate("/")} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>New Test</button>
          <button onClick={() => { logout(); navigate("/login"); }} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Test History</h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>All your website health checks in one place</p>
        </div>

        {/* Stats row */}
        {!loading && results.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Total Tests", value: results.length, icon: "🧪", color: "#6366f1" },
              { label: "Avg Score", value: avgScore != null ? `${avgScore}/100` : "—", icon: "📊", color: scoreColor(avgScore).text },
              { label: "Completed", value: results.filter(r => r.status === "completed").length, icon: "✅", color: "#10b981" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: "-0.5px" }}>{value}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {!loading && results.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["all", "completed", "running", "failed"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                  background: filter === f ? "rgba(99,102,241,0.2)" : "transparent",
                  border: filter === f ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  color: filter === f ? "#818cf8" : "#6b7280" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                  {f === "all" ? results.length : results.filter(r => r.status === f).length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#4b5563", fontSize: 14 }}>Loading your tests…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "14px 18px", color: "#f87171", fontSize: 14 }}>{error}</div>}

        {/* Empty state */}
        {!loading && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>No tests yet</h3>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "0 0 24px" }}>Run your first website health check to get started</p>
            <button onClick={() => navigate("/")} style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Run First Test →
            </button>
          </div>
        )}

        {/* Results list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((r, i) => {
            const sc = scoreColor(r.overall_score);
            const st = statusStyle(r.status);
            const isHovered = hoveredId === r.test_id;
            return (
              <div key={r.test_id}
                onClick={() => navigate(`/result/${r.test_id}`)}
                onMouseEnter={() => setHoveredId(r.test_id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: isHovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                  border: isHovered ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16, padding: "18px 22px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 16,
                  transition: "all 0.2s ease",
                  transform: isHovered ? "translateY(-1px)" : "none",
                  boxShadow: isHovered ? "0 8px 32px rgba(0,0,0,0.3)" : "none",
                  animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                }}>

                {/* Score ring */}
                <div style={{ flexShrink: 0 }}>
                  <ScoreRing score={r.overall_score} />
                </div>

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#e2e8f0" }}>{r.url}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <p style={{ fontSize: 12, color: "#4b5563", margin: 0 }}>
                      {r.started_at ? new Date(r.started_at).toLocaleString() : ""}
                    </p>
                    <RadarBars result={r} />
                  </div>
                </div>

                {/* Right side */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {r.overall_score != null && (
                    <div style={{ padding: "4px 10px", borderRadius: 20, background: sc.bg, color: sc.text, fontSize: 12, fontWeight: 700 }}>
                      {sc.label}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: st.bg }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, boxShadow: r.status === "running" ? `0 0 8px ${st.dot}` : "none" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: st.text }}>{r.status}</span>
                  </div>
                  <span style={{ color: "#374151", fontSize: 18 }}>›</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
}