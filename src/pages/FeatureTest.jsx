/**
 * FeatureTest.jsx — Human-Like Feature Testing UI (Phase 8F · Enterprise)
 *
 * Features:
 *  • URL + optional credential input
 *  • Live terminal-style progress log via WebSocket
 *  • Per-feature animated SVG score ring (green/yellow/red)
 *  • Step-by-step expandable drilldowns
 *  • Summary banner (overall score + pass/partial/fail counts)
 *  • Enterprise lock screen if not on enterprise plan
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const WS = API.replace(/^http/, "ws");

// ── Feature cosmetics ──────────────────────────────────────────────────────────
const FEATURE_META = {
  task_manager: { label: "Task Manager", emoji: "✅", color: "#22c55e" },
  byte_battle: { label: "Byte Battle", emoji: "⚔️", color: "#f97316" },
  shop: { label: "Shop / Store", emoji: "🛍️", color: "#a78bfa" },
  leaderboard: { label: "Leaderboard", emoji: "🏆", color: "#eab308" },
  search: { label: "Search", emoji: "🔍", color: "#38bdf8" },
  profile: { label: "User Profile", emoji: "👤", color: "#818cf8" },
  notifications: { label: "Notifications", emoji: "🔔", color: "#fb7185" },
  dashboard: { label: "Dashboard", emoji: "📊", color: "#34d399" },
  flashcards: { label: "Flashcards", emoji: "🃏", color: "#f59e0b" },
};

const STATUS_STYLE = {
  pass: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.35)", text: "#22c55e", badge: "#166534" },
  partial: { bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.35)", text: "#eab308", badge: "#713f12" },
  fail: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.35)", text: "#ef4444", badge: "#7f1d1d" },
  skip: { bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.25)", text: "#94a3b8", badge: "#1e293b" },
  info: { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", text: "#818cf8", badge: "#1e1b4b" },
};

// ── Score ring (SVG) ──────────────────────────────────────────────────────────
function ScoreRing({ score = 0, size = 72 }) {
  const r = (size / 2) - 9;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text x={size / 2} y={size / 2 + 6} textAnchor="middle"
        fill={color} fontSize={size * 0.22} fontWeight="800"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {score}
      </text>
    </svg>
  );
}

// ── Step list inside a feature card ──────────────────────────────────────────
function StepList({ steps }) {
  const DOT = { pass: "#22c55e", fail: "#ef4444", skip: "#475569", info: "#6366f1" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
      {steps.map((s, i) => {
        const dot = DOT[s.status] || "#475569";
        return (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "7px 12px", borderRadius: 8,
            background: "rgba(255,255,255,0.025)",
            animation: `fadeIn 0.25s ease ${i * 0.04}s both`,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: dot, marginTop: 5, flexShrink: 0,
              boxShadow: `0 0 6px ${dot}88`,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.4 }}>
                {s.action}
              </div>
              {s.detail && (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, wordBreak: "break-word" }}>
                  {s.detail}
                </div>
              )}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
              background: `${dot}22`, color: dot, textTransform: "uppercase",
              flexShrink: 0, marginTop: 1, letterSpacing: "0.06em",
            }}>
              {s.status}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Feature result card ────────────────────────────────────────────────────────
function FeatureCard({ result, delay = 0 }) {
  const [open, setOpen] = useState(false);
  const meta = FEATURE_META[result.feature] || { emoji: "🔧", label: result.label || result.feature, color: "#6366f1" };
  const ss = STATUS_STYLE[result.status] || STATUS_STYLE.skip;

  return (
    <div style={{
      background: ss.bg, border: `1px solid ${ss.border}`,
      borderRadius: 14, overflow: "hidden",
      animation: `slideUp 0.35s ease ${delay}s both`,
    }}>
      {/* Card header */}
      <div onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px", cursor: "pointer",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${meta.color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0,
        }}>
          {meta.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>
              {meta.label}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              padding: "2px 8px", borderRadius: 20, textTransform: "uppercase",
              background: `${ss.text}22`, color: ss.text,
            }}>
              {result.status}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
            {result.message}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <ScoreRing score={result.score} size={60} />
          <span style={{ color: "#475569", fontSize: 18 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expandable steps */}
      {open && (
        <div style={{
          borderTop: `1px solid ${ss.border}`,
          padding: "12px 18px 16px",
        }}>
          <div style={{
            fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: 4
          }}>
            Test Steps ({result.steps.length})
          </div>
          <StepList steps={result.steps} />
          {result.tested_url && (
            <a href={result.tested_url} target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                marginTop: 10, fontSize: 11, color: "#6366f1", textDecoration: "none"
              }}>
              🔗 Tested URL
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Live log terminal ─────────────────────────────────────────────────────────
function LiveLog({ log }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log]);

  return (
    <div ref={ref} style={{
      background: "#060810", border: "1px solid rgba(99,102,241,0.2)",
      borderRadius: 12, padding: "14px 16px", maxHeight: 200,
      overflowY: "auto", fontFamily: "'Courier New', monospace", fontSize: 12.5,
      lineHeight: 1.7,
    }}>
      {log.length === 0 && (
        <span style={{ color: "#1e293b" }}>◻ Waiting for test engine…</span>
      )}
      {log.map((entry, i) => (
        <div key={i} style={{
          color: "#94a3b8",
          animation: "fadeIn 0.2s ease", display: "flex", gap: 8
        }}>
          <span style={{ color: "#334155", flexShrink: 0 }}>
            {entry.ts ? entry.ts.slice(11, 19) : ""}
          </span>
          <span style={{ color: "#6366f1" }}>▶</span>
          <span>{entry.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── Summary banner ────────────────────────────────────────────────────────────
function SummaryBanner({ data, onReset }) {
  const { overall_score = 0, summary = "", passed = 0, partial = 0, failed = 0,
    total_features = 0, features_detected = [] } = data;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))",
      border: "1px solid rgba(99,102,241,0.3)", borderRadius: 18,
      padding: "24px 28px", display: "flex", gap: 24,
      flexWrap: "wrap", alignItems: "center", marginBottom: 24,
    }}>
      <ScoreRing score={overall_score} size={96} />

      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
          Feature Test Complete
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 14, lineHeight: 1.6 }}>
          {summary}
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Passed", value: passed, color: "#22c55e" },
            { label: "Partial", value: partial, color: "#eab308" },
            { label: "Failed", value: failed, color: "#ef4444" },
            { label: "Total", value: total_features, color: "#6366f1" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{
                fontSize: 10, color: "#475569", textTransform: "uppercase",
                letterSpacing: "0.08em"
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
        <button onClick={onReset} style={{
          padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          cursor: "pointer", background: "rgba(99,102,241,0.15)",
          border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          🔁 Test Again
        </button>
      </div>
    </div>
  );
}

// ── Enterprise gate ───────────────────────────────────────────────────────────
function EnterpriseLock() {
  return (
    <div style={{
      minHeight: "60vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center",
      padding: 40,
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🏢</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
        Enterprise Feature
      </h2>
      <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 440, lineHeight: 1.7, marginBottom: 24 }}>
        Human-Like Feature Testing is available exclusively on the{" "}
        <strong style={{ color: "#f59e0b" }}>Enterprise</strong> plan.
        Please contact your <strong style={{ color: "#f59e0b" }}>system administrator</strong>{" "}
        to upgrade your plan.
      </p>
      <div style={{
        background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
        borderRadius: 12, padding: "12px 20px", fontSize: 13, color: "#fbbf24",
      }}>
        🔐 Billing &amp; plan upgrades are managed by your System Administrator only.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
export default function FeatureTest() {
  const { authFetch, user } = useAuth();

  // Form state
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showCreds, setShowCreds] = useState(false);

  // Test state
  const [phase, setPhase] = useState("idle"); // idle | running | done | error
  const [jobId, setJobId] = useState(null);
  const [log, setLog] = useState([]);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  // Access check
  const [planOk, setPlanOk] = useState(null); // null=checking
  const [planErr, setPlanErr] = useState("");

  const wsRef = useRef(null);

  // ── Plan check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    authFetch(`${API}/billing/my-plan`)
      .then(r => r.json())
      .then(d => {
        if (d.plan === "enterprise") {
          setPlanOk(true);
        } else {
          setPlanOk(false);
          setPlanErr(d.plan || "free");
        }
      })
      .catch(() => setPlanOk(false));
  }, [user, authFetch]);

  // ── WebSocket connect ──────────────────────────────────────────────────────
  const connectWS = useCallback((jid) => {
    const ws = new WebSocket(`${WS}/feature-test/${jid}/ws`);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);

        // Log messages
        if (data.message || data.msg) {
          const ts = new Date().toISOString();
          setLog(l => [...l, { ts, msg: data.message || data.msg }]);
        }

        // Log entries in snapshot
        if (data.log?.length) setLog(data.log);

        // Partial or full results
        if (data.feature_result) {
          setResults(prev => {
            const idx = prev.findIndex(r => r.feature === data.feature_result.feature);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = data.feature_result;
              return copy;
            }
            return [...prev, data.feature_result];
          });
        }
        if (data.partial_results?.length) {
          setResults(data.partial_results);
        }

        // Done
        if (data.done || data.type === "done") {
          const result = data.result;
          if (result) {
            setResults(result.results || []);
            setSummary(result);
          }
          setPhase("done");
          ws.close();
        }

        // Snapshot
        if (data.type === "snapshot") {
          if (data.partial_results?.length) setResults(data.partial_results);
          if (data.log?.length) setLog(data.log);
          if (data.done && data.result) {
            setResults(data.result.results || []);
            setSummary(data.result);
            setPhase("done");
            ws.close();
          }
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onerror = () => {
      setLog(l => [...l, { ts: new Date().toISOString(), msg: "WebSocket error — polling..." }]);
      pollJob(jid);
    };
  }, []);

  // ── Poll fallback ──────────────────────────────────────────────────────────
  const pollJob = useCallback((jid) => {
    const iv = setInterval(async () => {
      try {
        const res = await authFetch(`${API}/feature-test/${jid}`);
        const data = await res.json();
        if (data.partial_results?.length) setResults(data.partial_results);
        if (data.status === "completed") {
          setResults(data.results || []);
          setSummary(data);
          setPhase("done");
          clearInterval(iv);
        } else if (data.status === "failed") {
          setErrMsg(data.error || "Test failed");
          setPhase("error");
          clearInterval(iv);
        }
      } catch { clearInterval(iv); }
    }, 3000);
  }, [authFetch]);

  // ── Start test ─────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!url.trim() || phase === "running") return;
    setPhase("running");
    setLog([]);
    setResults([]);
    setSummary(null);
    setErrMsg("");

    const body = { url: url.trim() };
    if (email.trim()) body.email = email.trim();
    if (password.trim()) body.password = password.trim();

    try {
      const res = await authFetch(`${API}/feature-test/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrMsg(data.detail || "Failed to start test");
        setPhase("error");
        return;
      }

      setJobId(data.job_id);
      setLog([{ ts: new Date().toISOString(), msg: `▶ Job started: ${data.job_id}` }]);
      connectWS(data.job_id);
    } catch (e) {
      setErrMsg(e.message || "Network error");
      setPhase("error");
    }
  };

  const handleReset = () => {
    if (wsRef.current) wsRef.current.close();
    setPhase("idle");
    setJobId(null);
    setLog([]);
    setResults([]);
    setSummary(null);
    setErrMsg("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: "#080b12",
      fontFamily: "'Inter','DM Sans',sans-serif",
      color: "#e2e8f0", padding: "32px 20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes spin     { to { transform:rotate(360deg) } }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.45} }
        input:focus { outline:none; }
        ::-webkit-scrollbar { width:5px; background:#060810 }
        ::-webkit-scrollbar-thumb { background:#1e2840; border-radius:4px }
        .run-btn:hover { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 8px 30px rgba(99,102,241,.5) !important; }
        .run-btn:active { transform:scale(0.98); }
        .cred-toggle:hover { color:#818cf8 !important; }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, animation: "slideUp 0.35s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, boxShadow: "0 0 28px rgba(99,102,241,.4)",
            }}>🤖</div>
            <div>
              <h1 style={{
                margin: 0, fontSize: 26, fontWeight: 900, color: "#f1f5f9",
                letterSpacing: "-0.3px"
              }}>
                Human-Like Feature Testing
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                TestVerse detects &amp; tests your website features like a real user
              </p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700,
                color: "#fbbf24", letterSpacing: "0.08em",
              }}>🏢 ENTERPRISE</span>
            </div>
          </div>
        </div>

        {/* Plan check */}
        {planOk === null && (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
            <div style={{
              width: 32, height: 32, margin: "0 auto 10px",
              border: "3px solid rgba(99,102,241,.2)", borderTopColor: "#6366f1",
              borderRadius: "50%", animation: "spin 0.9s linear infinite"
            }} />
            Checking plan access…
          </div>
        )}

        {planOk === false && <EnterpriseLock />}

        {planOk === true && (
          <>
            {/* Info bar */}
            <div style={{
              background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.2)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 24,
              fontSize: 13, color: "#94a3b8", lineHeight: 1.65,
              animation: "slideUp 0.4s ease",
            }}>
              ℹ️ Enter your website URL (and optional login credentials). TestVerse will scan for
              features like{" "}
              {["Task Manager", "Byte Battle", "Shop", "Leaderboard", "Search", "Dashboard"].map((f, i, a) => (
                <span key={f}>
                  <strong style={{ color: "#a5b4fc" }}>{f}</strong>
                  {i < a.length - 1 ? ", " : " "}
                </span>
              ))}
              — then <strong style={{ color: "#c7d2fe" }}>actually use</strong> each one
              step-by-step.
            </div>

            {/* INPUT PANEL */}
            {phase === "idle" && (
              <div style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18, padding: 28,
                animation: "slideUp 0.45s ease",
                marginBottom: 24,
              }}>
                {/* URL */}
                <label style={{
                  fontSize: 12, color: "#64748b", fontWeight: 700,
                  display: "block", marginBottom: 6, textTransform: "uppercase",
                  letterSpacing: "0.08em"
                }}>
                  Website URL *
                </label>
                <input
                  value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://your-website.com"
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#f1f5f9", fontSize: 15, boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />

                {/* Creds toggle */}
                <button className="cred-toggle" onClick={() => setShowCreds(c => !c)} style={{
                  marginTop: 14, background: "none", border: "none",
                  color: "#64748b", cursor: "pointer", fontSize: 13,
                  fontWeight: 600, padding: 0, display: "flex",
                  alignItems: "center", gap: 6, transition: "color .2s",
                }}>
                  🔐 {showCreds ? "Hide" : "Add"} Login Credentials (optional)
                  <span style={{ fontSize: 11, opacity: .6 }}>{showCreds ? "▲" : "▼"}</span>
                </button>

                {showCreds && (
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 12, marginTop: 14,
                    animation: "fadeIn 0.25s ease",
                  }}>
                    {[
                      {
                        label: "Email / Username", val: email, set: setEmail,
                        ph: "user@email.com", type: "text", col: "auto"
                      },
                      {
                        label: "Password", val: password, set: setPassword,
                        ph: "••••••••", type: "password", col: "auto"
                      },
                    ].map(f => (
                      <div key={f.label} style={{ gridColumn: f.col }}>
                        <label style={{
                          fontSize: 12, color: "#64748b", fontWeight: 600,
                          display: "block", marginBottom: 5
                        }}>{f.label}</label>
                        <input type={f.type} value={f.val}
                          onChange={e => f.set(e.target.value)} placeholder={f.ph}
                          style={{
                            width: "100%", padding: "10px 14px", borderRadius: 8,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#f1f5f9", fontSize: 14, boxSizing: "border-box",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {errMsg && (
                  <div style={{
                    marginTop: 14, padding: "10px 14px", borderRadius: 8,
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                    color: "#ef4444", fontSize: 13,
                  }}>⚠️ {errMsg}</div>
                )}

                <button
                  className="run-btn"
                  onClick={handleRun}
                  disabled={!url.trim()}
                  style={{
                    marginTop: 22, width: "100%", padding: "14px 0",
                    borderRadius: 12, fontSize: 15, fontWeight: 700,
                    border: "none", cursor: url.trim() ? "pointer" : "not-allowed",
                    background: url.trim()
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "rgba(99,102,241,.2)",
                    color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: url.trim() ? "0 4px 24px rgba(99,102,241,.35)" : "none",
                    transition: "all .2s",
                  }}>
                  ▶ Run Human-Like Tests
                </button>
              </div>
            )}

            {/* RUNNING — live log + partial results */}
            {phase === "running" && (
              <div style={{ animation: "slideUp 0.35s ease" }}>
                <div style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 18, padding: 24, marginBottom: 20,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      border: "3px solid rgba(99,102,241,.2)",
                      borderTop: "3px solid #6366f1",
                      animation: "spin 1s linear infinite", flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>
                        Analyzing &amp; Testing Features…
                      </div>
                      <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                        {log.length > 0 ? log[log.length - 1].msg : "Initializing…"}
                      </div>
                    </div>
                  </div>
                  <LiveLog log={log} />
                </div>

                {/* Partial results while running */}
                {results.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 12, color: "#475569", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10
                    }}>
                      Results so far ({results.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {results.map((r, i) => (
                        <FeatureCard key={r.feature} result={r} delay={i * 0.05} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ERROR */}
            {phase === "error" && (
              <div style={{ animation: "slideUp 0.35s ease" }}>
                <div style={{
                  background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: 14, padding: 28, textAlign: "center",
                }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>❌</div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "#f87171" }}>
                    Test Failed
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>{errMsg}</div>
                  <button onClick={handleReset} style={{
                    marginTop: 18, padding: "9px 22px", borderRadius: 10,
                    background: "rgba(99,102,241,.15)",
                    border: "1px solid rgba(99,102,241,.3)",
                    color: "#818cf8", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  }}>🔁 Try Again</button>
                </div>
              </div>
            )}

            {/* DONE */}
            {phase === "done" && summary && (
              <div style={{ animation: "slideUp 0.35s ease" }}>
                <SummaryBanner data={summary} onReset={handleReset} />

                {results.length > 0 ? (
                  <div>
                    <div style={{
                      fontSize: 12, color: "#475569", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12
                    }}>
                      Feature Results ({results.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {results.map((r, i) => (
                        <FeatureCard key={r.feature} result={r} delay={i * 0.06} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
                    borderRadius: 14, padding: 28, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🔎</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#f87171" }}>
                      No Features Detected
                    </div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
                      {summary.summary || "The site may require login or uses non-standard navigation. Try adding credentials."}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
