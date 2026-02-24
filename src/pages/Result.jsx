import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTestWS } from "../hooks/useTestWS";
import CommentsPanel from "../components/CommentsPanel";
import ApprovalPanel from "../components/ApprovalPanel";
import SpeedCard from "../components/SpeedCard";
import SSLCard from "../components/SSLCard";
import BrokenLinksCard from "../components/BrokenLinksCard";
import JSErrorsCard from "../components/JSErrorsCard";
import ImagesCard from "../components/ImagesCard";
import MobileCard from "../components/MobileCard";
import PostLoginCard from "../components/PostLoginCard";
import SEOCard from "../components/SEOCard";
import {
  AccessibilityCard, SecurityHeadersCard, CoreWebVitalsCard,
  CookiesGDPRCard, HTMLValidationCard, ContentQualityCard,
  PWACard, FunctionalityCard,
} from "../components/AdvancedCards";

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
  if (s == null) return "—";
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Poor";
};
const scoreEmoji = (s) => {
  if (s == null) return "⚪";
  if (s >= 80) return "🟢";
  if (s >= 60) return "🟡";
  if (s >= 40) return "🟠";
  return "🔴";
};

// ── Radial Score Chart ─────────────────────────────────────────────────────────
function OverallScoreRing({ score }) {
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
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${color}60)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 42, fontWeight: 900, color, letterSpacing: "-2px", lineHeight: 1 }}>{score ?? "—"}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>/ 100</div>
        <div style={{ fontSize: 13, color, fontWeight: 700, marginTop: 6 }}>{scoreLabel(score)}</div>
      </div>
    </div>
  );
}

// ── Mini score bar for category ────────────────────────────────────────────────
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

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "32px 0 14px" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" }}>{title}</h2>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// ── Progress tracker ───────────────────────────────────────────────────────────
const ALL_CHECKS = [
  "speed", "ssl", "core_web_vitals", "security_headers", "seo",
  "accessibility", "html_validation", "content_quality", "cookies_gdpr",
  "pwa", "functionality", "broken_links", "js_errors", "images", "mobile",
];

function ProgressTracker({ steps }) {
  const done = ALL_CHECKS.filter(k => steps[k]).length;
  const total = ALL_CHECKS.length;
  const pct = Math.round((done / total) * 100);
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 22px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 10px #6366f1", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#c7d2fe" }}>Running checks…</span>
        </div>
        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{done}/{total}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 3, transition: "width 0.5s ease", boxShadow: "0 0 10px rgba(99,102,241,0.5)" }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {ALL_CHECKS.map(k => (
          <span key={k} style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 500,
            background: steps[k] ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
            color: steps[k] ? "#10b981" : "#4b5563",
            border: steps[k] ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)",
            transition: "all 0.3s ease",
          }}>
            {steps[k] ? "✓ " : ""}{k.replace(/_/g, " ")}
          </span>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ connected, done }) {
  if (done) return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
      <span style={{ color: "#10b981", fontSize: 13, fontWeight: 600 }}>✓ Complete</span>
    </div>
  );
  if (connected) return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 8px #6366f1", animation: "pulse 1.5s infinite" }} />
      <span style={{ color: "#818cf8", fontSize: 13, fontWeight: 600 }}>LIVE</span>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <span style={{ color: "#6b7280", fontSize: 13 }}>Connecting…</span>
    </div>
  );
}

// ── Extract score from check data ──────────────────────────────────────────────
function extractScore(data) {
  if (!data) return null;
  if (data.score != null) return data.score;
  if (data.valid === true) return 100;
  if (data.valid === false) return 15;
  if (data.status === "pass") return 90;
  if (data.status === "warning") return 60;
  if (data.status === "fail") return 20;
  return null;
}

// ── Main Result page ───────────────────────────────────────────────────────────
export default function Result() {
  const { testId } = useParams();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const { steps, connected, done } = useTestWS(testId, { token });
  const overall = steps.overall_score;

  // Debug logging
  console.log('[Result] Component state:', {
    testId,
    connected,
    done,
    overall,
    stepsKeys: Object.keys(steps),
    status: steps.status,
    finished_at: steps.finished_at
  });

  // ── Phase 3: share + PDF state ─────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  const shareToken = steps.share_token;
  const shareUrl   = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : null;

  const copyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = [
    { key: "speed", label: "Performance", icon: "⚡" },
    { key: "seo", label: "SEO", icon: "🔍" },
    { key: "accessibility", label: "Accessibility", icon: "♿" },
    { key: "security_headers", label: "Security", icon: "🛡️" },
    { key: "core_web_vitals", label: "Core Web Vitals", icon: "📊" },
    { key: "html_validation", label: "HTML Quality", icon: "🔧" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans', 'Inter', sans-serif", color: "#e2e8f0" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -300, right: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>TestVerse</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Dashboard</button>
          <button onClick={() => navigate("/history")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>History</button>
          <button onClick={() => navigate("/schedules")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Schedules</button>
          <button onClick={() => navigate("/teams")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Teams</button>
          <button onClick={() => navigate("/slack")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Slack</button>
          <button onClick={() => navigate("/apikeys")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>API Keys</button>
          <button onClick={() => navigate("/bulk")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Bulk Test</button>
          <button onClick={() => navigate("/whitelabel")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Branding</button>
          <button onClick={() => navigate("/analytics")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Analytics</button>
          <button onClick={() => navigate("/activity")} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Activity</button>
          <span style={{ fontSize: 13, color: "#4b5563" }}>{user?.email}</span>
          <button onClick={() => { logout(); navigate("/login"); }} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Test Results
            </h1>
            <p style={{ fontSize: 12, color: "#374151", fontFamily: "monospace", margin: "6px 0 0", letterSpacing: "0.5px" }}>{testId}</p>
            {steps.url && <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>{steps.url}</p>}
          </div>
          <StatusBadge connected={connected} done={done} />
        </div>

        {/* Score hero */}
        {overall != null && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "32px", marginBottom: 24, display: "flex", gap: 40, alignItems: "center" }}>
            <OverallScoreRing score={overall} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Overall Health Score</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(overall), marginBottom: 6 }}>
                {scoreEmoji(overall)} {scoreLabel(overall)}
              </div>
              <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 20 }}>
                {overall >= 80 ? "Your site is in excellent shape. Keep up the great work!" :
                 overall >= 60 ? "A few areas need attention to reach peak performance." :
                 overall >= 40 ? "Significant improvements can boost your site's quality." :
                 "Critical issues detected — prioritize fixes immediately."}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {categories.map(({ key, label, icon }) => (
                  <CategoryBar key={key} label={label} icon={icon} score={extractScore(steps[key])} />
                ))}
              </div>

              {/* ── Phase 3: Share + PDF buttons (visible once done) ── */}
              {done && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {shareUrl && (
                    <button onClick={copyShareLink}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${copied ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.1)"}`, color: copied ? "#10b981" : "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                      {copied ? "✓ Copied!" : "🔗 Copy Share Link"}
                    </button>
                  )}
                  <a href={`${API}/reports/${testId}/pdf`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", transition: "all 0.2s" }}>
                    📄 Export PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        {!done && <ProgressTracker steps={steps} />}

        {/* Empty state */}
        {!done && Object.keys(steps).length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#4b5563" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
            <p style={{ fontSize: 14 }}>Running checks… results stream in as they complete.</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* AI Recommendations */}
        {steps.ai_recommendations?.length > 0 && (
          <>
            <SectionHeader title="AI Recommendations" icon="🤖" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
              {steps.ai_recommendations.map((rec, i) => (
                <div key={i} style={{ display: "flex", gap: 12, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</div>
                  <p style={{ margin: 0, fontSize: 14, color: "#c7d2fe", lineHeight: 1.6 }}>{rec}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Check sections */}
        <SectionHeader title="Performance & Speed" icon="⚡" />
        <SpeedCard data={steps.speed} />
        <CoreWebVitalsCard data={steps.core_web_vitals} />

        <SectionHeader title="Security" icon="🛡️" />
        <SSLCard data={steps.ssl} />
        <SecurityHeadersCard data={steps.security_headers} />
        <CookiesGDPRCard data={steps.cookies_gdpr} />

        <SectionHeader title="SEO & Accessibility" icon="🔍" />
        <SEOCard data={steps.seo} />
        <AccessibilityCard data={steps.accessibility} />

        <SectionHeader title="Code Quality" icon="🔧" />
        <HTMLValidationCard data={steps.html_validation} />
        <ContentQualityCard data={steps.content_quality} />
        <PWACard data={steps.pwa} />
        <FunctionalityCard data={steps.functionality} />

        <SectionHeader title="Diagnostics" icon="🔬" />
        <BrokenLinksCard data={steps.broken_links} />
        <JSErrorsCard data={steps.js_errors} />
        <ImagesCard data={steps.images} />
        <MobileCard data={steps.mobile} />

        {steps.login && (
          <>
            <SectionHeader title="Login Test" icon="🔐" />
            <PostLoginCard data={steps.login} />
          </>
        )}

        {/* Done banner */}
        {done && (
          <div style={{ marginTop: 24, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <span style={{ fontSize: 14, color: "#6ee7b7", fontWeight: 500 }}>All checks complete — result saved to history.</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => navigate("/history")} style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                View History →
              </button>
            </div>
          </div>
        )}

        {/* ── Phase 8B: Collaboration ── */}
        {done && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "32px 0 14px" }}>
              <span style={{ fontSize: 16 }}>🤝</span>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" }}>Collaboration</h2>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ApprovalPanel testId={testId} />
              <CommentsPanel testId={testId} />
            </div>
          </>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}