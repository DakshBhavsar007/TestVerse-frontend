import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const NAV = [
  ["Dashboard", "/dashboard"], ["History", "/history"], ["Trends", "/trends"],
  ["Diff", "/diff"], ["Schedules", "/schedules"], ["Teams", "/teams"],
  ["Slack", "/slack"], ["API Keys", "/apikeys"], ["Bulk Test", "/bulk"],
  ["Branding", "/whitelabel"], ["Analytics", "/analytics"],
  ["Roles", "/roles"], ["Alerts", "/notifications"], ["Templates", "/templates"], ["Monitors", "/monitoring"],
  ["New Test", "/"],
];

function Navbar({ user, logout, active }) {
  const navigate = useNavigate();
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>TestVerse</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
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

export default function ApiKeys() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [keys, setKeys]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [newName, setNewName]   = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey]     = useState(null);   // shown once after creation
  const [copied, setCopied]     = useState(false);
  const [error, setError]       = useState("");
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    authFetch(`${API}/apikeys`)
      .then(r => r.json()).then(d => setKeys(d.keys || []))
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [authFetch]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true); setError(""); setNewKey(null);
    try {
      const r = await authFetch(`${API}/apikeys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed to create key");
      setNewKey(d);
      setKeys(prev => [...prev, { key_id: d.key_id, name: d.name, key_preview: d.preview, created_at: d.created_at, last_used: null, active: true }]);
      setNewName("");
    } catch (e) { setError(e.message); }
    finally { setCreating(false); }
  };

  const handleRevoke = async (key_id) => {
    setRevoking(key_id);
    try {
      const r = await authFetch(`${API}/apikeys/${key_id}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail); }
      setKeys(prev => prev.filter(k => k.key_id !== key_id));
      if (newKey?.key_id === key_id) setNewKey(null);
    } catch (e) { setError(e.message); }
    finally { setRevoking(null); }
  };

  const copyKey = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
      </div>
      <Navbar user={user} logout={logout} active="API Keys" />

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>API Keys</h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Use API keys to integrate TestVerse into your CI/CD pipeline</p>
        </div>

        {/* New key banner — shown once */}
        {newKey && (
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 16, padding: "20px 24px", marginBottom: 24, animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>✓ Key created — copy it now, it won't be shown again!</div>
              <button onClick={() => setNewKey(null)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <code style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e2e8f0", wordBreak: "break-all", fontFamily: "monospace" }}>
                {newKey.key}
              </code>
              <button onClick={copyKey} style={{ flexShrink: 0, padding: "10px 18px", borderRadius: 8, background: copied ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)", border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "rgba(99,102,241,0.4)"}`, color: copied ? "#10b981" : "#818cf8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Create new key */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>Generate New Key</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text" placeholder='e.g. "GitHub Actions", "Staging CI"'
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none" }} />
            <button onClick={handleCreate} disabled={creating || !newName.trim()}
              style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", opacity: creating || !newName.trim() ? 0.6 : 1, flexShrink: 0 }}>
              {creating ? "Creating…" : "Generate →"}
            </button>
          </div>
          {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</div>}
        </div>

        {/* How to use */}
        <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "18px 22px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", marginBottom: 10 }}>Usage — add to any API request:</div>
          <code style={{ display: "block", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#a5b4fc", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
{`# Run a test via API
curl -X POST ${API}/run \\
  -H "X-API-Key: tv_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://yoursite.com"}'`}
          </code>
        </div>

        {/* Keys list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : keys.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#374151" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
            <p style={{ fontSize: 14 }}>No API keys yet. Generate your first one above.</p>
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 140px 80px", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(99,102,241,0.06)" }}>
              {["Name / Preview", "Created", "Last Used", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
              ))}
            </div>
            {keys.map((k, i) => (
              <div key={k.key_id} style={{ display: "grid", gridTemplateColumns: "1fr 180px 140px 80px", padding: "14px 20px", alignItems: "center", borderBottom: i < keys.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{k.name}</div>
                  <code style={{ fontSize: 11, color: "#4b5563", fontFamily: "monospace" }}>{k.key_preview}</code>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{(k.created_at || "").slice(0, 10)}</div>
                <div style={{ fontSize: 12, color: k.last_used ? "#9ca3af" : "#374151" }}>
                  {k.last_used ? (k.last_used || "").slice(0, 10) : "Never used"}
                </div>
                <div>
                  <button onClick={() => handleRevoke(k.key_id)} disabled={revoking === k.key_id}
                    style={{ padding: "5px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: revoking === k.key_id ? 0.5 : 1 }}>
                    {revoking === k.key_id ? "…" : "Revoke"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
