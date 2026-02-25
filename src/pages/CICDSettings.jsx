import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const INPUT = {
  width: "100%", boxSizing: "border-box", padding: "11px 14px",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 10, fontSize: "0.9rem", color: "#e2e8f0",
  fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border 0.15s",
};
const LABEL = { display: "block", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 };
const CARD  = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px" };
const HINT  = { fontSize: 12, color: "#374151", marginTop: 6 };

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
      <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 999, position: "relative", background: checked ? "#6366f1" : "rgba(255,255,255,0.1)", border: `1px solid ${checked ? "#6366f1" : "rgba(255,255,255,0.15)"}`, transition: "background 0.2s", flexShrink: 0, cursor: "pointer" }}>
        <div style={{ position: "absolute", top: 2, left: checked ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
      </div>
      <span style={{ fontSize: 13, color: "#9ca3af" }}>{label}</span>
    </label>
  );
}

function InfoBox({ color = "#6366f1", title, children }) {
  return (
    <div style={{ padding: "14px 16px", background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 10 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>{title}</div>}
      <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function SaveBtn({ saving, status, onClick }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 10, border: "none",
      background: status === "success" ? "rgba(16,185,129,0.15)" : status === "error" ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg,#6366f1,#818cf8)",
      color: status === "success" ? "#34d399" : status === "error" ? "#f87171" : "#fff",
      fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.2s",
      boxShadow: status === "idle" ? "0 2px 12px rgba(99,102,241,0.3)" : "none",
    }}>
      {saving ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> : status === "success" ? "✅" : status === "error" ? "❌" : "💾"}
      {saving ? "Saving..." : status === "success" ? "Saved!" : status === "error" ? "Failed" : "Save Configuration"}
    </button>
  );
}

const TABS = [{ id: "github", label: "GitHub", icon: "🐙" }, { id: "gitlab", label: "GitLab", icon: "🦊" }, { id: "jira", label: "Jira", icon: "🔷" }, { id: "postman", label: "Postman", icon: "📮" }];

export default function CICDSettings() {
  const { authFetch, user } = useAuth();
  const [tab, setTab]     = useState("github");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("idle");
  const [gh, setGh] = useState({ webhook_secret: "", auto_trigger: true });
  const [gl, setGl] = useState({ webhook_token: "", auto_trigger: true });
  const [jira, setJira] = useState({ domain: "", email: "", api_token: "", project_key: "" });
  const [jiraTesting, setJiraTesting] = useState(false);
  const [jiraResult, setJiraResult] = useState("");
  const [pmFile, setPmFile] = useState(null);
  const [pmUrl, setPmUrl] = useState("");
  const [pmImporting, setPmImporting] = useState(false);
  const [pmImports, setPmImports] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [r1, r2, r3] = await Promise.all([authFetch(`${API}/cicd/github/config`), authFetch(`${API}/cicd/gitlab/config`), authFetch(`${API}/cicd/postman/imports`)]);
        if (r1.ok) { const d = await r1.json(); if (d.webhook_secret) setGh(d); }
        if (r2.ok) { const d = await r2.json(); if (d.webhook_token) setGl(d); }
        if (r3.ok) { const d = await r3.json(); setPmImports(d.imports || []); }
      } catch {}
    };
    load();
  }, []);

  const flash = (s) => { setStatus(s); setTimeout(() => setStatus("idle"), 3000); };
  const post = async (url, body) => { setSaving(true); try { const r = await authFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); flash(r.ok ? "success" : "error"); } catch { flash("error"); } finally { setSaving(false); } };

  const uid = user?.id || user?.sub || "YOUR_USER_ID";
  const wb = `${window.location.origin}/api/cicd`;

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -80, right: "15%", width: 500, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)", filter: "blur(50px)" }} />
      </div>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚙️</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.7px", background: "linear-gradient(135deg,#e2e8f0 0%,#94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>CI/CD Integrations</h1>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#4b5563" }}>Configure your development workflow integrations</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 8px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === t.id ? "rgba(99,102,241,0.22)" : "transparent", color: tab === t.id ? "#818cf8" : "#6b7280", fontSize: 13, fontWeight: 600, transition: "all 0.15s", borderBottom: tab === t.id ? "2px solid #6366f1" : "2px solid transparent" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* GitHub */}
        {tab === "github" && (
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🐙 GitHub Webhook</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={LABEL}>Webhook Secret</label>
                <input type="password" value={gh.webhook_secret} onChange={e => setGh({ ...gh, webhook_secret: e.target.value })} placeholder="Enter your GitHub webhook secret" style={INPUT} onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
                <div style={HINT}>Generate in GitHub repo settings → Webhooks</div>
              </div>
              <Toggle checked={gh.auto_trigger} onChange={v => setGh({ ...gh, auto_trigger: v })} label="Automatically trigger tests on push events" />
              <InfoBox color="#6366f1" title="Webhook URL">
                <code style={{ color: "#a78bfa" }}>{wb}/github/webhook/{uid}</code>
                <div style={{ marginTop: 6 }}>Set content type to <code>application/json</code> in GitHub webhook settings.</div>
              </InfoBox>
              <SaveBtn saving={saving} status={status} onClick={() => post(`${API}/cicd/github/config`, gh)} />
            </div>
          </div>
        )}

        {/* GitLab */}
        {tab === "gitlab" && (
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🦊 GitLab Webhook</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={LABEL}>Webhook Token</label>
                <input type="password" value={gl.webhook_token} onChange={e => setGl({ ...gl, webhook_token: e.target.value })} placeholder="Enter your GitLab webhook token" style={INPUT} onFocus={e => e.target.style.borderColor = "rgba(249,115,22,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
                <div style={HINT}>Generate in GitLab project settings → Webhooks</div>
              </div>
              <Toggle checked={gl.auto_trigger} onChange={v => setGl({ ...gl, auto_trigger: v })} label="Automatically trigger tests on push events" />
              <InfoBox color="#f97316" title="Webhook URL">
                <code style={{ color: "#fb923c" }}>{wb}/gitlab/webhook/{uid}</code>
                <div style={{ marginTop: 6 }}>Enable <code>Push events</code> in GitLab project webhook settings.</div>
              </InfoBox>
              <SaveBtn saving={saving} status={status} onClick={() => post(`${API}/cicd/gitlab/config`, gl)} />
            </div>
          </div>
        )}

        {/* Jira */}
        {tab === "jira" && (
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🔷 Jira Integration</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[{ k: "domain", l: "Jira Domain", p: "yourcompany.atlassian.net", t: "text" }, { k: "email", l: "Email", p: "you@company.com", t: "email" }, { k: "api_token", l: "API Token", p: "Your Jira API token", t: "password" }, { k: "project_key", l: "Project Key", p: "PROJ", t: "text" }].map(({ k, l, p, t }) => (
                <div key={k}>
                  <label style={LABEL}>{l}</label>
                  <input type={t} value={jira[k]} onChange={e => setJira({ ...jira, [k]: e.target.value })} placeholder={p} style={INPUT} onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
                </div>
              ))}
              {jiraResult && <div style={{ padding: "10px 14px", background: jiraResult.startsWith("✅") ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${jiraResult.startsWith("✅") ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: 8, fontSize: 13, color: jiraResult.startsWith("✅") ? "#34d399" : "#f87171" }}>{jiraResult}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={async () => { setJiraTesting(true); setJiraResult(""); try { const r = await authFetch(`${API}/cicd/jira/test`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(jira) }); const d = await r.json(); setJiraResult(r.ok ? "✅ Connection successful!" : `❌ ${d.error || "Failed"}`); } catch { setJiraResult("❌ Connection failed"); } finally { setJiraTesting(false); } }} disabled={jiraTesting} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {jiraTesting ? "Testing..." : "🔌 Test Connection"}
                </button>
                <SaveBtn saving={saving} status={status} onClick={() => post(`${API}/cicd/jira/config`, jira)} />
              </div>
            </div>
          </div>
        )}

        {/* Postman */}
        {tab === "postman" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={CARD}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>📮 Import Postman Collection</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={LABEL}>Upload Collection File</label>
                  <div onClick={() => document.getElementById("pm-file").click()} style={{ border: `2px dashed ${pmFile ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "32px", textAlign: "center", cursor: "pointer", background: pmFile ? "rgba(16,185,129,0.04)" : "transparent", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>{pmFile ? "✅" : "📂"}</div>
                    {pmFile ? <div style={{ fontSize: 14, color: "#34d399", fontWeight: 600 }}>{pmFile.name}</div> : <div style={{ fontSize: 13, color: "#6b7280" }}>Click to upload .json collection</div>}
                    <input id="pm-file" type="file" accept=".json" style={{ display: "none" }} onChange={e => setPmFile(e.target.files[0])} />
                  </div>
                  {pmFile && <button onClick={async () => { setPmImporting(true); try { const fd = new FormData(); fd.append("file", pmFile); const r = await authFetch(`${API}/cicd/postman/import`, { method: "POST", body: fd }); if (r.ok) { setPmFile(null); flash("success"); } else flash("error"); } catch { flash("error"); } finally { setPmImporting(false); } }} disabled={pmImporting} style={{ marginTop: 10, padding: "9px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {pmImporting ? "Importing..." : "📥 Import File"}
                  </button>}
                </div>
                <div>
                  <label style={LABEL}>Import from URL</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input type="url" value={pmUrl} onChange={e => setPmUrl(e.target.value)} placeholder="https://..." style={{ ...INPUT, flex: 1 }} onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
                    <button onClick={async () => { if (!pmUrl) return; setPmImporting(true); try { const r = await authFetch(`${API}/cicd/postman/import-url`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: pmUrl }) }); if (r.ok) { setPmUrl(""); flash("success"); } else flash("error"); } catch { flash("error"); } finally { setPmImporting(false); } }} disabled={!pmUrl || pmImporting} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: pmUrl ? "linear-gradient(135deg,#6366f1,#818cf8)" : "rgba(99,102,241,0.2)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: pmUrl ? "pointer" : "not-allowed" }}>
                      {pmImporting ? "..." : "Import"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {pmImports.length > 0 && (
              <div style={CARD}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📋 Past Imports</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pmImports.map((imp, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{imp.name || imp.filename}</div>
                        <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>{imp.test_count} tests · {new Date(imp.imported_at).toLocaleDateString()}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: "3px 9px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 999, color: "#34d399" }}>✅ Imported</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
