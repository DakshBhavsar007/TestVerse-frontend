import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// ── Helpers ────────────────────────────────────────────────────────────────────
const scoreColor = (s) => {
  if (s == null) return "#6b7280";
  if (s >= 80) return "#10b981";
  if (s >= 60) return "#f59e0b";
  if (s >= 40) return "#f97316";
  return "#ef4444";
};
const scoreLabel = (s) => {
  if (s == null) return "N/A";
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Poor";
};

// ── Score Ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 100, strokeWidth = 8 }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score != null ? score / 100 : 0;
  const color = scoreColor(score);
  const cx = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color}80)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: size * 0.26, fontWeight: 900, color, letterSpacing: "-1px", lineHeight: 1 }}>
          {score ?? "—"}
        </div>
        <div style={{ fontSize: size * 0.1, color: "#6b7280", marginTop: 2, fontWeight: 500 }}>/ 100</div>
      </div>
    </div>
  );
}

// ── Mini chart bar ─────────────────────────────────────────────────────────────
function TimelineChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxTests = Math.max(...data.map(d => d.tests), 1);
  // Show only last 14 days for clean display
  const visible = data.slice(-14);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
        {visible.map((day, i) => {
          const h = day.tests > 0 ? Math.max(6, (day.tests / maxTests) * 56) : 4;
          const color = day.avg_score != null ? scoreColor(day.avg_score) : "rgba(255,255,255,0.1)";
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
              title={`${day.date}: ${day.tests} test(s)${day.avg_score != null ? `, avg ${day.avg_score}` : ""}`}>
              <div style={{
                width: "100%", height: h, background: color, borderRadius: "3px 3px 0 0",
                opacity: day.tests > 0 ? 1 : 0.3,
                transition: "height 0.5s ease",
                boxShadow: day.tests > 0 ? `0 0 6px ${color}60` : "none",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "#374151" }}>{visible[0]?.date?.slice(5)}</span>
        <span style={{ fontSize: 10, color: "#374151" }}>{visible[visible.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

// ── Score distribution donut ───────────────────────────────────────────────────
function DistributionBars({ dist }) {
  const bands = [
    { key: "excellent", label: "Excellent", color: "#10b981" },
    { key: "good",      label: "Good",      color: "#f59e0b" },
    { key: "fair",      label: "Fair",      color: "#f97316" },
    { key: "poor",      label: "Poor",      color: "#ef4444" },
  ];
  const total = Object.values(dist || {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {bands.map(({ key, label, color }) => {
        const count = dist?.[key] || 0;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>{count} ({pct}%)</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`, background: color,
                borderRadius: 3, transition: "width 1s ease",
                boxShadow: `0 0 6px ${color}60`,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = "#6366f1", sub }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: "20px 22px",
    }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: "-1px", lineHeight: 1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#374151", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── URL row ────────────────────────────────────────────────────────────────────
function URLRow({ url, count, score, onClick }) {
  const [hovered, setHovered] = useState(false);
  const color = scoreColor(score);
  const short = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", borderRadius: 12, cursor: "pointer",
        background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
        border: hovered ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
        transition: "all 0.15s ease",
      }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 14 }}>🌐</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{short}</div>
        <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>{count} test{count !== 1 ? "s" : ""}</div>
      </div>
      {score != null && (
        <div style={{ flexShrink: 0, padding: "3px 10px", borderRadius: 20, background: `${color}18`, color, fontSize: 12, fontWeight: 700 }}>
          {score}
        </div>
      )}
      <span style={{ color: "#374151", fontSize: 16 }}>›</span>
    </div>
  );
}

// ── Recent test row ────────────────────────────────────────────────────────────
function RecentRow({ test, onClick }) {
  const [hovered, setHovered] = useState(false);
  const color = scoreColor(test.overall_score);
  const short = (test.url || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const statusColor = test.status === "completed" ? "#10b981" : test.status === "running" ? "#6366f1" : "#ef4444";
  const ago = test.started_at ? (() => {
    const diff = Math.floor((Date.now() - new Date(test.started_at)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  })() : "";

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", borderRadius: 12, cursor: "pointer",
        background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
        border: hovered ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
        transition: "all 0.15s ease",
      }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0,
        boxShadow: test.status === "running" ? `0 0 8px ${statusColor}` : "none",
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#d1d5db", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{short}</div>
        <div style={{ fontSize: 11, color: "#374151", marginTop: 1 }}>{ago}</div>
      </div>
      {test.overall_score != null && (
        <div style={{ fontSize: 13, fontWeight: 800, color, flexShrink: 0 }}>{test.overall_score}</div>
      )}
      <span style={{ color: "#374151", fontSize: 16 }}>›</span>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch(`${API}/dashboard/stats`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [authFetch]);

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans', 'Inter', sans-serif", color: "#e2e8f0" }}>
      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -300, left: -100, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>TestVerse</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[
            { label: "New Test",   path: "/",             style: { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8" } },
            { label: "History",    path: "/history",       style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Schedules",  path: "/schedules",     style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Teams",      path: "/teams",         style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Slack",      path: "/slack",         style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "API Keys",   path: "/apikeys",       style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Bulk Test",  path: "/bulk",          style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Branding",   path: "/whitelabel",    style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Analytics",  path: "/analytics",     style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Roles",      path: "/roles",         style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Alerts",     path: "/notifications", style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Templates",  path: "/templates",     style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Monitors",   path: "/monitoring",    style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Reporting",  path: "/reporting",     style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Billing",    path: "/billing",       style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Compliance", path: "/compliance",    style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
            { label: "Dev Tools",  path: "/devtools",      style: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" } },
          ].map(({ label, path, style }) => (
            <button key={label} onClick={() => navigate(path)}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500, ...style }}>
              {label}
            </button>
          ))}
          <span style={{ fontSize: 13, color: "#4b5563", marginLeft: 4 }}>{user?.email}</span>
          <button onClick={() => { logout(); navigate("/login"); }}
            style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 20, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 8px #6366f1" }} />
            <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 600, letterSpacing: "0.5px" }}>LIVE DASHBOARD</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Your Testing Overview
          </h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>
            {stats ? `${stats.total} tests run across all your sites` : "Loading your data…"}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#4b5563", fontSize: 14 }}>Crunching your stats…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "14px 18px", color: "#f87171", fontSize: 14, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && stats?.total === 0 && (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🚀</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#374151", margin: "0 0 10px" }}>No tests yet</h3>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "0 0 28px" }}>Run your first website health check to see your dashboard come to life.</p>
            <button onClick={() => navigate("/")}
              style={{ padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Run Your First Test →
            </button>
          </div>
        )}

        {stats && stats.total > 0 && (
          <>
            {/* ── Top stat cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <StatCard icon="🧪" label="Total Tests" value={stats.total} color="#818cf8" />
              <StatCard icon="✅" label="Completed" value={stats.completed} color="#10b981"
                sub={stats.failed > 0 ? `${stats.failed} failed` : "All good!"} />
              <StatCard icon="📊" label="Avg Score" value={stats.avg_score != null ? `${stats.avg_score}` : "—"}
                color={scoreColor(stats.avg_score)}
                sub={stats.avg_score != null ? scoreLabel(stats.avg_score) : "No completed tests"} />
              <StatCard icon="🏃" label="Running" value={stats.running}
                color={stats.running > 0 ? "#6366f1" : "#374151"} />
            </div>

            {/* ── Middle row: avg score ring + timeline ── */}
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, marginBottom: 24 }}>

              {/* Average score ring */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Average Score</div>
                <ScoreRing score={stats.avg_score} size={110} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor(stats.avg_score) }}>{scoreLabel(stats.avg_score)}</div>
                  <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>across {stats.completed} completed test{stats.completed !== 1 ? "s" : ""}</div>
                </div>
              </div>

              {/* Timeline chart */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Tests Over Time</div>
                    <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>Last 14 days · bar color = avg score</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ color: "#10b981", label: "Good" }, { color: "#f59e0b", label: "Fair" }, { color: "#ef4444", label: "Poor" }].map(({ color, label }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                        <span style={{ fontSize: 10, color: "#4b5563" }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <TimelineChart data={stats.timeline} />
              </div>
            </div>

            {/* ── Bottom row: score distribution + top URLs + recent tests ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>

              {/* Score distribution */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Score Distribution</div>
                <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 18 }}>By health band</div>
                <DistributionBars dist={stats.score_distribution} />
              </div>

              {/* Top URLs */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Most Tested</div>
                <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 14 }}>Your top URLs</div>
                {stats.top_urls.length === 0 ? (
                  <div style={{ color: "#374151", fontSize: 13, textAlign: "center", paddingTop: 20 }}>No data yet</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {stats.top_urls.map((item) => (
                      <URLRow key={item.url} url={item.url} count={item.count}
                        score={item.latest_score}
                        onClick={() => navigate("/history")} />
                    ))}
                  </div>
                )}
              </div>

              {/* Recent tests */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Recent Tests</div>
                  <button onClick={() => navigate("/history")}
                    style={{ fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    View all →
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 14 }}>Latest activity</div>
                {stats.recent_tests.length === 0 ? (
                  <div style={{ color: "#374151", fontSize: 13, textAlign: "center", paddingTop: 20 }}>No tests yet</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {stats.recent_tests.map((t) => (
                      <RecentRow key={t.test_id} test={t}
                        onClick={() => navigate(`/result/${t.test_id}`)} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Best / Worst highlights ── */}
            {(stats.best || stats.worst) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {stats.best && (
                  <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontSize: 28 }}>🏆</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Best Scoring Site</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {stats.best.url.replace(/^https?:\/\//, "")}
                      </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#10b981", letterSpacing: "-1px" }}>{stats.best.score}</div>
                  </div>
                )}
                {stats.worst && (
                  <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 16, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontSize: 28 }}>⚠️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Needs Most Attention</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {stats.worst.url.replace(/^https?:\/\//, "")}
                      </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#ef4444", letterSpacing: "-1px" }}>{stats.worst.score}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}