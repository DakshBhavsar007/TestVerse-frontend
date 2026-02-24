import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const NAV = [
  ["Dashboard", "/dashboard"], ["History", "/history"], ["Trends", "/trends"],
  ["Diff", "/diff"], ["Schedules", "/schedules"], ["Teams", "/teams"],
  ["Slack", "/slack"], ["API Keys", "/apikeys"], ["Bulk Test", "/bulk"],
  ["Branding", "/whitelabel"], ["Analytics", "/analytics"],
  ["Roles", "/roles"], ["Alerts", "/notifications"], ["Templates", "/templates"],
  ["Monitors", "/monitoring"], ["Reporting", "/reporting"], ["Billing", "/billing"],
  ["Compliance", "/compliance"], ["Dev Tools", "/devtools"], ["New Test", "/"],
];

function Navbar({ user, logout, active }) {
  const navigate = useNavigate();
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>TestVerse</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#6b7280", marginRight: 4 }}>{user?.email}</span>
        {NAV.map(([label, path]) => (
          <button key={label} onClick={() => navigate(path)} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 500,
            background: active === label ? "rgba(99,102,241,0.15)" : "transparent",
            border: active === label ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: active === label ? "#818cf8" : "#9ca3af",
          }}>{label}</button>
        ))}
        <button onClick={() => { logout(); navigate("/login"); }} style={{ padding: "5px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>Logout</button>
      </div>
    </nav>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 };
const codeBlock = { background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 18px", fontFamily: "monospace", fontSize: 12, color: "#a5b4fc", whiteSpace: "pre", overflowX: "auto", position: "relative" };
const input = { width: "100%", padding: "9px 13px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box", outline: "none" };
const lbl = { fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 5 };
const tabBtn = (active) => ({ padding: "8px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: 600, border: "none", background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)", color: active ? "#fff" : "#9ca3af" });

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ position: "absolute", top: 10, right: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
      {copied ? "✓ Copied" : "📋 Copy"}
    </button>
  );
}

// ── Code generators ────────────────────────────────────────────────────────────
function genPython(apiKey, url, opts) {
  return `from testverse_sdk import TestVerseClient, CIHelper

client = TestVerseClient(api_key="${apiKey || 'tv_your_key_here'}")

# Run a test and wait for result
result = client.run(
    "${url || 'https://example.com'}",
    wait=True,${opts.crawl ? "\n    crawl=True," : ""}${opts.checkLinks ? "" : "\n    check_links=False,"}${opts.checkMobile ? "" : "\n    check_mobile=False,"}
)

print(f"Score: {result.score}/100")
print(f"Status: {result.status}")
print(f"Broken links: {len(result.broken_links)}")
print(f"JS errors: {len(result.js_errors)}")

# Quality gate (raises AssertionError on failure)
ci = CIHelper(client)
ci.gate(
    "${url || 'https://example.com'}",
    min_score=${opts.minScore},
    fail_on_js_errors=${opts.failJs ? "True" : "False"},
    fail_on_broken_links=${opts.failLinks ? "True" : "False"},
)`;
}

function genJs(apiKey, url, opts) {
  return `import { TestVerseClient, CIHelper } from './testverse-sdk.js';

const client = new TestVerseClient({
  apiKey: '${apiKey || 'tv_your_key_here'}'
});

// Run a test and wait for result
const result = await client.run('${url || 'https://example.com'}', {
  wait: true,${opts.crawl ? "\n  crawl: true," : ""}${opts.checkLinks ? "" : "\n  checkLinks: false,"}${opts.checkMobile ? "" : "\n  checkMobile: false,"}
});

console.log(\`Score: \${result.score}/100\`);
console.log(\`Status: \${result.status}\`);
console.log(\`Broken links: \${result.brokenLinks.length}\`);

// Quality gate
const ci = new CIHelper(client);
await ci.gate('${url || 'https://example.com'}', {
  minScore: ${opts.minScore},
  failOnJsErrors: ${opts.failJs},
  failOnBrokenLinks: ${opts.failLinks},
});`;
}

function genCurl(apiKey, url) {
  return `# Run a test
curl -X POST "${API || 'http://localhost:8000'}/run" \\
  -H "X-API-Key: ${apiKey || 'tv_your_key_here'}" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "${url || 'https://example.com'}"}'

# Get result (replace TEST_ID)
curl "${API || 'http://localhost:8000'}/result/TEST_ID" \\
  -H "X-API-Key: ${apiKey || 'tv_your_key_here'}"

# List history
curl "${API || 'http://localhost:8000'}/history?limit=10" \\
  -H "X-API-Key: ${apiKey || 'tv_your_key_here'}"

# Export CSV (30 days)
curl "${API || 'http://localhost:8000'}/reporting/export/csv?days=30" \\
  -H "X-API-Key: ${apiKey || 'tv_your_key_here'}" \\
  -o testverse_export.csv`;
}

function genGitHubAction(apiKey, url, minScore) {
  return `name: TestVerse Quality Gate

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run TestVerse audit
        env:
          TESTVERSE_API_KEY: \${{ secrets.TESTVERSE_API_KEY }}
        run: |
          pip install requests
          python3 << 'EOF'
          from testverse_sdk import TestVerseClient, CIHelper
          import os

          client = TestVerseClient(api_key=os.environ["TESTVERSE_API_KEY"])
          ci = CIHelper(client)
          ci.gate(
              "${url || 'https://example.com'}",
              min_score=${minScore || 70},
              fail_on_js_errors=True,
          )
          EOF`;
}

// ── Assertion Builder ──────────────────────────────────────────────────────────
const ASSERTION_TYPES = [
  { value: "jsonpath", label: "JSONPath" },
  { value: "regex", label: "Regex Match" },
  { value: "status_code", label: "Status Code" },
  { value: "response_time", label: "Response Time (ms)" },
  { value: "contains", label: "Page Contains" },
  { value: "not_contains", label: "Page Not Contains" },
];
const OPERATORS = {
  jsonpath: ["equals", "contains", "matches", "gt", "lt", "gte", "lte", "exists", "not_exists"],
  regex: ["matches", "exists", "not_exists"],
  status_code: ["equals", "gt", "lt", "gte", "lte"],
  response_time: ["lt", "lte", "gt", "gte"],
  contains: ["equals"],
  not_contains: ["equals"],
};

export default function DevTools() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("sdk");
  const [sdkLang, setSdkLang] = useState("python");
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [codeUrl, setCodeUrl] = useState("https://example.com");
  const [opts, setOpts] = useState({ crawl: false, checkLinks: true, checkMobile: true, failJs: true, failLinks: false, minScore: 70 });
  const [copied, setCopied] = useState("");

  // Assertion builder
  const [rulesets, setRulesets] = useState([]);
  const [assertTypes, setAssertTypes] = useState([]);
  const [newRuleset, setNewRuleset] = useState({ name: "", url_pattern: "", assertions: [] });
  const [newAssertion, setNewAssertion] = useState({ name: "", type: "jsonpath", target: "$.score", operator: "gte", expected: "70" });
  const [savingRuleset, setSavingRuleset] = useState(false);
  const [rulesetMsg, setRulesetMsg] = useState("");

  // Validate form
  const [validateAssertion, setValidateAssertion] = useState({ type: "jsonpath", target: "$.score", operator: "gte", expected: "70", name: "Test" });
  const [validateData, setValidateData] = useState('{"score": 85, "status": "completed"}');
  const [validateResult, setValidateResult] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    loadKeys();
    loadRulesets();
    loadAssertTypes();
  }, []);

  async function loadKeys() {
    const r = await authFetch(`${API}/apikeys`);
    if (r.ok) { const d = await r.json(); setApiKeys(d.api_keys || []); if (d.api_keys?.length) setSelectedKey(d.api_keys[0].key_preview); }
  }
  async function loadRulesets() {
    const r = await authFetch(`${API}/assertions/rulesets`);
    if (r.ok) setRulesets((await r.json()).rulesets || []);
  }
  async function loadAssertTypes() {
    const r = await authFetch(`${API}/assertions/assertion-types`);
    if (r.ok) setAssertTypes((await r.json()).types || []);
  }

  async function saveRuleset() {
    if (!newRuleset.name || newRuleset.assertions.length === 0) return;
    setSavingRuleset(true); setRulesetMsg("");
    const res = await authFetch(`${API}/assertions/rulesets`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRuleset),
    });
    const d = await res.json();
    if (res.ok) { setRulesetMsg("✓ Rule set saved!"); setNewRuleset({ name: "", url_pattern: "", assertions: [] }); loadRulesets(); }
    else setRulesetMsg("✗ " + (d.detail || "Failed"));
    setSavingRuleset(false);
  }

  async function runValidate() {
    setValidating(true); setValidateResult(null);
    try {
      const data = JSON.parse(validateData);
      const res = await authFetch(`${API}/assertions/validate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assertion: { ...validateAssertion, assertion_id: "test" }, data }),
      });
      if (res.ok) setValidateResult((await res.json()).result);
    } catch (e) { setValidateResult({ error: e.message, passed: false }); }
    setValidating(false);
  }

  async function deleteRuleset(id) {
    await authFetch(`${API}/assertions/rulesets/${id}`, { method: "DELETE" });
    setRulesets(prev => prev.filter(r => r.ruleset_id !== id));
  }

  const code = sdkLang === "python" ? genPython(selectedKey, codeUrl, opts)
    : sdkLang === "javascript" ? genJs(selectedKey, codeUrl, opts)
    : sdkLang === "curl" ? genCurl(selectedKey, codeUrl)
    : genGitHubAction(selectedKey, codeUrl, opts.minScore);

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", bottom: -200, left: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)" }} />
      </div>
      <Navbar user={user} logout={logout} active="Dev Tools" />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 600 }}>DEVELOPER TOOLS</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, background: "linear-gradient(135deg,#fff 40%,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Dev Tools & SDK</h1>
          <p style={{ color: "#6b7280", marginTop: 8, fontSize: 15 }}>Code generators, CLI reference, assertion builder, and SDK documentation.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {[["sdk", "⚡ SDK & Code Gen"], ["cli", "💻 CLI Reference"], ["assertions", "🧪 Assertions"], ["validate", "🔬 Live Validator"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={tabBtn(tab === t)}>{l}</button>
          ))}
        </div>

        {/* SDK Tab */}
        {tab === "sdk" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
            <div style={card}>
              <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700 }}>⚙️ Configure</h3>
              <div style={{ marginBottom: 14 }}>
                <span style={lbl}>Language</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[["python","🐍 Python"], ["javascript","🟨 JS"], ["curl","🔧 cURL"], ["github","🐙 GitHub"]].map(([l, n]) => (
                    <button key={l} onClick={() => setSdkLang(l)} style={{ ...tabBtn(sdkLang === l), fontSize: 11, padding: "5px 10px" }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <span style={lbl}>API Key</span>
                <select value={selectedKey} onChange={e => setSelectedKey(e.target.value)} style={{ ...input, cursor: "pointer" }}>
                  <option value="">Select a key</option>
                  {apiKeys.map(k => <option key={k.key_id} value={k.key_preview}>{k.name || k.key_preview}</option>)}
                  <option value="tv_your_key_here">Use placeholder</option>
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <span style={lbl}>Target URL</span>
                <input value={codeUrl} onChange={e => setCodeUrl(e.target.value)} style={input} />
              </div>
              {(sdkLang === "python" || sdkLang === "javascript" || sdkLang === "github") && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <span style={lbl}>Min Score</span>
                    <input type="number" min="0" max="100" value={opts.minScore} onChange={e => setOpts(p => ({ ...p, minScore: parseInt(e.target.value) }))} style={input} />
                  </div>
                  {[["crawl","Enable crawl"], ["checkLinks","Check links"], ["checkMobile","Check mobile"], ["failJs","Fail on JS errors"], ["failLinks","Fail on broken links"]].map(([k, lbl2]) => (
                    <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9ca3af", cursor: "pointer", marginBottom: 8 }}>
                      <input type="checkbox" checked={opts[k]} onChange={e => setOpts(p => ({ ...p, [k]: e.target.checked }))} style={{ width: 14, height: 14 }} />
                      {lbl2}
                    </label>
                  ))}
                </>
              )}
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Generated Code</h3>
                <button onClick={() => { navigator.clipboard.writeText(code); setCopied("code"); setTimeout(() => setCopied(""), 2000); }}
                  style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  {copied === "code" ? "✓ Copied!" : "📋 Copy Code"}
                </button>
              </div>
              <div style={{ ...codeBlock, minHeight: 360 }}>{code}</div>

              {(sdkLang === "python" || sdkLang === "javascript") && (
                <div style={{ ...card, marginTop: 16 }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>📥 Download SDK</h4>
                  <div style={{ display: "flex", gap: 10 }}>
                    <a href={`${API}/sdk/download/python`} style={{ flex: 1, padding: "10px", borderRadius: 9, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", fontSize: 13, textAlign: "center", textDecoration: "none", fontWeight: 600 }}>⬇ testverse-sdk.py</a>
                    <a href={`${API}/sdk/download/javascript`} style={{ flex: 1, padding: "10px", borderRadius: 9, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", fontSize: 13, textAlign: "center", textDecoration: "none", fontWeight: 600 }}>⬇ testverse-sdk.js</a>
                    <a href={`${API}/sdk/download/cli`} style={{ flex: 1, padding: "10px", borderRadius: 9, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", fontSize: 13, textAlign: "center", textDecoration: "none", fontWeight: 600 }}>⬇ testverse-cli.py</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLI Tab */}
        {tab === "cli" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              ["🚀 Installation", `pip install requests playwright\npython testverse-cli.py login --email you@example.com`],
              ["▶ Run a Test", `# Basic test\npython testverse-cli.py run https://example.com --wait\n\n# With CI/CD threshold\npython testverse-cli.py run https://example.com --wait --fail-below 70 --output result.json`],
              ["📜 History & Export", `# View history\npython testverse-cli.py history --limit 20\n\n# Export CSV\npython testverse-cli.py export csv --days 30 --output report.csv`],
              ["📦 Bulk Testing", `# Test multiple URLs\npython testverse-cli.py bulk https://a.com https://b.com --wait`],
              ["📡 Monitors", `# List monitors\npython testverse-cli.py monitors list\n\n# Trigger a check\npython testverse-cli.py monitors check <monitor_id>`],
              ["🧪 Assertions", `# Run a ruleset against a test result\npython testverse-cli.py assert --ruleset <id> --result <test_id> --fail-on-error`],
            ].map(([title, code2]) => (
              <div key={title} style={card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{title}</div>
                <div style={{ ...codeBlock, minHeight: "unset" }}>
                  <CopyButton text={code2} />
                  {code2}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assertions Tab */}
        {tab === "assertions" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={card}>
              <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700 }}>➕ New Rule Set</h3>
              <div style={{ marginBottom: 12 }}>
                <span style={lbl}>Rule Set Name</span>
                <input placeholder="Homepage Quality Checks" value={newRuleset.name} onChange={e => setNewRuleset(p => ({ ...p, name: e.target.value }))} style={input} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={lbl}>URL Pattern (optional)</span>
                <input placeholder="example.com" value={newRuleset.url_pattern} onChange={e => setNewRuleset(p => ({ ...p, url_pattern: e.target.value }))} style={input} />
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Add Assertion</div>
                <div style={{ marginBottom: 10 }}>
                  <span style={lbl}>Name</span>
                  <input value={newAssertion.name} onChange={e => setNewAssertion(p => ({ ...p, name: e.target.value }))} style={input} placeholder="Score must be ≥ 70" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div>
                    <span style={lbl}>Type</span>
                    <select value={newAssertion.type} onChange={e => setNewAssertion(p => ({ ...p, type: e.target.value, operator: "equals" }))} style={{ ...input, cursor: "pointer" }}>
                      {ASSERTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <span style={lbl}>Operator</span>
                    <select value={newAssertion.operator} onChange={e => setNewAssertion(p => ({ ...p, operator: e.target.value }))} style={{ ...input, cursor: "pointer" }}>
                      {(OPERATORS[newAssertion.type] || ["equals"]).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <span style={lbl}>Target (JSONPath / regex / string)</span>
                  <input value={newAssertion.target} onChange={e => setNewAssertion(p => ({ ...p, target: e.target.value }))} style={input} placeholder="$.score" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={lbl}>Expected Value</span>
                  <input value={newAssertion.expected} onChange={e => setNewAssertion(p => ({ ...p, expected: e.target.value }))} style={input} placeholder="70" />
                </div>
                <button onClick={() => {
                  if (!newAssertion.name) return;
                  setNewRuleset(p => ({ ...p, assertions: [...p.assertions, { ...newAssertion, assertion_id: Date.now().toString() }] }));
                  setNewAssertion({ name: "", type: "jsonpath", target: "$.score", operator: "gte", expected: "70" });
                }} style={{ width: "100%", padding: "8px", borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                  + Add Assertion
                </button>
              </div>

              {newRuleset.assertions.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>ASSERTIONS ({newRuleset.assertions.length})</div>
                  {newRuleset.assertions.map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(99,102,241,0.08)", borderRadius: 8, marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{a.type} · {a.target} {a.operator} {a.expected}</div>
                      </div>
                      <button onClick={() => setNewRuleset(p => ({ ...p, assertions: p.assertions.filter((_, j) => j !== i) }))}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {rulesetMsg && <div style={{ marginBottom: 12, fontSize: 13, color: rulesetMsg.startsWith("✓") ? "#10b981" : "#ef4444" }}>{rulesetMsg}</div>}
              <button onClick={saveRuleset} disabled={savingRuleset || !newRuleset.name || newRuleset.assertions.length === 0}
                style={{ width: "100%", padding: "11px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: savingRuleset ? 0.7 : 1 }}>
                {savingRuleset ? "Saving..." : "💾 Save Rule Set"}
              </button>
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>📋 Saved Rule Sets</h3>
              {rulesets.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#6b7280", fontSize: 13 }}>No rule sets yet. Create one to get started.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {rulesets.map(r => (
                    <div key={r.ruleset_id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{r.assertion_count} assertion{r.assertion_count !== 1 ? "s" : ""}{r.url_pattern ? ` · ${r.url_pattern}` : ""}</div>
                        </div>
                        <button onClick={() => deleteRuleset(r.ruleset_id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: 4 }}>🗑</button>
                      </div>
                      {r.last_pass_rate !== null && (
                        <div style={{ marginTop: 8, display: "flex", gap: 12, fontSize: 12 }}>
                          <span style={{ color: r.last_pass_rate === 100 ? "#10b981" : "#f59e0b" }}>Last pass rate: {r.last_pass_rate}%</span>
                          <span style={{ color: "#6b7280" }}>Runs: {r.run_count}</span>
                        </div>
                      )}
                      <div style={{ marginTop: 10 }}>
                        <code style={{ fontSize: 11, color: "#6b7280" }}>ID: {r.ruleset_id}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Validate Tab */}
        {tab === "validate" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={card}>
              <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700 }}>🔬 Live Assertion Tester</h3>
              <div style={{ marginBottom: 12 }}>
                <span style={lbl}>Assertion Type</span>
                <select value={validateAssertion.type} onChange={e => setValidateAssertion(p => ({ ...p, type: e.target.value }))} style={{ ...input, cursor: "pointer" }}>
                  {ASSERTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={lbl}>Target (JSONPath / regex / string)</span>
                <input value={validateAssertion.target} onChange={e => setValidateAssertion(p => ({ ...p, target: e.target.value }))} style={input} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={lbl}>Operator</span>
                <select value={validateAssertion.operator} onChange={e => setValidateAssertion(p => ({ ...p, operator: e.target.value }))} style={{ ...input, cursor: "pointer" }}>
                  {(OPERATORS[validateAssertion.type] || ["equals"]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={lbl}>Expected</span>
                <input value={validateAssertion.expected} onChange={e => setValidateAssertion(p => ({ ...p, expected: e.target.value }))} style={input} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <span style={lbl}>Test Data (JSON)</span>
                <textarea value={validateData} onChange={e => setValidateData(e.target.value)}
                  rows={6} style={{ ...input, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
              </div>
              <button onClick={runValidate} disabled={validating} style={{ width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
                {validating ? "Running..." : "▶ Run Assertion"}
              </button>
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700 }}>📊 Result</h3>
              {!validateResult && (
                <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔬</div>
                  <div style={{ fontSize: 14 }}>Configure an assertion and click Run to test it live.</div>
                </div>
              )}
              {validateResult && (
                <div>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: validateResult.passed ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 20px" }}>
                    {validateResult.passed ? "✅" : "❌"}
                  </div>
                  <div style={{ textAlign: "center", fontWeight: 800, fontSize: 22, marginBottom: 24, color: validateResult.passed ? "#10b981" : "#ef4444" }}>
                    {validateResult.passed ? "Assertion Passed" : "Assertion Failed"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      ["Type", validateResult.type],
                      ["Operator", validateResult.operator],
                      ["Expected", String(validateResult.expected)],
                      ["Actual", validateResult.actual !== undefined ? String(validateResult.actual) : "—"],
                      validateResult.error ? ["Error", validateResult.error] : null,
                    ].filter(Boolean).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{k}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: k === "Error" ? "#ef4444" : k === "Actual" && !validateResult.passed ? "#f59e0b" : "#e2e8f0" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
