import { useEffect, useState, useRef, Component } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine,
} from "recharts";

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ color: "#ef4444", padding: "24px", fontSize: 14, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <p>Chart failed: {this.state.error.message}</p>
        <code style={{ fontSize: 12, color: "#9ca3af" }}>npm install recharts</code>
      </div>
    );
    return this.props.children;
  }
}

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

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

// ── Custom dot — coloured by score value ───────────────────────────────────────
function ScoreDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const color = scoreColor(payload.score);
  return (
    <circle cx={cx} cy={cy} r={5} fill={color}
      stroke="#080b12" strokeWidth={2}
      style={{ filter: `drop-shadow(0 0 4px ${color}80)`, cursor: "pointer" }} />
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = scoreColor(d.score);
  return (
    <div style={{ background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
      <div style={{ color: "#6b7280", marginBottom: 4, fontSize: 11 }}>{d.date}</div>
      <div style={{ fontWeight: 900, fontSize: 26, color, letterSpacing: "-1px", lineHeight: 1 }}>{d.score}</div>
      <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600 }}>{scoreLabel(d.score)}</div>
      <div style={{ color: "#374151", fontSize: 10, marginTop: 4 }}>Click to view report</div>
    </div>
  );
}

export default function Trends() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [urls, setUrls]           = useState([]);
  const [selectedUrl, setSelectedUrl] = useState("");
  const [trend, setTrend]         = useState([]);
  const [loadingUrls, setLoadingUrls] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const chartContainerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(800);

  // Measure chart container width
  useEffect(() => {
    const measure = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth || 800);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Load URL list on mount
  useEffect(() => {
    authFetch(`${API}/history/urls`)
      .then(r => r.json())
      .then(d => {
        const list = d.urls || [];
        setUrls(list);
        if (list.length) setSelectedUrl(list[0].url);
      })
      .catch(() => {})
      .finally(() => setLoadingUrls(false));
  }, [authFetch]);

  // Load trend whenever selected URL changes
  useEffect(() => {
    if (!selectedUrl) { setTrend([]); return; }
    setLoadingTrend(true);
    authFetch(`${API}/history/trend?url=${encodeURIComponent(selectedUrl)}`)
      .then(r => r.json())
      .then(d => setTrend(d.trend || []))
      .catch(() => setTrend([]))
      .finally(() => setLoadingTrend(false));
  }, [selectedUrl, authFetch]);

  const latestScore = trend.at(-1)?.score ?? null;
  const firstScore  = trend.at(0)?.score  ?? null;
  const delta = trend.length > 1 && latestScore != null && firstScore != null
    ? latestScore - firstScore : null;

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" }} />
      </div>


      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Score Trends</h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Track your site's health score over time</p>
        </div>

        {/* URL picker */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>Select URL</label>
          {loadingUrls ? (
            <div style={{ color: "#4b5563", fontSize: 13 }}>Loading URLs…</div>
          ) : urls.length === 0 ? (
            <div style={{ color: "#4b5563", fontSize: 13 }}>
              No completed tests yet.{" "}
              <span onClick={() => navigate("/")} style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}>Run your first test →</span>
            </div>
          ) : (
            <select value={selectedUrl} onChange={e => setSelectedUrl(e.target.value)}
              style={{ background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, padding: "10px 14px", width: "100%", maxWidth: 600, cursor: "pointer", outline: "none" }}>
              {urls.map(u => (
                <option key={u.url} value={u.url}>
                  {u.url} · {u.test_count} test{u.test_count !== 1 ? "s" : ""} · last score {u.last_score ?? "N/A"}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Stats row */}
        {trend.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Latest Score", value: latestScore ?? "—", color: scoreColor(latestScore), sub: scoreLabel(latestScore) },
              { label: "Total Runs",   value: trend.length,       color: "#818cf8",                sub: "completed tests" },
              {
                label: "Overall Trend",
                value: delta == null ? "—" : delta > 0 ? `+${delta}` : `${delta}`,
                color: delta == null ? "#6b7280" : delta > 0 ? "#10b981" : delta < 0 ? "#ef4444" : "#6b7280",
                sub: delta == null ? "need 2+ runs" : delta > 0 ? "improving" : delta < 0 ? "declining" : "stable",
              },
            ].map(({ label, value, color, sub }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 22px" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 11, color: "#374151", marginTop: 3 }}>{sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Chart card */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 24px", marginBottom: 24, minHeight: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Health Score Over Time</div>
              <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>Click any point to view that report</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ color: "#10b981", label: "≥80" }, { color: "#f59e0b", label: "≥60" }, { color: "#ef4444", label: "<60" }].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 10, color: "#4b5563" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Loading spinner */}
          {loadingTrend && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            </div>
          )}

          {/* Not enough data */}
          {!loadingTrend && trend.length < 2 && selectedUrl && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4b5563" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📈</div>
              <p style={{ fontSize: 14, color: "#374151" }}>Need at least 2 completed tests to show a trend.</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>
                <span onClick={() => navigate("/schedules")} style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}>Set up scheduled tests →</span>{" "}
                to build up trend data automatically.
              </p>
            </div>
          )}

          {/* Chart — uses fixed-width LineChart to avoid ResponsiveContainer hook conflict */}
          {!loadingTrend && trend.length >= 2 && (
            <ErrorBoundary>
              <div ref={chartContainerRef} style={{ width: "100%", overflowX: "auto" }}>
                <LineChart
                  width={chartWidth}
                  height={280}
                  data={trend}
                  margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                  onClick={e => {
                    const id = e?.activePayload?.[0]?.payload?.test_id;
                    if (id) navigate(`/result/${id}`);
                  }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fill: "#4b5563", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(99,102,241,0.25)", strokeWidth: 1 }} />
                  <ReferenceLine y={80} stroke="rgba(16,185,129,0.15)" strokeDasharray="4 4" label={{ value: "80", fill: "#10b981", fontSize: 10, position: "right" }} />
                  <ReferenceLine y={60} stroke="rgba(245,158,11,0.15)" strokeDasharray="4 4" label={{ value: "60", fill: "#f59e0b", fontSize: 10, position: "right" }} />
                  <Line
                    type="monotone" dataKey="score"
                    stroke="#6366f1" strokeWidth={2.5}
                    dot={<ScoreDot />}
                    activeDot={{ r: 7, fill: "#6366f1", stroke: "#080b12", strokeWidth: 2 }}
                    style={{ cursor: "pointer" }}
                  />
                </LineChart>
              </div>
            </ErrorBoundary>
          )}
        </div>

        {/* Run history list */}
        {trend.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Run History</h3>
              <span style={{ fontSize: 12, color: "#374151" }}>{trend.length} run{trend.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...trend].reverse().map((t, i) => {
                const color = scoreColor(t.score);
                const prev  = [...trend].reverse()[i - 1];
                const d     = prev ? t.score - prev.score : null;
                return (
                  <div key={t.test_id}
                    onClick={() => navigate(`/result/${t.test_id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 18px", cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color, minWidth: 44, letterSpacing: "-1px", lineHeight: 1 }}>{t.score}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>{scoreLabel(t.score)}</div>
                      <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>{t.date}</div>
                    </div>
                    {d != null && d !== 0 && (
                      <div style={{ padding: "3px 10px", borderRadius: 20, background: d > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: d > 0 ? "#10b981" : "#ef4444", fontSize: 12, fontWeight: 700 }}>
                        {d > 0 ? `+${d}` : d}
                      </div>
                    )}
                    <span style={{ color: "#374151", fontSize: 16 }}>›</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}