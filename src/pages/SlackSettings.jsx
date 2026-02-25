import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function SlackSettings() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [config, setConfig]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [webhookUrl, setWebhookUrl]           = useState("");
  const [notifyComplete, setNotifyComplete]   = useState(true);
  const [notifyDrop, setNotifyDrop]           = useState(true);
  const [threshold, setThreshold]             = useState(60);

  const [saveMsg, setSaveMsg]   = useState("");
  const [saveErr, setSaveErr]   = useState("");
  const [testMsg, setTestMsg]   = useState("");
  const [testErr, setTestErr]   = useState("");

  const configured = !!config;

  useEffect(() => {
    authFetch(`${API}/slack/config`)
      .then(r => r.json())
      .then(d => {
        if (d.configured && d.config) {
          setConfig(d.config);
          setWebhookUrl(d.config.webhook_url || "");
          setNotifyComplete(d.config.notify_on_complete ?? true);
          setNotifyDrop(d.config.notify_on_score_drop ?? true);
          setThreshold(d.config.score_threshold ?? 60);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authFetch]);

  const handleSave = async () => {
    if (!webhookUrl.trim()) { setSaveErr("Webhook URL is required"); return; }
    setSaving(true); setSaveMsg(""); setSaveErr("");
    try {
      const r = await authFetch(`${API}/slack/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: webhookUrl.trim(),
          notify_on_complete: notifyComplete,
          notify_on_score_drop: notifyDrop,
          score_threshold: threshold,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Save failed");
      setConfig(d.config);
      setSaveMsg("✓ Slack settings saved successfully");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) { setSaveErr(e.message); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestMsg(""); setTestErr("");
    try {
      const r = await authFetch(`${API}/slack/test`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Test failed");
      setTestMsg("✓ Test ping sent! Check your Slack channel.");
      setTimeout(() => setTestMsg(""), 4000);
    } catch (e) { setTestErr(e.message); }
    finally { setTesting(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authFetch(`${API}/slack/config`, { method: "DELETE" });
      setConfig(null);
      setWebhookUrl(""); setNotifyComplete(true); setNotifyDrop(true); setThreshold(60);
    } catch (e) { setSaveErr(e.message); }
    finally { setDeleting(false); }
  };

  const navBtn = (label, path, active = false) => (
    <button key={label} onClick={() => navigate(path)} style={{
      padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500,
      background: active ? "rgba(99,102,241,0.15)" : "transparent",
      border: active ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
      color: active ? "#818cf8" : "#9ca3af",
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 70%)" }} />
      </div>


      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 32 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#4A154B"/>
                <path d="M13 8.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm0 2a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1z" fill="#E01E5A"/>
                <path d="M8.5 13a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zm2 0a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0z" fill="#36C5F0"/>
                <path d="M19 13a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zm2 0a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0z" fill="#2EB67D"/>
                <path d="M13 19a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zm2 0a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0z" fill="#ECB22E"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Slack Integration
            </h1>
          </div>
          <p style={{ color: "#4b5563", fontSize: 14, margin: 0 }}>Get notified in Slack when tests complete or scores drop below your threshold</p>
        </div>

        {/* Status banner */}
        {!loading && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
            borderRadius: 12, marginBottom: 28,
            background: configured ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
            border: `1px solid ${configured ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: configured ? "#10b981" : "#f59e0b", boxShadow: `0 0 8px ${configured ? "#10b981" : "#f59e0b"}` }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: configured ? "#10b981" : "#f59e0b" }}>
              {configured ? "Slack connected" : "Not connected — paste your webhook URL below"}
            </span>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        )}

        {!loading && (
          <>
            {/* Webhook URL */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px", marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>
                Incoming Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/T.../B.../..."
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
              />
              <div style={{ fontSize: 12, color: "#374151", marginTop: 8 }}>
                Get your webhook URL from{" "}
                <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer"
                  style={{ color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
                  Slack API → Incoming Webhooks →
                </a>
              </div>
            </div>

            {/* Notification toggles */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 18 }}>Notification Settings</div>

              {/* Toggle: notify on complete */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Notify on test complete</div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>Send a Slack message every time a test finishes</div>
                </div>
                <div onClick={() => setNotifyComplete(v => !v)}
                  style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
                    background: notifyComplete ? "#6366f1" : "rgba(255,255,255,0.1)",
                    position: "relative" }}>
                  <div style={{ position: "absolute", top: 3, left: notifyComplete ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                </div>
              </div>

              {/* Toggle: notify on score drop */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: notifyDrop ? 18 : 0, paddingBottom: notifyDrop ? 18 : 0, borderBottom: notifyDrop ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Alert on score drop</div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>Get an urgent alert when a score falls below your threshold</div>
                </div>
                <div onClick={() => setNotifyDrop(v => !v)}
                  style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
                    background: notifyDrop ? "#6366f1" : "rgba(255,255,255,0.1)",
                    position: "relative" }}>
                  <div style={{ position: "absolute", top: 3, left: notifyDrop ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                </div>
              </div>

              {/* Score threshold slider */}
              {notifyDrop && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af" }}>Score threshold</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: threshold >= 80 ? "#10b981" : threshold >= 60 ? "#f59e0b" : "#ef4444", letterSpacing: "-0.5px" }}>{threshold}</div>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "#374151" }}>0 — alert always</span>
                    <span style={{ fontSize: 11, color: "#374151" }}>100 — alert never</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 8 }}>
                    You'll get an alert whenever a score falls below <strong style={{ color: "#e2e8f0" }}>{threshold}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : configured ? "Update Settings" : "Save & Connect →"}
              </button>

              {configured && (
                <button onClick={handleTest} disabled={testing}
                  style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", fontSize: 14, fontWeight: 700, cursor: testing ? "not-allowed" : "pointer", opacity: testing ? 0.7 : 1 }}>
                  {testing ? "Sending…" : "⚡ Test Ping"}
                </button>
              )}

              {configured && (
                <button onClick={handleDelete} disabled={deleting}
                  style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  {deleting ? "Removing…" : "Disconnect"}
                </button>
              )}
            </div>

            {saveMsg && <div style={{ color: "#10b981", fontSize: 13, fontWeight: 600, padding: "10px 0" }}>{saveMsg}</div>}
            {saveErr && <div style={{ color: "#f87171", fontSize: 13, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>{saveErr}</div>}
            {testMsg && <div style={{ color: "#4ade80", fontSize: 13, fontWeight: 600, padding: "10px 0" }}>{testMsg}</div>}
            {testErr && <div style={{ color: "#f87171", fontSize: 13, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>{testErr}</div>}

            {/* How to get webhook URL guide */}
            <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "20px 22px", marginTop: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", marginBottom: 12 }}>How to get your Slack Webhook URL</div>
              {[
                "Go to api.slack.com/apps and click Create New App",
                "Choose 'From scratch', name it TestVerse, pick your workspace",
                "Click 'Incoming Webhooks' then toggle it On",
                "Click 'Add New Webhook to Workspace' and choose a channel",
                "Copy the Webhook URL and paste it above",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 4 ? 8 : 0, alignItems: "flex-start" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}