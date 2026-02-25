import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

/* ── palette & shared styles ── */
const C = {
  bg: "#080b12",
  surface: "#0d1117",
  card: "#111827",
  border: "#1f2937",
  accent: "#6366f1",
  accentDim: "rgba(99,102,241,0.15)",
  accentBorder: "rgba(99,102,241,0.35)",
  green: "#10b981",
  red: "#ef4444",
  yellow: "#f59e0b",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  text: "#f9fafb",
  muted: "#6b7280",
  sub: "#9ca3af",
};

const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "History", path: "/history" },
  { label: "Analytics", path: "/analytics" },
  { label: "Trends", path: "/trends" },
  { label: "Schedules", path: "/schedules" },
  { label: "Teams", path: "/teams" },
  { label: "Monitoring", path: "/monitoring" },
  { label: "Reporting", path: "/reporting" },
  { label: "Billing", path: "/billing" },
  { label: "Compliance", path: "/compliance" },
  { label: "Dev Tools", path: "/devtools" },
  { label: "🤖 AI", path: "/ai" },
];

const TABS = [
  { id: "suggestions", icon: "💡", label: "Test Suggestions" },
  { id: "anomalies", icon: "🚨", label: "Anomaly Detection" },
  { id: "nltest", icon: "💬", label: "NL → API Test" },
  { id: "chat", icon: "🧠", label: "AI Chat" },
];

/* ── helpers ── */
const badge = (color, text) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}55`,
    borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
  }}>{text}</span>
);

const severityColor = (s) => ({ critical: C.red, warning: C.yellow, info: C.blue }[s] || C.muted);
const priorityColor = (p) => ({ high: C.red, medium: C.yellow, low: C.green }[p] || C.muted);
const categoryColor = (c) => ({
  security: C.red, coverage: C.blue, "edge-case": C.purple, performance: C.yellow
}[c] || C.muted);

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function AI() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("suggestions");
  const [aiStatus, setAiStatus] = useState(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");

  // Anomalies state
  const [anomalies, setAnomalies] = useState(null);
  const [anomaliesLoading, setAnomaliesLoading] = useState(false);
  const [anomaliesError, setAnomaliesError] = useState("");

  // NL Test state
  const [nlPrompt, setNlPrompt] = useState("");
  const [nlBaseUrl, setNlBaseUrl] = useState("");
  const [nlResult, setNlResult] = useState(null);
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState("");

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "👋 Hi! I'm TestVerse AI. Ask me anything about your API tests, failures, or how to improve your coverage." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get("/api/ai/status").then(r => setAiStatus(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  /* ── fetch history helper ── */
  async function fetchHistory() {
    const r = await api.get("/api/history?limit=50");
    return r.data?.results || r.data || [];
  }

  /* ── Suggestions ── */
  async function runSuggestions() {
    setSuggestionsLoading(true); setSuggestionsError(""); setSuggestions(null);
    try {
      const history = await fetchHistory();
      const r = await api.post("/api/ai/suggestions", { history });
      setSuggestions(r.data);
    } catch (e) {
      setSuggestionsError(e?.response?.data?.detail || "Failed to generate suggestions.");
    } finally { setSuggestionsLoading(false); }
  }

  /* ── Anomalies ── */
  async function runAnomalies() {
    setAnomaliesLoading(true); setAnomaliesError(""); setAnomalies(null);
    try {
      const history = await fetchHistory();
      const r = await api.post("/api/ai/anomalies", { history });
      setAnomalies(r.data);
    } catch (e) {
      setAnomaliesError(e?.response?.data?.detail || "Failed to detect anomalies.");
    } finally { setAnomaliesLoading(false); }
  }

  /* ── NL to Test ── */
  async function runNlTest() {
    if (!nlPrompt.trim()) return;
    setNlLoading(true); setNlError(""); setNlResult(null);
    try {
      const r = await api.post("/api/ai/nl-to-test", {
        prompt: nlPrompt,
        base_url: nlBaseUrl || null,
      });
      setNlResult(r.data);
    } catch (e) {
      setNlError(e?.response?.data?.detail || "Failed to convert to test.");
    } finally { setNlLoading(false); }
  }

  /* ── Chat ── */
  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const history = await fetchHistory().catch(() => []);
      const r = await api.post("/api/ai/chat", {
        message: msg,
        context: { recent_tests: history.slice(0, 10) }
      });
      setChatMessages(prev => [...prev, { role: "assistant", content: r.data.reply }]);
    } catch (e) {
      setChatMessages(prev => [...prev, {
        role: "assistant", content: "⚠️ " + (e?.response?.data?.detail || "Something went wrong.")
      }]);
    } finally { setChatLoading(false); }
  }

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.surface}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        .nav-link { color: ${C.muted}; text-decoration: none; font-size: 13px; transition: color 0.2s; white-space: nowrap; }
        .nav-link:hover { color: ${C.text}; }
        .nav-link.active { color: ${C.accent}; }
        .tab-btn { border: none; cursor: pointer; transition: all 0.2s; border-radius: 8px; }
        .tab-btn:hover { opacity: 0.85; }
        .action-btn { border: none; cursor: pointer; border-radius: 8px; font-family: inherit; font-weight: 600; transition: all 0.2s; }
        .action-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .card { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 12px; }
        .nl-input { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.text}; border-radius: 8px; font-family: inherit; outline: none; transition: border-color 0.2s; resize: vertical; }
        .nl-input:focus { border-color: ${C.accent}; }
        .chat-input { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.text}; border-radius: 8px; font-family: inherit; outline: none; }
        .chat-input:focus { border-color: ${C.accent}; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* NAV */}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🤖</span>
            <h1 style={{ fontSize: 26, fontWeight: 700 }}>AI Intelligence</h1>
            {aiStatus && (
              <span style={{
                background: aiStatus.configured ? C.green + "22" : C.yellow + "22",
                color: aiStatus.configured ? C.green : C.yellow,
                border: `1px solid ${aiStatus.configured ? C.green : C.yellow}55`,
                borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600
              }}>
                {aiStatus.configured ? "● AI Ready" : "⚠ Setup Required"}
              </span>
            )}
          </div>
          <p style={{ color: C.muted, fontSize: 14 }}>
            GPT-4o powered test intelligence — suggestions, anomaly detection, and natural language test generation
          </p>
          {aiStatus && !aiStatus.configured && (
            <div style={{ marginTop: 12, background: C.yellow + "11", border: `1px solid ${C.yellow}33`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.yellow }}>
              ⚠️ Add <code style={{ background: "#ffffff11", padding: "1px 6px", borderRadius: 4 }}>OPENAI_API_KEY=sk-...</code> to your <code style={{ background: "#ffffff11", padding: "1px 6px", borderRadius: 4 }}>backend/.env</code> to enable AI features.
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)} style={{
              padding: "9px 18px", fontSize: 13, fontFamily: "inherit", fontWeight: 600,
              background: tab === t.id ? C.accent : C.card,
              color: tab === t.id ? "#fff" : C.muted,
              border: `1px solid ${tab === t.id ? C.accent : C.border}`,
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: SUGGESTIONS ── */}
        {tab === "suggestions" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>💡 AI Test Suggestions</h2>
                <p style={{ color: C.muted, fontSize: 13 }}>Analyzes your last 50 test runs and suggests new tests to improve coverage</p>
              </div>
              <button className="action-btn" onClick={runSuggestions} disabled={suggestionsLoading} style={{
                background: C.accent, color: "#fff", padding: "10px 20px", fontSize: 14,
              }}>
                {suggestionsLoading ? <span className="spin" style={{ display: "inline-block" }}>⟳</span> : "✨ Analyze & Suggest"}
              </button>
            </div>

            {suggestionsError && (
              <div style={{ background: C.red + "11", border: `1px solid ${C.red}33`, borderRadius: 8, padding: 14, color: C.red, marginBottom: 16 }}>
                {suggestionsError}
              </div>
            )}

            {suggestionsLoading && (
              <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
                <div className="spin" style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
                <div>Analyzing test history with GPT-4o...</div>
              </div>
            )}

            {suggestions && !suggestionsLoading && (
              <div>
                {suggestions.summary && (
                  <div style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
                    📊 <strong>Analysis:</strong> {suggestions.summary}
                  </div>
                )}
                <div style={{ display: "grid", gap: 14 }}>
                  {(suggestions.suggestions || []).map((s, i) => (
                    <div key={i} className="card fade-in" style={{ padding: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {badge(priorityColor(s.priority), s.priority?.toUpperCase())}
                          {badge(categoryColor(s.category), s.category)}
                        </div>
                      </div>
                      <p style={{ color: C.sub, fontSize: 13, marginBottom: 12 }}>{s.description}</p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ background: C.accentDim, color: C.accent, borderRadius: 4, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{s.method}</span>
                        <code style={{ color: C.sub, fontSize: 12, background: "#ffffff08", padding: "3px 8px", borderRadius: 4 }}>{s.url}</code>
                        <span style={{ color: C.muted, fontSize: 12 }}>→ {s.expected_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!suggestions && !suggestionsLoading && (
              <div style={{ textAlign: "center", padding: 60, color: C.muted, background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
                <div style={{ fontSize: 16, marginBottom: 6 }}>Ready to analyze your tests</div>
                <div style={{ fontSize: 13 }}>Click "Analyze & Suggest" to get AI-powered recommendations</div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ANOMALIES ── */}
        {tab === "anomalies" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🚨 Anomaly Detection</h2>
                <p style={{ color: C.muted, fontSize: 13 }}>Detects unusual patterns, performance regressions, and reliability issues</p>
              </div>
              <button className="action-btn" onClick={runAnomalies} disabled={anomaliesLoading} style={{
                background: C.red, color: "#fff", padding: "10px 20px", fontSize: 14,
              }}>
                {anomaliesLoading ? <span className="spin" style={{ display: "inline-block" }}>⟳</span> : "🔍 Scan for Anomalies"}
              </button>
            </div>

            {anomaliesError && (
              <div style={{ background: C.red + "11", border: `1px solid ${C.red}33`, borderRadius: 8, padding: 14, color: C.red, marginBottom: 16 }}>
                {anomaliesError}
              </div>
            )}

            {anomaliesLoading && (
              <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
                <div className="spin" style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
                <div>Running statistical analysis + GPT-4o anomaly detection...</div>
              </div>
            )}

            {anomalies && !anomaliesLoading && (
              <div>
                {/* Health Score */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {[
                    { label: "Health Score", value: `${anomalies.health_score ?? "--"}%`, color: anomalies.health_score >= 80 ? C.green : anomalies.health_score >= 60 ? C.yellow : C.red },
                    { label: "Anomalies Found", value: anomalies.anomalies?.length ?? 0, color: anomalies.anomalies?.length === 0 ? C.green : C.red },
                    { label: "Avg Response", value: anomalies.stats?.response_time ? `${anomalies.stats.response_time.mean}ms` : "--", color: C.blue },
                  ].map((m, i) => (
                    <div key={i} className="card" style={{ padding: 18, textAlign: "center" }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {anomalies.summary && (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 14 }}>
                    {anomalies.summary}
                  </div>
                )}

                {anomalies.anomalies?.length === 0 && (
                  <div style={{ textAlign: "center", padding: 40, color: C.green, background: C.green + "11", borderRadius: 12, border: `1px solid ${C.green}33` }}>
                    ✅ No anomalies detected! Your API tests look healthy.
                  </div>
                )}

                <div style={{ display: "grid", gap: 14 }}>
                  {(anomalies.anomalies || []).map((a, i) => (
                    <div key={i} className="card fade-in" style={{ padding: 18, borderLeft: `3px solid ${severityColor(a.severity)}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{a.title}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {badge(severityColor(a.severity), a.severity?.toUpperCase())}
                          {badge(C.purple, a.type?.replace(/_/g, " "))}
                          {a.metric && <span style={{ color: C.muted, fontSize: 12, alignSelf: "center" }}>{a.metric}</span>}
                        </div>
                      </div>
                      <p style={{ color: C.sub, fontSize: 13, marginBottom: 10 }}>{a.description}</p>
                      {a.affected_urls?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          {a.affected_urls.map((u, j) => (
                            <code key={j} style={{ display: "block", fontSize: 11, color: C.muted, background: "#ffffff08", padding: "2px 8px", borderRadius: 4, marginBottom: 3 }}>{u}</code>
                          ))}
                        </div>
                      )}
                      {a.recommendation && (
                        <div style={{ background: C.accentDim, borderRadius: 6, padding: "8px 12px", fontSize: 13, color: C.sub }}>
                          💡 {a.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!anomalies && !anomaliesLoading && (
              <div style={{ textAlign: "center", padding: 60, color: C.muted, background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🚨</div>
                <div style={{ fontSize: 16, marginBottom: 6 }}>Anomaly scanner ready</div>
                <div style={{ fontSize: 13 }}>Click "Scan for Anomalies" to analyze patterns in your test history</div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: NL TO TEST ── */}
        {tab === "nltest" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>💬 Natural Language → API Test</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Describe what you want to test in plain English and get a complete test configuration</p>

            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, color: C.sub, marginBottom: 6 }}>Describe your test *</label>
              <textarea
                className="nl-input"
                rows={4}
                value={nlPrompt}
                onChange={e => setNlPrompt(e.target.value)}
                placeholder={'Examples:\n• "Test that the login endpoint returns 200 with valid credentials"\n• "Check that /api/users requires authentication and returns 401 without a token"\n• "Test the product search with an empty query and expect a 400 error"'}
                style={{ width: "100%", padding: 12, fontSize: 13, marginBottom: 14 }}
              />
              <label style={{ display: "block", fontSize: 13, color: C.sub, marginBottom: 6 }}>Base URL (optional)</label>
              <input
                className="nl-input"
                value={nlBaseUrl}
                onChange={e => setNlBaseUrl(e.target.value)}
                placeholder="https://api.yourapp.com"
                style={{ width: "100%", padding: 10, fontSize: 13, marginBottom: 14 }}
              />
              <button className="action-btn" onClick={runNlTest} disabled={nlLoading || !nlPrompt.trim()} style={{
                background: C.purple, color: "#fff", padding: "11px 24px", fontSize: 14,
              }}>
                {nlLoading ? <span className="spin" style={{ display: "inline-block" }}>⟳</span> : "⚡ Generate Test"}
              </button>

              {/* Example prompts */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Try an example:</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    "Test that login returns 200 with valid email and password",
                    "Check that creating a user without auth returns 401",
                    "Verify the health endpoint responds under 200ms",
                  ].map(ex => (
                    <button key={ex} onClick={() => setNlPrompt(ex)} style={{
                      background: C.surface, border: `1px solid ${C.border}`, color: C.sub,
                      borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    }}>{ex}</button>
                  ))}
                </div>
              </div>
            </div>

            {nlError && (
              <div style={{ background: C.red + "11", border: `1px solid ${C.red}33`, borderRadius: 8, padding: 14, color: C.red, marginBottom: 16 }}>
                {nlError}
              </div>
            )}

            {nlLoading && (
              <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
                <div className="spin" style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
                <div>GPT-4o is generating your test configuration...</div>
              </div>
            )}

            {nlResult && !nlLoading && (
              <div className="fade-in">
                <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>✅ {nlResult.test_name}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ background: C.accentDim, color: C.accent, borderRadius: 4, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{nlResult.method}</span>
                      <span style={{ color: nlResult.expected_status < 400 ? C.green : C.red, fontSize: 13 }}>→ {nlResult.expected_status}</span>
                    </div>
                  </div>
                  <p style={{ color: C.sub, fontSize: 13, marginBottom: 16 }}>{nlResult.description}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>URL</div>
                      <code style={{ fontSize: 12, color: C.accent, wordBreak: "break-all" }}>{nlResult.url}</code>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>Timeout</div>
                      <span style={{ fontSize: 13 }}>{nlResult.timeout_ms}ms</span>
                    </div>
                  </div>

                  {nlResult.headers && Object.keys(nlResult.headers).length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>Headers</div>
                      <pre style={{ background: C.surface, borderRadius: 6, padding: 10, fontSize: 11, overflow: "auto", color: C.sub }}>
                        {JSON.stringify(nlResult.headers, null, 2)}
                      </pre>
                    </div>
                  )}

                  {nlResult.body && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>Request Body</div>
                      <pre style={{ background: C.surface, borderRadius: 6, padding: 10, fontSize: 11, overflow: "auto", color: C.sub }}>
                        {JSON.stringify(nlResult.body, null, 2)}
                      </pre>
                    </div>
                  )}

                  {nlResult.assertions?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Assertions ({nlResult.assertions.length})</div>
                      {nlResult.assertions.map((a, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, fontSize: 13 }}>
                          <span style={{ color: C.green }}>✓</span>
                          <span style={{ color: C.sub }}>{a.description}</span>
                          <span style={{ color: C.muted, fontSize: 11 }}>({a.type})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {nlResult.tags?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {nlResult.tags.map(t => (
                        <span key={t} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, color: C.muted }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {nlResult.follow_up_tests?.length > 0 && (
                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: C.sub }}>💡 Suggested Follow-up Tests</div>
                    {nlResult.follow_up_tests.map((f, i) => (
                      <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < nlResult.follow_up_tests.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{f.title}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{f.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CHAT ── */}
        {tab === "chat" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🧠 AI Chat Assistant</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Ask anything about your API tests, failures, patterns, or testing strategy</p>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "75%", padding: "12px 16px", borderRadius: 12,
                    background: m.role === "user" ? C.accent : C.card,
                    border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
                    fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                    borderBottomRightRadius: m.role === "user" ? 2 : 12,
                    borderBottomLeftRadius: m.role === "assistant" ? 2 : 12,
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex" }}>
                  <div className="card" style={{ padding: "12px 16px", borderRadius: 12, borderBottomLeftRadius: 2 }}>
                    <span className="pulse">●●●</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="chat-input"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Ask about your tests, failures, patterns... (Enter to send)"
                style={{ flex: 1, padding: "12px 16px", fontSize: 14 }}
              />
              <button className="action-btn" onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{
                background: C.accent, color: "#fff", padding: "12px 20px", fontSize: 14,
              }}>
                {chatLoading ? <span className="spin" style={{ display: "inline-block" }}>⟳</span> : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
