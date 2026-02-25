import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";


const PRESET_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#06b6d4"];

export default function WhiteLabel() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company_name: "", logo_url: "", primary_color: "#6366f1",
    accent_color: "#8b5cf6", report_footer: "", hide_testverse_branding: false,
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    authFetch(`${API}/whitelabel/config`)
      .then(r => r.json())
      .then(d => { if (d.configured && d.config) setForm(f => ({ ...f, ...d.config })); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [authFetch]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const r = await authFetch(`${API}/whitelabel/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const previewGradient = `linear-gradient(135deg, ${form.primary_color}, ${form.accent_color})`;

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>White-Label Branding</h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Customise how your reports and share pages appear to clients</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Company name */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
                <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>Company Name</label>
                <input type="text" placeholder="Acme Corp" value={form.company_name}
                  onChange={e => set("company_name", e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>Appears on PDF reports and share pages instead of "TestVerse"</div>
              </div>

              {/* Logo URL */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
                <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>Logo URL</label>
                <input type="url" placeholder="https://yoursite.com/logo.png" value={form.logo_url}
                  onChange={e => set("logo_url", e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                {form.logo_url && (
                  <img src={form.logo_url} alt="Logo preview" onError={e => e.target.style.display = "none"}
                    style={{ marginTop: 10, maxHeight: 40, maxWidth: 160, objectFit: "contain", borderRadius: 6 }} />
                )}
              </div>

              {/* Colors */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
                <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 14 }}>Brand Colors</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Primary Color", key: "primary_color" },
                    { label: "Accent Color", key: "accent_color" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{label}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        <input type="color" value={form[key]} onChange={e => set(key, e.target.value)}
                          style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", background: "none", padding: 0 }} />
                        <input type="text" value={form[key]} onChange={e => set(key, e.target.value)}
                          style={{ flex: 1, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "monospace" }} />
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {PRESET_COLORS.map(c => (
                          <div key={c} onClick={() => set(key, c)}
                            style={{ width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer", border: form[key] === c ? "2px solid #fff" : "2px solid transparent", transition: "border 0.15s" }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report footer */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
                <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>Report Footer Text</label>
                <textarea placeholder="e.g. Prepared by Acme Corp QA Team · Confidential" value={form.report_footer}
                  onChange={e => set("report_footer", e.target.value)} rows={2}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>

              {/* Hide branding toggle */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Hide TestVerse branding</div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>Remove "Powered by TestVerse" from reports and share pages</div>
                </div>
                <div onClick={() => set("hide_testverse_branding", !form.hide_testverse_branding)}
                  style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background 0.2s", flexShrink: 0, background: form.hide_testverse_branding ? "#6366f1" : "rgba(255,255,255,0.1)", position: "relative" }}>
                  <div style={{ position: "absolute", top: 3, left: form.hide_testverse_branding ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                </div>
              </div>

              {/* Save */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 1, padding: "12px", borderRadius: 10, background: previewGradient, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : "Save Branding →"}
                </button>
                {saved && <span style={{ color: "#10b981", fontSize: 13, fontWeight: 600 }}>✓ Saved!</span>}
                {error && <span style={{ color: "#f87171", fontSize: 13 }}>{error}</span>}
              </div>
            </div>

            {/* Live preview */}
            <div style={{ position: "sticky", top: 80 }}>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Preview</div>
              <div style={{ background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden" }}>
                {/* Mock report header */}
                <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="" onError={e => e.target.style.display = "none"}
                      style={{ height: 24, maxWidth: 80, objectFit: "contain" }} />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: previewGradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>⚡</div>
                  )}
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>
                    {form.company_name || "TestVerse"}
                  </span>
                </div>

                <div style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Website Health Report</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", marginBottom: 12 }}>https://example.com</div>

                  {/* Fake score */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: previewGradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff" }}>82</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Excellent</div>
                      <div style={{ fontSize: 11, color: "#4b5563" }}>Overall health score</div>
                    </div>
                  </div>

                  {/* Fake bars */}
                  {["Speed", "SSL", "SEO", "Security"].map((c, i) => {
                    const w = [88, 100, 72, 65][i];
                    return (
                      <div key={c} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>{c}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: form.primary_color }}>{w}</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${w}%`, background: previewGradient, borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Footer */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 10, color: "#374151" }}>
                    {form.report_footer || (form.hide_testverse_branding ? "" : "Powered by TestVerse")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
