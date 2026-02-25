import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";


const TYPE_ICONS = { basic: "🧪", login: "🔐", api: "⚡", custom: "⚙️" };

const CHECK_LABELS = [
  ["check_broken_links", "Broken Links"],
  ["check_images",       "Missing Images"],
  ["check_js_errors",    "JS Errors"],
  ["check_mobile",       "Mobile Responsive"],
  ["check_ssl",          "SSL Certificate"],
];

export default function Templates() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates]       = useState([]);
  const [selected, setSelected]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [applying, setApplying]         = useState(null);
  const [exporting, setExporting]       = useState(false);
  const [error, setError]               = useState("");
  const [applyUrl, setApplyUrl]         = useState("");
  const [applyUsername, setApplyUsername] = useState("");
  const [applyPassword, setApplyPassword] = useState("");
  const [applyResult, setApplyResult]   = useState(null);

  useEffect(() => {
    authFetch(`${API}/templates/?include_public=true`)
      .then(r => r.json())
      .then(d => setTemplates(d.templates || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [authFetch]);

  const handleApply = async (templateId) => {
    if (!applyUrl.trim()) { setError("Enter a URL first."); return; }
    setApplying(templateId); setError(""); setApplyResult(null);
    try {
      const r = await authFetch(`${API}/templates/apply`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, url: applyUrl, username: applyUsername || null, password: applyPassword || null }),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Failed to apply");
      const data = await r.json();
      setApplyResult(data);
    } catch (e) { setError(e.message); }
    finally { setApplying(null); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const ids = templates.filter(t => !t.is_builtin).map(t => t.template_id);
      const r = await authFetch(`${API}/templates/export`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_ids: ids, format: "json" }),
      });
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "templates_export.json"; a.click();
    } catch (e) { setError(e.message); }
    finally { setExporting(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", bottom: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              📄 Test Templates
            </h1>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Reusable test configurations — apply to any URL instantly</p>
          </div>
          <button onClick={handleExport} disabled={exporting}
            style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontSize: 14, cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.6 : 1 }}>
            {exporting ? "Exporting…" : "⬇ Export My Templates"}
          </button>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

        {/* Apply section */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px", marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>🚀 Apply a Template</div>
          <div style={{ display: "flex", gap: 12, marginBottom: selected?.type === "login" ? 16 : 0 }}>
            <input type="url" value={applyUrl} onChange={e => setApplyUrl(e.target.value)} placeholder="https://example.com"
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none" }} />
          </div>
          {selected?.type === "login" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input type="text" value={applyUsername} onChange={e => setApplyUsername(e.target.value)} placeholder="Username / email"
                style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none" }} />
              <input type="password" value={applyPassword} onChange={e => setApplyPassword(e.target.value)} placeholder="Password"
                style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none" }} />
            </div>
          )}
          {!selected && <div style={{ fontSize: 12, color: "#374151", marginTop: 10 }}>← Select a template below, then click Apply.</div>}
          {applyResult && (
            <div style={{ marginTop: 14, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#10b981" }}>
              ✓ Template applied! Config ready — check the console for full output.
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : (<>

          {/* Template grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {templates.map(t => {
              const isSel = selected?.template_id === t.template_id;
              return (
                <div key={t.template_id} onClick={() => setSelected(isSel ? null : t)}
                  style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${isSel ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: "20px 22px", cursor: "pointer", transition: "border-color 0.15s", boxShadow: isSel ? "0 0 0 2px rgba(99,102,241,0.15)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ fontSize: 30 }}>{TYPE_ICONS[t.type] || "🧪"}</div>
                    {t.is_builtin && (
                      <div style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", fontSize: 11, color: "#818cf8", fontWeight: 600 }}>Built-in</div>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.description}</div>
                  {t.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                      {t.tags.map(tag => (
                        <div key={tag} style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "#6b7280" }}>#{tag}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 12, color: "#374151" }}>⭐ {t.use_count || 0} uses</div>
                    <button onClick={e => { e.stopPropagation(); setSelected(t); handleApply(t.template_id); }}
                      disabled={applying === t.template_id}
                      style={{ padding: "6px 14px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: applying === t.template_id ? "not-allowed" : "pointer", opacity: applying === t.template_id ? 0.7 : 1 }}>
                      {applying === t.template_id ? "…" : "▶ Apply"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {templates.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#374151" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 14 }}>No templates available yet.</p>
            </div>
          )}

          {/* Selected template detail */}
          {selected && (
            <div style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: "22px 24px", animation: "fadeIn 0.2s ease" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#818cf8", marginBottom: 18 }}>📋 {selected.name} — Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 10 }}>CHECKS ENABLED</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {CHECK_LABELS.map(([key, label]) => (
                      <div key={key} style={{ fontSize: 13, color: selected[key] ? "#10b981" : "#374151" }}>
                        {selected[key] ? "✅" : "○"} {label}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 10 }}>CONFIGURATION</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#9ca3af" }}>
                    <div>Type: <span style={{ color: "#e2e8f0" }}>{selected.type}</span></div>
                    <div>Crawl: <span style={{ color: "#e2e8f0" }}>{selected.crawl_enabled ? `Yes (${selected.max_crawl_pages} pages)` : "No"}</span></div>
                    {selected.schedule_enabled && <div>Schedule: <span style={{ color: "#e2e8f0" }}>{selected.schedule_cron}</span></div>}
                    <div>Visibility: <span style={{ color: "#e2e8f0" }}>{selected.visibility || "private"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </>)}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
