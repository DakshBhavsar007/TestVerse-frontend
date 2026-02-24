/**
 * src/pages/Share.jsx
 * Phase 3 — Public share page. No auth, no navbar.
 * Accessed via /share/:token
 * Matches the design system from History.jsx / Result.jsx exactly.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// ── Helpers (mirrors Result.jsx) ───────────────────────────────────────────────
const scoreColor = (s) => {
  if (s == null) return "#6b7280";
  if (s >= 80) return "#10b981";
  if (s >= 60) return "#f59e0b";
  if (s >= 40) return "#f97316";
  return "#ef4444";
};
const scoreLabel = (s) => {
  if (s == null) return "—";
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Poor";
};

// ── Score ring (matches Result.jsx's OverallScoreRing) ─────────────────────────
function ScoreRing({ score }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const pct = score != null ? score / 100 : 0;
  const color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: 180, height: 180 }}>
      <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${color}60)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 42, fontWeight: 900, color, letterSpacing: "-2px", lineHeight: 1 }}>{score ?? "—"}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>/ 100</div>
        <div style={{ fontSize: 13, color, fontWeight: 700, marginTop: 6 }}>{scoreLabel(score)}</div>
      </div>
    </div>
  );
}

// ── Category bar ───────────────────────────────────────────────────────────────
function CategoryBar({ label, score, icon }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{score ?? "—"}</span>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${score ?? 0}%`, background: color, borderRadius: 2, transition: "width 1s ease", boxShadow: `0 0 6px ${color}60` }} />
        </div>
      </div>
    </div>
  );
}

// ── Check row ──────────────────────────────────────────────────────────────────
function CheckRow({ label, data }) {
  if (!data || typeof data !== "object") return null;
  const score = data.score ?? (data.valid === true ? 100 : data.valid === false ? 0 : null);
  const status = data.status ?? "—";
  const msg = data.message || data.error || "";
  const color = scoreColor(score);
  const statusColors = {
    pass:    { text: "#10b981", bg: "rgba(16,185,129,0.1)"  },
    warning: { text: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
    fail:    { text: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
    error:   { text: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  };
  const sc = statusColors[status] || { text: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
      <div style={{ minWidth: 140, fontSize: 13, fontWeight: 600, color: "#c7d2fe" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: sc.bg }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: sc.text }}>{status.toUpperCase()}</span>
      </div>
      {score != null && (
        <div style={{ fontSize: 13, fontWeight: 700, color, minWidth: 32 }}>{score}</div>
      )}
      {msg && <div style={{ fontSize: 12, color: "#6b7280", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</div>}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "28px 0 12px" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" }}>{title}</h2>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Share() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API}/share/${token}`)
      .then(r => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setResult)
      .catch(() => setError("This report link is invalid or has expired."));
  }, [token]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const score = result?.overall_score;

  const categories = [
    { key: "speed",            label: "Speed",           icon: "⚡" },
    { key: "ssl",              label: "SSL",             icon: "🔒" },
    { key: "seo",              label: "SEO",             icon: "🔍" },
    { key: "accessibility",    label: "Accessibility",   icon: "♿" },
    { key: "security_headers", label: "Security Headers",icon: "🛡️" },
  ];

  const extractScore = (data) => {
    if (!data || typeof data !== "object") return null;
    if (data.score != null) return data.score;
    if (data.valid === true) return 100;
    if (data.valid === false) return 0;
    if (data.status === "pass") return 90;
    if (data.status === "warning") return 60;
    if (data.status === "fail") return 20;
    return null;
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!result && !error) return (
    <div style={{ minHeight: "100vh", background: "#080b12", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Inter',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#4b5563", fontSize: 14 }}>Loading report…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: "100vh", background: "#080b12", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Inter',sans-serif" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔗</div>
        <h2 style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 8 }}>Report not found</h2>
        <p style={{ color: "#6b7280", fontSize: 14 }}>{error}</p>
        <a href="/" style={{ display: "inline-block", marginTop: 20, padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
          Go to TestVerse →
        </a>
      </div>
    </div>
  );

  // ── Report ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -200, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)" }} />
      </div>

      {/* Minimal header — NO navbar/auth links */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>TestVerse</span>
          <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontWeight: 600 }}>Public Report</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={copyLink} style={{ padding: "6px 14px", borderRadius: 8, background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`, color: copied ? "#10b981" : "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
            {copied ? "✓ Copied!" : "🔗 Copy Link"}
          </button>
          <a href={`${API}/reports/${result.test_id}/pdf`} target="_blank" rel="noreferrer"
            style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            📄 Export PDF
          </a>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* URL + date */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", margin: 0, wordBreak: "break-all", background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {result.url}
          </h1>
          <p style={{ color: "#4b5563", fontSize: 13, margin: "6px 0 0" }}>
            Tested {result.started_at ? new Date(result.started_at).toLocaleString() : ""}
          </p>
        </div>

        {/* Score hero */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "32px", marginBottom: 24, display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap" }}>
          <ScoreRing score={score} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Overall Health Score</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor(score), marginBottom: 16 }}>
              {scoreLabel(score)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {categories.map(({ key, label, icon }) => (
                <CategoryBar key={key} label={label} icon={icon} score={extractScore(result[key])} />
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        {result.summary && (
          <div style={{ padding: "16px 20px", background: "rgba(99,102,241,0.06)", borderLeft: "3px solid #6366f1", borderRadius: "0 10px 10px 0", marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#c7d2fe", lineHeight: 1.7 }}>{result.summary}</p>
          </div>
        )}

        {/* Check sections */}
        <SectionHeader title="Performance & Speed" icon="⚡" />
        <CheckRow label="Speed" data={result.speed} />
        <CheckRow label="Core Web Vitals" data={result.core_web_vitals} />

        <SectionHeader title="Security" icon="🛡️" />
        <CheckRow label="SSL Certificate" data={result.ssl} />
        <CheckRow label="Security Headers" data={result.security_headers} />
        <CheckRow label="Cookies / GDPR" data={result.cookies_gdpr} />

        <SectionHeader title="SEO & Accessibility" icon="🔍" />
        <CheckRow label="SEO" data={result.seo} />
        <CheckRow label="Accessibility" data={result.accessibility} />

        <SectionHeader title="Code Quality" icon="🔧" />
        <CheckRow label="HTML Validation" data={result.html_validation} />
        <CheckRow label="Content Quality" data={result.content_quality} />
        <CheckRow label="PWA" data={result.pwa} />
        <CheckRow label="Functionality" data={result.functionality} />

        <SectionHeader title="Diagnostics" icon="🔬" />
        <CheckRow label="Broken Links" data={result.broken_links} />
        <CheckRow label="JS Errors" data={result.js_errors} />
        <CheckRow label="Images" data={result.images} />
        <CheckRow label="Mobile" data={result.mobile} />

        {/* AI Recommendations */}
        {result.ai_recommendations?.length > 0 && (
          <>
            <SectionHeader title="AI Recommendations" icon="🤖" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.ai_recommendations.map((rec, i) => (
                <div key={i} style={{ display: "flex", gap: 12, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: "13px 16px" }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
                  <p style={{ margin: 0, fontSize: 13, color: "#c7d2fe", lineHeight: 1.6 }}>{rec}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer CTA */}
        <div style={{ marginTop: 48, textAlign: "center", paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "#374151", fontSize: 13, marginBottom: 12 }}>Want to test your own website?</p>
          <a href="/" style={{ display: "inline-block", padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>
            Try TestVerse free →
          </a>
          <p style={{ color: "#1f2937", fontSize: 11, marginTop: 16 }}>Generated by TestVerse · testverse.app</p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
