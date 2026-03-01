/**
 * DataSpy.jsx — Website Privacy & Data Audit
 * Pro + Enterprise only.
 * Visits a URL and reveals:
 *   1. Data the site explicitly asks from users (forms, inputs)
 *   2. Data collected silently without permission (trackers, fingerprinting, cookies)
 */
import { useState, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// ─── Risk level config ──────────────────────────────────────────────────────
const RISK = {
  high:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   label: "HIGH RISK" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  label: "MEDIUM" },
  low:    { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)",   label: "LOW" },
  info:   { color: "#38bdf8", bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.2)",   label: "INFO" },
};

// ─── Category icons & labels ────────────────────────────────────────────────
const CATEGORY_META = {
  explicit_forms:      { icon: "📋", label: "Form Inputs",         desc: "Data explicitly requested from user" },
  cookies:             { icon: "🍪", label: "Cookies",             desc: "Cookies set on your browser" },
  trackers:            { icon: "👁️",  label: "Third-Party Trackers", desc: "External scripts tracking you" },
  fingerprinting:      { icon: "🔏", label: "Fingerprinting",      desc: "Silent device identification" },
  local_storage:       { icon: "💾", label: "Local Storage",       desc: "Data stored in your browser" },
  network_requests:    { icon: "🌐", label: "Network Requests",    desc: "External services contacted" },
  permissions:         { icon: "🔐", label: "Permissions Asked",   desc: "Browser permissions requested" },
  hidden_fields:       { icon: "🕵️", label: "Hidden Fields",       desc: "Invisible form data collection" },
};

// ─── Upgrade gate ───────────────────────────────────────────────────────────
function UpgradeGate() {
  return (
    <div style={{
      minHeight: "70vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center", padding: 48,
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", marginBottom: 10, fontFamily: "'Syne', sans-serif" }}>
        Pro Feature
      </div>
      <div style={{ fontSize: 14, color: "#64748b", maxWidth: 380, lineHeight: 1.8, marginBottom: 28 }}>
        Website Data Spy is available on <strong style={{ color: "#f59e0b" }}>Pro</strong> and{" "}
        <strong style={{ color: "#a78bfa" }}>Enterprise</strong> plans.<br />
        Contact your system administrator to upgrade.
      </div>
      <div style={{
        padding: "10px 24px", borderRadius: 10,
        background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
        color: "#818cf8", fontSize: 13, fontWeight: 600,
      }}>
        Upgrade to unlock →
      </div>
    </div>
  );
}

// ─── Score ring ─────────────────────────────────────────────────────────────
function PrivacyScore({ score }) {
  const size = 100;
  const r    = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const off  = circ - (score / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Good" : score >= 40 ? "Moderate" : "Poor";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x={size/2} y={size/2+6} textAnchor="middle" fill={color}
          fontSize={22} fontWeight="900"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px`, fontFamily: "monospace" }}>
          {score}
        </text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
    </div>
  );
}

// ─── Single finding card ────────────────────────────────────────────────────
function FindingCard({ item, index }) {
  const [open, setOpen] = useState(false);
  const r = RISK[item.risk] || RISK.info;
  return (
    <div style={{
      background: r.bg, border: `1px solid ${r.border}`,
      borderRadius: 10, overflow: "hidden",
      animation: `fadeUp 0.3s ease ${index * 0.04}s both`,
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
      >
        <div style={{
          fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
          background: r.bg, border: `1px solid ${r.border}`, color: r.color,
          letterSpacing: "0.08em", flexShrink: 0,
        }}>{r.label}</div>
        <div style={{ flex: 1, fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{item.name}</div>
        {item.value && (
          <code style={{ fontSize: 11, color: "#64748b", background: "rgba(0,0,0,0.3)", padding: "2px 7px", borderRadius: 5, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.value}
          </code>
        )}
        <span style={{ color: "#334155", fontSize: 14 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && item.detail && (
        <div style={{ padding: "0 16px 14px", fontSize: 12, color: "#94a3b8", lineHeight: 1.7, borderTop: `1px solid ${r.border}`, paddingTop: 10 }}>
          {item.detail}
        </div>
      )}
    </div>
  );
}

// ─── Category section ───────────────────────────────────────────────────────
function CategorySection({ categoryKey, items }) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = CATEGORY_META[categoryKey] || { icon: "📦", label: categoryKey, desc: "" };
  const highCount = items.filter(i => i.risk === "high").length;

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: collapsed ? 0 : 10, cursor: "pointer",
          padding: "8px 4px",
        }}
      >
        <span style={{ fontSize: 18 }}>{meta.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{meta.label}</div>
          <div style={{ fontSize: 11, color: "#475569" }}>{meta.desc}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {highCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              {highCount} HIGH
            </span>
          )}
          <span style={{ fontSize: 11, color: "#334155", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 20 }}>
            {items.length}
          </span>
          <span style={{ color: "#334155", fontSize: 12 }}>{collapsed ? "▼" : "▲"}</span>
        </div>
      </div>
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item, i) => <FindingCard key={i} item={item} index={i} />)}
        </div>
      )}
    </div>
  );
}

// ─── Live scanning log ──────────────────────────────────────────────────────
function ScanLog({ log }) {
  const ref = useRef(null);
  useState(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; });
  return (
    <div ref={ref} style={{
      background: "#020408", border: "1px solid rgba(99,102,241,0.15)",
      borderRadius: 10, padding: "14px 16px", height: 160,
      overflowY: "auto", fontFamily: "'Courier New', monospace", fontSize: 11, lineHeight: 1.9,
    }}>
      {log.length === 0 && <span style={{ color: "#1e293b" }}>▸ Initializing scan engine…</span>}
      {log.map((line, i) => (
        <div key={i} style={{ color: line.startsWith("⚠") || line.startsWith("❌") ? "#ef4444" : line.startsWith("✅") ? "#22c55e" : "#4b5563" }}>
          <span style={{ color: "#1e293b", marginRight: 8 }}>$</span>{line}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
export default function DataSpy() {
  const { authFetch } = useAuth();

  const [url, setUrl]       = useState("");
  const [phase, setPhase]   = useState("idle"); // idle | scanning | done | error | locked
  const [log, setLog]       = useState([]);
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [hasAccess, setHasAccess] = useState(true);

  const pollRef = useRef(null);

  // ── Poll job ──────────────────────────────────────────────────────────────
  const pollJob = useCallback((jobId) => {
    const iv = setInterval(async () => {
      try {
        const res  = await authFetch(`${API}/data-spy/${jobId}`);
        const data = await res.json();
        if (!res.ok) { clearInterval(iv); return; }
        if (data.log?.length) setLog(data.log);
        if (data.status === "completed") {
          setResult(data.result);
          setPhase("done");
          clearInterval(iv);
        } else if (data.status === "failed") {
          setErrMsg(data.error || "Scan failed");
          setPhase("error");
          clearInterval(iv);
        }
      } catch { clearInterval(iv); }
    }, 2500);
    pollRef.current = iv;
  }, [authFetch]);

  // ── Start scan ────────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (!url.trim() || phase === "scanning") return;
    setPhase("scanning"); setLog([]); setResult(null); setErrMsg("");

    try {
      const res  = await authFetch(`${API}/data-spy/scan`, {
        method: "POST",
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) { setHasAccess(false); setPhase("idle"); return; }
        setErrMsg(data.detail || "Failed to start scan");
        setPhase("error");
        return;
      }

      setLog([`▸ Job started — scanning ${url.trim()}`]);
      pollJob(data.job_id);
    } catch (e) {
      setErrMsg(e.message || "Network error");
      setPhase("error");
    }
  };

  const handleReset = () => {
    clearInterval(pollRef.current);
    setPhase("idle"); setLog([]); setResult(null); setErrMsg(""); setUrl("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#07090f",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
      padding: "36px 20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin   { to   { transform: rotate(360deg) } }
        @keyframes pulse  { 0%,100% { opacity:1 } 50% { opacity:.4 } }
        @keyframes scanLine {
          0%   { transform: translateY(0); opacity:0.6 }
          100% { transform: translateY(100%); opacity:0 }
        }
        .scan-btn { transition: all 0.2s; }
        .scan-btn:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); box-shadow: 0 10px 32px rgba(99,102,241,0.45) !important; }
        .scan-btn:active:not(:disabled) { transform: scale(0.98); }
        ::-webkit-scrollbar { width: 4px; background: #020408 }
        ::-webkit-scrollbar-thumb { background: #1e2840; border-radius: 4px }
        input:focus { outline: none; }
      `}</style>

      {!hasAccess && <UpgradeGate />}

      {hasAccess && (
        <div style={{ maxWidth: 780, margin: "0 auto" }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 32, animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg, #ef4444, #f97316)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, boxShadow: "0 4px 20px rgba(239,68,68,0.3)",
              }}>🕵️</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px", color: "#f1f5f9" }}>
                  Data Spy
                </div>
                <div style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
                  See exactly what data any website collects from you
                </div>
              </div>
              <div style={{
                marginLeft: "auto", fontSize: 10, fontWeight: 700,
                padding: "4px 10px", borderRadius: 20, letterSpacing: "0.08em",
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b",
              }}>PRO+</div>
            </div>
          </div>

          {/* ── URL input card ──────────────────────────────────────────────── */}
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18, padding: "24px 28px",
            marginBottom: 24, animation: "fadeUp 0.45s ease",
          }}>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>
              Target Website
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#334155", fontSize: 14 }}>🔗</span>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScan()}
                  placeholder="https://example.com"
                  disabled={phase === "scanning"}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "14px 16px 14px 40px", borderRadius: 12,
                    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#f1f5f9", fontSize: 14, fontFamily: "inherit",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <button
                className="scan-btn"
                onClick={handleScan}
                disabled={!url.trim() || phase === "scanning"}
                style={{
                  padding: "14px 28px", borderRadius: 12, border: "none",
                  background: url.trim() && phase !== "scanning"
                    ? "linear-gradient(135deg, #ef4444, #f97316)"
                    : "rgba(255,255,255,0.05)",
                  color: url.trim() && phase !== "scanning" ? "#fff" : "#334155",
                  fontWeight: 700, fontSize: 14, cursor: url.trim() && phase !== "scanning" ? "pointer" : "not-allowed",
                  fontFamily: "inherit", whiteSpace: "nowrap",
                  boxShadow: url.trim() && phase !== "scanning" ? "0 4px 20px rgba(239,68,68,0.3)" : "none",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {phase === "scanning" ? (
                  <>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #fff", animation: "spin 0.8s linear infinite" }} />
                    Scanning…
                  </>
                ) : "Scan Site 🔍"}
              </button>
            </div>

            {/* What we check */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {["📋 Form Fields", "🍪 Cookies", "👁️ Trackers", "🔏 Fingerprinting", "💾 Storage", "🕵️ Hidden Data"].map(tag => (
                <div key={tag} style={{
                  fontSize: 11, padding: "4px 12px", borderRadius: 20, fontWeight: 500,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#475569",
                }}>{tag}</div>
              ))}
            </div>
          </div>

          {/* ── Scanning state ──────────────────────────────────────────────── */}
          {phase === "scanning" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{
                background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: 16, padding: "20px 24px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 16,
              }}>
                {/* Animated radar */}
                <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    border: "2px solid rgba(239,68,68,0.15)",
                    position: "absolute",
                  }} />
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    border: "2px solid rgba(239,68,68,0.2)",
                    position: "absolute", top: 8, left: 8,
                  }} />
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: "#ef4444", position: "absolute", top: 19, left: 19,
                    animation: "pulse 1s ease infinite",
                    boxShadow: "0 0 12px rgba(239,68,68,0.6)",
                  }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>Scanning website…</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                    Visiting {url} and analyzing data collection behaviour
                  </div>
                </div>
              </div>
              <ScanLog log={log} />
            </div>
          )}

          {/* ── Error ──────────────────────────────────────────────────────── */}
          {phase === "error" && (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 16, animation: "fadeUp 0.3s ease",
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>❌</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#f87171", marginBottom: 6 }}>Scan Failed</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>{errMsg}</div>
              <button onClick={handleReset} style={{ padding: "9px 22px", borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                🔁 Try Again
              </button>
            </div>
          )}

          {/* ── Results ────────────────────────────────────────────────────── */}
          {phase === "done" && result && (
            <div style={{ animation: "fadeUp 0.35s ease" }}>

              {/* Summary bar */}
              <div style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(249,115,22,0.05))",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 18, padding: "22px 28px",
                display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center",
                marginBottom: 24,
              }}>
                <PrivacyScore score={result.privacy_score ?? 0} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>
                    Privacy Report — <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: 14 }}>{result.url}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 14 }}>{result.summary}</div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {[
                      ["Explicit", result.explicit_count ?? 0, "#38bdf8"],
                      ["Silent",   result.silent_count  ?? 0, "#ef4444"],
                      ["High Risk",result.high_risk_count?? 0, "#f97316"],
                      ["Total",    result.total_count   ?? 0, "#a78bfa"],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: c }}>{v}</div>
                        <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={handleReset} style={{
                  padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8",
                  fontFamily: "inherit",
                }}>🔁 Scan Again</button>
              </div>

              {/* Two-column: Explicit vs Silent */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

                {/* Explicit data */}
                <div style={{
                  background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.15)",
                  borderRadius: 16, padding: "20px 20px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Explicitly Asked
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 14, lineHeight: 1.6 }}>
                    Data the site openly asks you to provide via forms, inputs, and sign-ups.
                  </div>
                  {(result.explicit_data || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: "#334155", fontStyle: "italic" }}>No explicit data collection found.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(result.explicit_data || []).map((item, i) => (
                        <FindingCard key={i} item={item} index={i} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Silent data */}
                <div style={{
                  background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 16, padding: "20px 20px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s ease infinite" }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Collected Without Permission
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 14, lineHeight: 1.6 }}>
                    Data collected silently in the background — trackers, fingerprinting, hidden requests.
                  </div>
                  {(result.silent_data || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: "#334155", fontStyle: "italic" }}>No silent data collection detected.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(result.silent_data || []).map((item, i) => (
                        <FindingCard key={i} item={item} index={i} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed breakdown by category */}
              {result.categories && Object.keys(result.categories).length > 0 && (
                <div style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16, padding: "22px 24px",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    📊 Detailed Breakdown
                  </div>
                  {Object.entries(result.categories).map(([key, items]) =>
                    items.length > 0 ? <CategorySection key={key} categoryKey={key} items={items} /> : null
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
