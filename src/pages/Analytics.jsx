import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";


const CHECK_KEYS = ["speed", "ssl", "seo", "accessibility", "security_headers", "core_web_vitals"];
const CHECK_LABELS = { speed: "Speed", ssl: "SSL", seo: "SEO", accessibility: "A11y", security_headers: "Security", core_web_vitals: "CWV" };
const CHECK_COLORS = { speed: "#6366f1", ssl: "#10b981", seo: "#f59e0b", accessibility: "#3b82f6", security_headers: "#ef4444", core_web_vitals: "#8b5cf6" };

const scoreColor = (s) => {
  if (s == null) return "#1f2937";
  if (s >= 80) return "rgba(16,185,129,0.7)";
  if (s >= 60) return "rgba(245,158,11,0.7)";
  if (s >= 40) return "rgba(249,115,22,0.7)";
  return "rgba(239,68,68,0.7)";
};

function extractScore(data) {
  if (!data || typeof data !== "object") return null;
  if (data.score != null) return data.score;
  if (data.valid === true) return 100;
  if (data.valid === false) return 0;
  if (data.status === "pass") return 90;
  if (data.status === "warning") return 60;
  if (data.status === "fail") return 20;
  return null;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "#6b7280", marginBottom: 6, fontSize: 11 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 700, marginBottom: 2 }}>
          {CHECK_LABELS[p.dataKey] || p.dataKey}: {p.value ?? "—"}
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selectedUrl, setSelectedUrl] = useState("all");
  const chartRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(700);

  useEffect(() => {
    const measure = () => { if (chartRef.current) setChartWidth(chartRef.current.offsetWidth || 700); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    authFetch(`${API}/history?limit=100`)
      .then(r => r.json())
      .then(d => setResults((d.results || []).filter(r => r.status === "completed")))
      .catch(() => {}).finally(() => setLoading(false));
  }, [authFetch]);

  const urls = [...new Set(results.map(r => r.url).filter(Boolean))];

  const filtered = selectedUrl === "all"
    ? results : results.filter(r => r.url === selectedUrl);

  // Build chart data — one point per test, sorted by date
  const chartData = [...filtered]
    .sort((a, b) => (a.started_at || "") < (b.started_at || "") ? -1 : 1)
    .slice(-30)
    .map(r => {
      const pt = { date: (r.started_at || "").slice(5, 16).replace("T", " ") };
      for (const key of CHECK_KEYS) {
        pt[key] = extractScore(r[key]);
      }
      pt.overall = r.overall_score;
      return pt;
    });

  // Heatmap: rows = checks, cols = last 20 tests
  const heatmapTests = [...filtered]
    .sort((a, b) => (a.started_at || "") < (b.started_at || "") ? -1 : 1)
    .slice(-20);

  // Per-check averages
  const checkAvgs = CHECK_KEYS.map(key => {
    const scores = filtered.map(r => extractScore(r[key])).filter(s => s != null);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const trend = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : null;
    return { key, avg, trend, scores };
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Analytics</h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Per-check score trends and heatmap across all your tests</p>
        </div>

        {/* URL filter */}
        <div style={{ marginBottom: 24 }}>
          <select value={selectedUrl} onChange={e => setSelectedUrl(e.target.value)}
            style={{ background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, padding: "9px 14px", outline: "none", cursor: "pointer", minWidth: 280 }}>
            <option value="all">All URLs ({results.length} tests)</option>
            {urls.map(u => (
              <option key={u} value={u}>{u.replace(/^https?:\/\//, "").slice(0, 55)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#374151" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📊</div>
            <p>No completed tests yet. Run some tests to see analytics.</p>
          </div>
        ) : (
          <>
            {/* Per-check stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {checkAvgs.map(({ key, avg, trend }) => {
                const color = CHECK_COLORS[key];
                return (
                  <div key={key} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{CHECK_LABELS[key]}</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: avg != null ? color : "#374151", letterSpacing: "-1px", lineHeight: 1 }}>
                      {avg ?? "—"}
                    </div>
                    {trend != null && (
                      <div style={{ fontSize: 11, marginTop: 6, color: trend > 0 ? "#10b981" : trend < 0 ? "#ef4444" : "#6b7280", fontWeight: 600 }}>
                        {trend > 0 ? `▲ +${trend}` : trend < 0 ? `▼ ${trend}` : "→ stable"} over {filtered.length} runs
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Multi-line trend chart */}
            {chartData.length >= 2 && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px", marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Per-Check Score Trends</div>
                <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 18 }}>Last {chartData.length} tests — click legend to toggle lines</div>
                <div ref={chartRef} style={{ width: "100%", overflowX: "auto" }}>
                  <LineChart width={chartWidth} height={280} data={chartData} margin={{ top: 8, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} tick={{ fill: "#4b5563", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280", paddingTop: 12 }} />
                    {CHECK_KEYS.map(key => (
                      <Line key={key} type="monotone" dataKey={key} name={CHECK_LABELS[key]}
                        stroke={CHECK_COLORS[key]} strokeWidth={2}
                        dot={false} activeDot={{ r: 4 }} connectNulls />
                    ))}
                  </LineChart>
                </div>
              </div>
            )}

            {/* Heatmap */}
            {heatmapTests.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px", marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Score Heatmap</div>
                <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 18 }}>Last {heatmapTests.length} tests — green = high, red = low</div>

                <div style={{ overflowX: "auto" }}>
                  {/* Column headers = dates */}
                  <div style={{ display: "flex", marginLeft: 90, marginBottom: 6, gap: 3 }}>
                    {heatmapTests.map((r, i) => (
                      <div key={i} style={{ width: 36, fontSize: 9, color: "#374151", textAlign: "center", transform: "rotate(-40deg)", transformOrigin: "bottom left", whiteSpace: "nowrap" }}>
                        {(r.started_at || "").slice(5, 10)}
                      </div>
                    ))}
                  </div>

                  {/* Rows = checks */}
                  {CHECK_KEYS.map(key => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
                      <div style={{ width: 84, fontSize: 11, color: "#6b7280", fontWeight: 600, flexShrink: 0, textAlign: "right", paddingRight: 8 }}>
                        {CHECK_LABELS[key]}
                      </div>
                      {heatmapTests.map((r, i) => {
                        const s = extractScore(r[key]);
                        return (
                          <div key={i} title={`${CHECK_LABELS[key]}: ${s ?? "N/A"} — ${(r.started_at || "").slice(0, 10)}`}
                            onClick={() => navigate(`/result/${r.test_id}`)}
                            style={{ width: 36, height: 24, borderRadius: 4, background: scoreColor(s), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: s != null ? "rgba(255,255,255,0.9)" : "#374151" }}>{s ?? "—"}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Overall row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: 84, fontSize: 11, color: "#818cf8", fontWeight: 700, flexShrink: 0, textAlign: "right", paddingRight: 8 }}>Overall</div>
                    {heatmapTests.map((r, i) => {
                      const s = r.overall_score;
                      return (
                        <div key={i} onClick={() => navigate(`/result/${r.test_id}`)}
                          style={{ width: 36, height: 24, borderRadius: 4, background: scoreColor(s), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: s != null ? "rgba(255,255,255,0.9)" : "#374151" }}>{s ?? "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 11, color: "#4b5563" }}>
                  <span>Score:</span>
                  {[["≥80", "rgba(16,185,129,0.7)"], ["≥60", "rgba(245,158,11,0.7)"], ["≥40", "rgba(249,115,22,0.7)"], ["<40", "rgba(239,68,68,0.7)"], ["N/A", "#1f2937"]].map(([label, bg]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: bg }} />
                      <span>{label}</span>
                    </div>
                  ))}
                  <span style={{ marginLeft: 8, color: "#374151" }}>· Click any cell to view full report</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
