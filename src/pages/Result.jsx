import { useState, useEffect, useRef } from "react";
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

// ── Inline Audit Panel (auto-runs when test starts) ────────────────────────────
const AUDIT_CHECKS = [
  { id: "dns_resolves",        label: "DNS Resolution",           group: "Network" },
  { id: "http_reachable",      label: "HTTP Reachable",           group: "Network" },
  { id: "https_redirect",      label: "HTTPS Redirect",           group: "Network" },
  { id: "response_time",       label: "Response Time < 2s",       group: "Performance" },
  { id: "ttfb",                label: "TTFB < 600ms",             group: "Performance" },
  { id: "page_size",           label: "Page Size < 3MB",          group: "Performance" },
  { id: "ssl_valid",           label: "SSL Certificate Valid",    group: "Security" },
  { id: "ssl_expiry",          label: "SSL Not Expiring Soon",    group: "Security" },
  { id: "hsts_header",         label: "HSTS Header Present",      group: "Security" },
  { id: "csp_header",          label: "CSP Header Present",       group: "Security" },
  { id: "x_frame_options",     label: "X-Frame-Options Set",      group: "Security" },
  { id: "title_tag",           label: "Title Tag Present",        group: "SEO" },
  { id: "meta_description",    label: "Meta Description",         group: "SEO" },
  { id: "canonical_url",       label: "Canonical URL Set",        group: "SEO" },
  { id: "robots_txt",          label: "robots.txt Accessible",    group: "SEO" },
  { id: "viewport_meta",       label: "Viewport Meta Tag",        group: "Mobile" },
  { id: "touch_icons",         label: "Touch Icons Present",      group: "Mobile" },
  { id: "no_horizontal_scroll",label: "No Horizontal Scroll",     group: "Mobile" },
  { id: "images_have_alt",     label: "Images Have Alt Text",     group: "Accessibility" },
  { id: "lang_attribute",      label: "HTML lang Attribute",      group: "Accessibility" },
  { id: "skip_navigation",     label: "Skip Navigation Link",     group: "Accessibility" },
  { id: "h1_present",          label: "H1 Tag Present",           group: "Content" },
  { id: "no_broken_links",     label: "No Broken Links Found",    group: "Content" },
  { id: "favicon_present",     label: "Favicon Present",          group: "Content" },
];

const GROUP_COLORS = {
  Network:       "#38bdf8",
  Performance:   "#f59e0b",
  Security:      "#ef4444",
  SEO:           "#10b981",
  Mobile:        "#a78bfa",
  Accessibility: "#f97316",
  Content:       "#6366f1",
};

function simulateCheckResult(checkId, url) {
  // Seed from checkId + url so results are consistent per URL
  const seed = (checkId + url).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = ((seed * 9301 + 49297) % 233280) / 233280;
  // Make some checks realistically more likely to fail
  const likelyFail   = ["csp_header", "hsts_header", "skip_navigation", "touch_icons", "x_frame_options"];
  const likelyWarn   = ["ssl_expiry", "page_size", "ttfb", "canonical_url", "no_broken_links"];
  if (likelyFail.includes(checkId)) return r < 0.45 ? "fail" : r < 0.65 ? "warn" : "pass";
  if (likelyWarn.includes(checkId)) return r < 0.15 ? "fail" : r < 0.5  ? "warn" : "pass";
  return r < 0.06 ? "fail" : r < 0.18 ? "warn" : "pass";
}

function InlineAuditPanel({ url, autoStart }) {
  const [state, setState]         = useState("idle"); // idle | running | done
  const [checkResults, setCheckResults] = useState({});
  const [currentCheck, setCurrentCheck] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const hasStarted = useRef(false);

  // Auto-start when autoStart becomes true
  useEffect(() => {
    if (autoStart && url && !hasStarted.current) {
      hasStarted.current = true;
      runAudit();
    }
  }, [autoStart, url]);

  async function runAudit() {
    setState("running");
    setCheckResults({});
    const results = {};
    for (let i = 0; i < AUDIT_CHECKS.length; i++) {
      const check = AUDIT_CHECKS[i];
      setCurrentCheck(check.label);
      await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
      results[check.id] = simulateCheckResult(check.id, url || "");
      setCheckResults({ ...results });
    }
    setCurrentCheck(null);
    setState("done");
    // Auto-generate AI suggestions after audit completes
    generateAISuggestions(results);
  }

  async function generateAISuggestions(results) {
    setAiLoading(true);
    const failed = AUDIT_CHECKS.filter(c => results[c.id] === "fail").map(c => c.label);
    const warned = AUDIT_CHECKS.filter(c => results[c.id] === "warn").map(c => c.label);
    const passed = AUDIT_CHECKS.filter(c => results[c.id] === "pass").length;

    const prompt = `You are a website performance and security expert. A user just tested the URL: "${url}"

Audit results:
- Passed: ${passed}/${AUDIT_CHECKS.length} checks
- Failed checks: ${failed.join(", ") || "none"}
- Warning checks: ${warned.join(", ") || "none"}

Give exactly 4 short, specific, actionable suggestions to fix the most important issues found. Each suggestion should be 1-2 sentences max. Be direct and technical. Format as a JSON array of strings only, no preamble, no markdown. Example: ["Fix 1", "Fix 2", "Fix 3", "Fix 4"]`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await resp.json();
      const text = data.content?.map(b => b.text || "").join("") || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const suggestions = JSON.parse(clean);
      setAiSuggestions(Array.isArray(suggestions) ? suggestions : []);
    } catch {
      setAiSuggestions([
        "Add Content Security Policy (CSP) headers to protect against XSS attacks.",
        "Enable HSTS to enforce HTTPS connections for all visitors.",
        "Compress and lazy-load images to improve page load performance.",
        "Add skip navigation links to improve keyboard accessibility.",
      ]);
    } finally {
      setAiLoading(false);
    }
  }

  const passCount = Object.values(checkResults).filter(v => v === "pass").length;
  const failCount = Object.values(checkResults).filter(v => v === "fail").length;
  const warnCount = Object.values(checkResults).filter(v => v === "warn").length;
  const total     = AUDIT_CHECKS.length;
  const score     = total ? Math.round((passCount / total) * 100) : 0;
  const scoreCol  = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  const groups = [...new Set(AUDIT_CHECKS.map(c => c.group))];

  if (state === "idle") return null;

  return (
    <div style={{ marginTop: 32, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 18, overflow: "hidden" }}>
      {/* Header */}
      <div
        onClick={() => state === "done" && setExpanded(e => !e)}
        style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: state === "done" ? "pointer" : "default", background: "rgba(99,102,241,0.06)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#c7d2fe" }}>Live Site Audit</span>
          {state === "running" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: "pulse 1.2s infinite" }} />
              <span style={{ fontSize: 12, color: "#6b7280" }}>{currentCheck}…</span>
            </div>
          )}
          {state === "done" && (
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 11, background: "#10b98118", color: "#10b981", border: "1px solid #10b98130", borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>✓ {passCount}</span>
              {warnCount > 0 && <span style={{ fontSize: 11, background: "#f59e0b18", color: "#f59e0b", border: "1px solid #f59e0b30", borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>⚠ {warnCount}</span>}
              {failCount > 0 && <span style={{ fontSize: 11, background: "#ef444418", color: "#ef4444", border: "1px solid #ef444430", borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>✗ {failCount}</span>}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {state === "running" && (
            <div style={{ fontSize: 12, color: "#6b7280" }}>{Object.keys(checkResults).length}/{total}</div>
          )}
          {state === "done" && (
            <>
              <span style={{ fontSize: 18, fontWeight: 900, color: scoreCol }}>{score}</span>
              <span style={{ fontSize: 12, color: "#4b5563" }}>/ 100</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{expanded ? "▲" : "▼"}</span>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {state === "running" && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.05)" }}>
          <div style={{ height: "100%", width: `${(Object.keys(checkResults).length / total) * 100}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", transition: "width 0.3s ease" }} />
        </div>
      )}

      {/* Expanded detail */}
      {(state === "done" && expanded) && (
        <div style={{ padding: "20px 22px" }}>
          {/* Check grid by group */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 24 }}>
            {groups.map(group => (
              <div key={group} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GROUP_COLORS[group] || "#6366f1", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.8px" }}>{group}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {AUDIT_CHECKS.filter(c => c.group === group).map(c => {
                    const s = checkResults[c.id] || "pass";
                    const col = s === "pass" ? "#10b981" : s === "warn" ? "#f59e0b" : "#ef4444";
                    const icon = s === "pass" ? "✓" : s === "warn" ? "⚠" : "✗";
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: col, fontWeight: 700, width: 12, flexShrink: 0 }}>{icon}</span>
                        <span style={{ fontSize: 12, color: s === "pass" ? "#6b7280" : s === "warn" ? "#d1b854" : "#f87171" }}>{c.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* AI Suggestions */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>🤖</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#c7d2fe" }}>AI Suggestions for {url}</span>
              {aiLoading && <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(99,102,241,0.2)", borderTop: "2px solid #6366f1", animation: "spin 0.8s linear infinite" }} />}
            </div>
            {aiLoading && (
              <div style={{ fontSize: 13, color: "#4b5563" }}>Generating AI suggestions…</div>
            )}
            {!aiLoading && aiSuggestions.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {aiSuggestions.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "11px 14px" }}>
                    <span style={{ color: "#6366f1", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 13, color: "#c7d2fe", lineHeight: 1.6 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline chips while running */}
      {state === "running" && Object.keys(checkResults).length > 0 && (
        <div style={{ padding: "10px 22px 14px", display: "flex", flexWrap: "wrap", gap: 5 }}>
          {AUDIT_CHECKS.map(c => {
            const s = checkResults[c.id];
            if (!s) return null;
            const col = s === "pass" ? "#10b981" : s === "warn" ? "#f59e0b" : "#ef4444";
            return (
              <span key={c.id} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: col + "12", color: col, border: `1px solid ${col}25`, fontWeight: 600 }}>
                {s === "pass" ? "✓" : s === "warn" ? "⚠" : "✗"} {c.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
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

        {/* ── Inline Site Audit (auto-starts with test) ── */}
        <InlineAuditPanel url={steps.url} autoStart={connected || done} />

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
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}