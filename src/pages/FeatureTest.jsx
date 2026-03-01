/**
 * FeatureTest.jsx — Human-Like Feature Testing  (System Admin only)
 *
 * UI matches screenshot:
 *  • Two tabs: Basic Audit | Login Automation
 *  • Prominent Website URL + Username/Email + Password fields
 *  • Quick-check pills below (Uptime Monitor, Speed Analysis, SSL Check, etc.)
 *  • Live terminal log + per-feature score rings on run
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

// ── Score Ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score = 0, size = 60 }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)" }} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill={color}
        fontSize={size * 0.22} fontWeight="800"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {score}
      </text>
    </svg>
  );
}

// ── Live log ───────────────────────────────────────────────────────────────────
function LiveLog({ log }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [log]);
  return (
    <div ref={ref} style={{
      background: "#060810", border: "1px solid rgba(99,102,241,0.18)",
      borderRadius: 10, padding: "12px 14px", maxHeight: 180,
      overflowY: "auto", fontFamily: "'Courier New',monospace", fontSize: 12, lineHeight: 1.7,
    }}>
      {log.length === 0 && <span style={{ color: "#1e293b" }}>◻ Waiting for test engine…</span>}
      {log.map((e, i) => (
        <div key={i} style={{ color: "#94a3b8", display: "flex", gap: 8 }}>
          <span style={{ color: "#334155", flexShrink: 0 }}>{e.ts ? e.ts.slice(11, 19) : ""}</span>
          <span style={{ color: "#6366f1" }}>▶</span>
          <span>{e.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── Feature result card ────────────────────────────────────────────────────────
function FeatureCard({ result, delay = 0 }) {
  const [open, setOpen] = useState(false);
  const meta = FEATURE_META[result.feature] || { emoji: "🔧", label: result.label || result.feature, color: "#6366f1" };
  const STATUS_COL = { pass: "#22c55e", partial: "#eab308", fail: "#ef4444", skip: "#475569" };
  const col = STATUS_COL[result.status] || "#475569";
  return (
    <div style={{ background: `${col}10`, border: `1px solid ${col}44`, borderRadius: 12, overflow: "hidden", animation: `slideUp 0.3s ease ${delay}s both` }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{meta.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{meta.label}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{result.message}</div>
        </div>
        <ScoreRing score={result.score} size={54} />
        <span style={{ color: "#475569", fontSize: 16, marginLeft: 4 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${col}33`, padding: "10px 16px 14px" }}>
          {result.steps.map((s, i) => {
            const dc = STATUS_COL[s.status] || "#475569";
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: dc, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0" }}>{s.action}</div>
                  {s.detail && <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{s.detail}</div>}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: `${dc}22`, color: dc, textTransform: "uppercase" }}>{s.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Summary banner ────────────────────────────────────────────────────────────
function SummaryBanner({ data, onReset }) {
  const { overall_score = 0, summary = "", passed = 0, partial = 0, failed = 0, total_features = 0 } = data;
  return (
    <div style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.08))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 16, padding: "22px 24px", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
      <ScoreRing score={overall_score} size={88} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 3 }}>Feature Test Complete</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, lineHeight: 1.6 }}>{summary}</div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {[["Passed", passed, "#22c55e"], ["Partial", partial, "#eab308"], ["Failed", failed, "#ef4444"], ["Total", total_features, "#6366f1"]].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: c }}>{v}</div>
              <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onReset} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8" }}>🔁 Test Again</button>
    </div>
  );
}

// ── Admin lock screen ─────────────────────────────────────────────────────────
function AdminLock() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>👑</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>Admin Only Feature</h2>
      <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 400, lineHeight: 1.7 }}>
        Human-Like Feature Testing is available to <strong style={{ color: "#f59e0b" }}>System Administrators</strong> only.<br />
        Contact <strong style={{ color: "#818cf8" }}>admin@testverse.com</strong> for access.
      </p>
    </div>
  );
}

// ─── Quick-check pills ────────────────────────────────────────────────────────
const QUICK_CHECKS = [
  { icon: "🌐", label: "Uptime Monitor" },
  { icon: "⚡", label: "Speed Analysis" },
  { icon: "🔒", label: "SSL Check" },
  { icon: "🔗", label: "Broken Links" },
  { icon: "📱", label: "Mobile Friendly" },
  { icon: "🛠", label: "JS Errors" },
];

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
export default function FeatureTest() {
  const { authFetch, user } = useAuth();

  const [tab, setTab] = useState("login"); // "basic" | "login"
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");

  const [phase, setPhase] = useState("idle"); // idle|running|done|error
  const [log, setLog] = useState([]);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  // Admin check
  const [isAdmin, setIsAdmin] = useState(null); // null=loading

  const wsRef = useRef(null);
  const pollJobRef = useRef(null);

  // ── Admin check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    authFetch(`${API}/rbac/my-role`)
      .then(r => r.json())
      .then(d => setIsAdmin(d.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, [user, authFetch]);

  // ── Poll fallback ──────────────────────────────────────────────────────────
  const pollJob = useCallback((jid) => {
    const iv = setInterval(async () => {
      try {
        const res = await authFetch(`${API}/feature-test/${jid}`);
        const data = await res.json();
        if (data.partial_results?.length) setResults(data.partial_results);
        if (data.log?.length) setLog(data.log);
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
  pollJobRef.current = pollJob;

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const connectWS = useCallback((jid) => {
    const ws = new WebSocket(`${WS}/feature-test/${jid}/ws`);
    wsRef.current = ws;
    const safety = setTimeout(() => {
      ws.close();
      setLog(l => [...l, { ts: new Date().toISOString(), msg: "⚠️ WS timeout — polling..." }]);
      pollJobRef.current?.(jid);
    }, 5 * 60 * 1000);

    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        if (d.type === "ping") {
          setLog(l => {
            const last = l[l.length - 1];
            const msg = `⏳ Still running... (${d.status})`;
            if (last?._ping) return [...l.slice(0, -1), { ts: new Date().toISOString(), msg, _ping: true }];
            return [...l, { ts: new Date().toISOString(), msg, _ping: true }];
          });
          return;
        }
        if (d.use_poll) { clearTimeout(safety); ws.close(); pollJobRef.current?.(jid); return; }
        if (d.message || d.msg) setLog(l => [...l, { ts: new Date().toISOString(), msg: d.message || d.msg }]);
        if (d.log?.length) setLog(d.log);
        if (d.feature_result) setResults(prev => {
          const idx = prev.findIndex(r => r.feature === d.feature_result.feature);
          if (idx >= 0) { const c = [...prev]; c[idx] = d.feature_result; return c; }
          return [...prev, d.feature_result];
        });
        if (d.partial_results?.length) setResults(d.partial_results);
        if (d.done || d.type === "done") {
          clearTimeout(safety);
          if (d.result) { setResults(d.result.results || []); setSummary(d.result); }
          setPhase("done"); ws.close();
        }
        if (d.type === "snapshot") {
          if (d.partial_results?.length) setResults(d.partial_results);
          if (d.log?.length) setLog(d.log);
          if (d.done && d.result) { clearTimeout(safety); setResults(d.result.results || []); setSummary(d.result); setPhase("done"); ws.close(); }
        }
      } catch { }
    };
    ws.onerror = () => { clearTimeout(safety); setLog(l => [...l, { ts: new Date().toISOString(), msg: "⚠️ WS error — polling..." }]); pollJobRef.current?.(jid); };
    ws.onclose = (ev) => {
      clearTimeout(safety);
      setPhase(prev => {
        if (prev === "done" || prev === "error") return prev;
        setLog(l => [...l, { ts: new Date().toISOString(), msg: `🔄 Closed (${ev.code}) — polling...` }]);
        pollJobRef.current?.(jid);
        return "running";
      });
    };
  }, []);

  // ── Run test ───────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!url.trim() || phase === "running") return;
    setPhase("running"); setLog([]); setResults([]); setSummary(null); setErrMsg("");
    const body = { url: url.trim() };
    if (tab === "login" && email.trim()) { body.email = email.trim(); body.password = password.trim(); }
    try {
      const res = await authFetch(`${API}/feature-test/run`, { method: "POST", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.detail || "Failed to start test"); setPhase("error"); return; }
      setLog([{ ts: new Date().toISOString(), msg: `▶ Job started: ${data.job_id}` }]);
      connectWS(data.job_id);
    } catch (e) { setErrMsg(e.message || "Network error"); setPhase("error"); }
  };

  const handleReset = () => {
    wsRef.current?.close();
    setPhase("idle"); setLog([]); setResults([]); setSummary(null); setErrMsg("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans',sans-serif", color: "#e2e8f0", padding: "32px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes slideUp  { from { opacity:0;transform:translateY(14px) } to { opacity:1;transform:translateY(0) } }
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes spin     { to { transform:rotate(360deg) } }
        input:focus,select:focus { outline:none; }
        ::-webkit-scrollbar { width:5px; background:#060810 }
        ::-webkit-scrollbar-thumb { background:#1e2840; border-radius:4px }
        .run-btn:hover { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 8px 28px rgba(99,102,241,.5)!important; }
        .run-btn:active { transform:scale(0.98); }
        .tab-btn:hover { background:rgba(255,255,255,0.05)!important; }
        .quick-pill:hover { background:rgba(99,102,241,0.1)!important; border-color:rgba(99,102,241,0.35)!important; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, animation: "slideUp 0.35s ease" }}>
          <div style={{ fontSize: 13, color: "#475569", marginBottom: 6, letterSpacing: "0.08em", fontWeight: 700, textTransform: "uppercase" }}>
            No setup required.
          </div>
        </div>

        {/* Admin check spinner */}
        {isAdmin === null && (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
            <div style={{ width: 32, height: 32, margin: "0 auto 10px", border: "3px solid rgba(99,102,241,.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
            Verifying admin access…
          </div>
        )}

        {isAdmin === false && <AdminLock />}

        {isAdmin === true && (
          <>
            {/* Main card */}
            <div style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 20,
              overflow: "hidden",
              marginBottom: 20,
              animation: "slideUp 0.4s ease",
            }}>

              {/* Tab strip */}
              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {[
                  { key: "basic", label: "Basic Audit" },
                  { key: "login", label: "Login Automation" },
                ].map(t => (
                  <button
                    key={t.key}
                    className="tab-btn"
                    onClick={() => setTab(t.key)}
                    style={{
                      flex: 1, padding: "14px 0", border: "none",
                      background: tab === t.key ? "rgba(99,102,241,0.12)" : "transparent",
                      color: tab === t.key ? "#c4b5fd" : "#6b7280",
                      fontWeight: tab === t.key ? 700 : 500,
                      fontSize: 14, cursor: "pointer",
                      borderBottom: tab === t.key ? "2px solid #6366f1" : "2px solid transparent",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                  >{t.label}</button>
                ))}
              </div>

              {/* Form */}
              {phase === "idle" && (
                <div style={{ padding: "28px 28px 24px" }}>

                  {/* URL */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>
                      WEBSITE URL
                    </div>
                    <input
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://example.com/login"
                      style={{
                        width: "100%", padding: "13px 16px", borderRadius: 10, boxSizing: "border-box",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#f1f5f9", fontSize: 14, fontFamily: "inherit",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                  </div>

                  {/* Credentials (only on login tab) */}
                  {tab === "login" && (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>
                          USERNAME / EMAIL
                        </div>
                        <input
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="user@example.com"
                          style={{
                            width: "100%", padding: "13px 16px", borderRadius: 10, boxSizing: "border-box",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#f1f5f9", fontSize: 14, fontFamily: "inherit",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                        />
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>
                          PASSWORD
                        </div>
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPass(e.target.value)}
                          placeholder="••••••••"
                          style={{
                            width: "100%", padding: "13px 16px", borderRadius: 10, boxSizing: "border-box",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#f1f5f9", fontSize: 14, fontFamily: "inherit",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                        />
                      </div>
                    </>
                  )}

                  {errMsg && (
                    <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 13 }}>⚠️ {errMsg}</div>
                  )}

                  <button
                    className="run-btn"
                    onClick={handleRun}
                    disabled={!url.trim()}
                    style={{
                      width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 15, fontWeight: 700,
                      border: "none", cursor: url.trim() ? "pointer" : "not-allowed",
                      background: url.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,0.2)",
                      color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: url.trim() ? "0 4px 20px rgba(99,102,241,0.35)" : "none",
                      transition: "all 0.2s", fontFamily: "inherit",
                    }}
                  >
                    {tab === "login" ? "Run Login Test ⚡" : "Run Basic Audit ⚡"}
                  </button>
                </div>
              )}

              {/* Running */}
              {phase === "running" && (
                <div style={{ padding: "24px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid rgba(99,102,241,.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>Analyzing & Testing Features…</div>
                      <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{log.length > 0 ? log[log.length - 1].msg : "Initializing…"}</div>
                    </div>
                  </div>
                  <LiveLog log={log} />
                  {results.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Results so far ({results.length})</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {results.map((r, i) => <FeatureCard key={r.feature} result={r} delay={i * 0.05} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {phase === "error" && (
                <div style={{ padding: "28px", textAlign: "center" }}>
                  <div style={{ fontSize: 38, marginBottom: 8 }}>❌</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#f87171" }}>Test Failed</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{errMsg}</div>
                  <button onClick={handleReset} style={{ marginTop: 16, padding: "9px 22px", borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🔁 Try Again</button>
                </div>
              )}

              {/* Done */}
              {phase === "done" && summary && (
                <div style={{ padding: "24px 28px" }}>
                  <SummaryBanner data={summary} onReset={handleReset} />
                  {results.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Feature Results ({results.length})</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {results.map((r, i) => <FeatureCard key={r.feature} result={r} delay={i * 0.06} />)}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 12, padding: 24, textAlign: "center" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔎</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#f87171" }}>No Features Detected</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{summary.summary || "Try adding login credentials or check if the site requires authentication."}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick-check pills */}
            {phase === "idle" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", animation: "fadeIn 0.5s ease" }}>
                {QUICK_CHECKS.map(q => (
                  <div key={q.label} className="quick-pill" style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 16px", borderRadius: 24,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 13, color: "#6b7280", cursor: "default",
                    fontWeight: 500, transition: "all 0.15s",
                  }}>
                    <span>{q.icon}</span>
                    {q.label}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
