import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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

const CHECK_KEYS = [
  "speed", "ssl", "security_headers", "seo", "accessibility",
  "core_web_vitals", "html_validation", "content_quality",
  "cookies_gdpr", "pwa", "functionality", "broken_links",
  "js_errors", "images", "mobile",
];
const CHECK_LABELS = {
  speed: "Speed", ssl: "SSL", security_headers: "Security Headers",
  seo: "SEO", accessibility: "Accessibility", core_web_vitals: "Core Web Vitals",
  html_validation: "HTML Validation", content_quality: "Content Quality",
  cookies_gdpr: "Cookies / GDPR", pwa: "PWA", functionality: "Functionality",
  broken_links: "Broken Links", js_errors: "JS Errors",
  images: "Images", mobile: "Mobile",
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

function DeltaBadge({ delta }) {
  if (delta == null || delta === 0) return <span style={{ color: "#374151", fontSize: 12, fontWeight: 600 }}>—</span>;
  const color = delta > 0 ? "#10b981" : "#ef4444";
  const bg    = delta > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)";
  const border = delta > 0 ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(239,68,68,0.25)";
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, background: bg, border, color, fontSize: 12, fontWeight: 700 }}>
      {delta > 0 ? `+${delta}` : delta}
    </span>
  );
}

function ResultPicker({ label, value, onChange, results }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, padding: "10px 12px", outline: "none", cursor: "pointer" }}>
        <option value="">— Select a test —</option>
        {results.map(r => (
          <option key={r.test_id} value={r.test_id}>
            {(r.url || "").slice(0, 45)} · {r.overall_score ?? "N/A"} · {(r.started_at || "").slice(0, 10)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Diff() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [results,  setResults]  = useState([]);
  const [idA,      setIdA]      = useState(searchParams.get("a") || "");
  const [idB,      setIdB]      = useState(searchParams.get("b") || "");
  const [resultA,  setResultA]  = useState(null);
  const [resultB,  setResultB]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  // Load all completed tests for picker
  useEffect(() => {
    authFetch(`${API}/history`)
      .then(r => r.json())
      .then(d => setResults((d.results || []).filter(r => r.status === "completed")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authFetch]);

  // Fetch result A
  useEffect(() => {
    if (!idA) { setResultA(null); return; }
    authFetch(`${API}/test/${idA}`).then(r => r.json()).then(setResultA).catch(() => setResultA(null));
  }, [idA, authFetch]);

  // Fetch result B
  useEffect(() => {
    if (!idB) { setResultB(null); return; }
    authFetch(`${API}/test/${idB}`).then(r => r.json()).then(setResultB).catch(() => setResultB(null));
  }, [idB, authFetch]);

  // Summary: which checks improved / regressed by >5 pts
  const improved  = resultA && resultB ? CHECK_KEYS.filter(k => { const a = extractScore(resultA[k]), b = extractScore(resultB[k]); return a != null && b != null && b > a + 5; }) : [];
  const regressed = resultA && resultB ? CHECK_KEYS.filter(k => { const a = extractScore(resultA[k]), b = extractScore(resultB[k]); return a != null && b != null && b < a - 5; }) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -200, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)" }} />
      </div>


      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Diff View</h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Compare two test results side-by-side — deltas highlighted in red/green</p>
        </div>

        {/* Pickers */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#4b5563" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ fontSize: 14, color: "#374151" }}>No completed tests yet.</p>
            <button onClick={() => navigate("/")} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Run First Test →</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 32, alignItems: "flex-end", flexWrap: "wrap" }}>
              <ResultPicker label="Test A — Baseline" value={idA} onChange={setIdA} results={results} />
              <div style={{ paddingBottom: 14, color: "#374151", fontSize: 22, flexShrink: 0 }}>⇄</div>
              <ResultPicker label="Test B — Compare" value={idB} onChange={setIdB} results={results} />
            </div>

            {/* Overall score hero */}
            {resultA && resultB && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 16, marginBottom: 20, alignItems: "stretch" }}>
                  {/* Test A */}
                  {[{ r: resultA, label: "TEST A" }, { r: resultB, label: "TEST B" }].map(({ r, label }, i) => {
                    const color = scoreColor(r.overall_score);
                    const card = (
                      <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 32px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>{label}</div>
                        <div style={{ fontSize: 64, fontWeight: 900, color, letterSpacing: "-3px", lineHeight: 1 }}>{r.overall_score ?? "—"}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color, marginTop: 8 }}>{scoreLabel(r.overall_score)}</div>
                        <div style={{ fontSize: 12, color: "#4b5563", marginTop: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.url}</div>
                        <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>{(r.started_at || "").slice(0, 16).replace("T", " ")}</div>
                        <button onClick={() => navigate(`/result/${r.test_id}`)}
                          style={{ marginTop: 14, padding: "7px 16px", borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          View Report →
                        </button>
                      </div>
                    );
                    if (i === 0) return card;
                    // For Test B, insert delta column in between
                    return (
                      <>
                        {/* Delta column — middle */}
                        <div key="delta" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <DeltaBadge delta={
                            resultA.overall_score != null && resultB.overall_score != null
                              ? resultB.overall_score - resultA.overall_score : null
                          } />
                          <div style={{ fontSize: 10, color: "#374151", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>overall</div>
                        </div>
                        {card}
                      </>
                    );
                  })}
                </div>

                {/* Summary banners */}
                {(improved.length > 0 || regressed.length > 0) && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                    {improved.length > 0 && (
                      <div style={{ flex: 1, minWidth: 200, padding: "12px 16px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, fontSize: 13, color: "#6ee7b7" }}>
                        ✅ <strong>Improved:</strong> {improved.map(k => CHECK_LABELS[k]).join(", ")}
                      </div>
                    )}
                    {regressed.length > 0 && (
                      <div style={{ flex: 1, minWidth: 200, padding: "12px 16px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, fontSize: 13, color: "#fca5a5" }}>
                        ⚠️ <strong>Regressed:</strong> {regressed.map(k => CHECK_LABELS[k]).join(", ")}
                      </div>
                    )}
                    {improved.length === 0 && regressed.length === 0 && (
                      <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, fontSize: 13, color: "#6b7280" }}>
                        No significant changes between these two tests (&gt;5 pts).
                      </div>
                    )}
                  </div>
                )}

                {/* Per-check diff table */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 80px 1fr", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(99,102,241,0.08)" }}>
                    {["Check", "Test A", "Delta", "Test B"].map((h, i) => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? "#818cf8" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: i === 0 ? "left" : "center" }}>{h}</div>
                    ))}
                  </div>

                  {CHECK_KEYS.map((key, i) => {
                    const sA = extractScore(resultA[key]);
                    const sB = extractScore(resultB[key]);
                    const delta = sA != null && sB != null ? sB - sA : null;
                    const highlight = delta != null && Math.abs(delta) >= 10;

                    return (
                      <div key={key} style={{
                        display: "grid", gridTemplateColumns: "160px 1fr 80px 1fr",
                        padding: "13px 20px", alignItems: "center",
                        borderBottom: i < CHECK_KEYS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        background: highlight
                          ? delta > 0 ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)"
                          : i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                        transition: "background 0.15s",
                      }}>
                        {/* Check name */}
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af" }}>{CHECK_LABELS[key]}</div>

                        {/* Score A */}
                        <div style={{ textAlign: "center" }}>
                          {sA != null ? (
                            <span>
                              <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(sA) }}>{sA}</span>
                              {resultA[key]?.status && <span style={{ fontSize: 10, color: "#4b5563", marginLeft: 5 }}>{resultA[key].status}</span>}
                            </span>
                          ) : <span style={{ color: "#374151", fontSize: 13 }}>—</span>}
                        </div>

                        {/* Delta */}
                        <div style={{ textAlign: "center" }}>
                          <DeltaBadge delta={delta} />
                        </div>

                        {/* Score B */}
                        <div style={{ textAlign: "center" }}>
                          {sB != null ? (
                            <span>
                              <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(sB) }}>{sB}</span>
                              {resultB[key]?.status && <span style={{ fontSize: 10, color: "#4b5563", marginLeft: 5 }}>{resultB[key].status}</span>}
                            </span>
                          ) : <span style={{ color: "#374151", fontSize: 13 }}>—</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Empty state — pickers shown but nothing selected */}
            {(!resultA || !resultB) && (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#4b5563" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>⇄</div>
                <p style={{ fontSize: 15, color: "#374151" }}>Select two completed tests above to compare them.</p>
                <p style={{ fontSize: 12, marginTop: 6 }}>Checks with &gt;10 point differences will be highlighted.</p>
              </div>
            )}
          </>
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