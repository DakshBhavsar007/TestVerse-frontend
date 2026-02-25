import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const POPULAR = [
  { name: "Petstore (OpenAPI 3)", url: "https://petstore3.swagger.io/api/v3/openapi.json" },
  { name: "Petstore (Swagger 2)", url: "https://petstore.swagger.io/v2/swagger.json" },
];

const METHOD_COLORS = {
  GET:    { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  color: "#34d399" },
  POST:   { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  color: "#818cf8" },
  PUT:    { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  color: "#fbbf24" },
  PATCH:  { bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)",  color: "#fb923c" },
  DELETE: { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   color: "#f87171" },
  HEAD:   { bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.3)", color: "#9ca3af" },
};

const INPUT_STYLE = {
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 10, fontSize: "0.9rem",
  color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif",
  outline: "none", transition: "border 0.15s",
};

function MethodBadge({ method }) {
  const c = METHOD_COLORS[method] || METHOD_COLORS.HEAD;
  return (
    <span style={{
      display: "inline-block", padding: "3px 9px", borderRadius: 6,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, fontSize: 11, fontWeight: 800,
      letterSpacing: "0.06em", flexShrink: 0,
    }}>{method}</span>
  );
}

export default function OpenAPIImport() {
  const { authFetch } = useAuth();
  const [tab, setTab]             = useState("url");
  const [url, setUrl]             = useState("");
  const [baseUrl, setBaseUrl]     = useState("");
  const [pasteText, setPaste]     = useState("");
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [expanded, setExpanded]   = useState({});
  const [selected, setSelected]   = useState({});
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [dragOver, setDragOver]   = useState(false);

  const toggle       = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const toggleSelect = (id) => setSelected(p => ({ ...p, [id]: !p[id] }));
  const selectAll    = () => { const a = {}; result?.generated_tests.forEach(t => { a[t.id] = true; }); setSelected(a); };
  const deselectAll  = () => setSelected({});
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const canImport = (tab === "url" && url) || (tab === "file" && file) || (tab === "paste" && pasteText);

  async function doImport() {
    setLoading(true); setError(""); setResult(null);
    try {
      let res;
      if (tab === "url") {
        res = await authFetch(`${API}/openapi/import/url`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, base_url: baseUrl || undefined }),
        });
      } else if (tab === "file") {
        const fd = new FormData();
        fd.append("file", file);
        if (baseUrl) fd.append("base_url", baseUrl);
        res = await authFetch(`${API}/openapi/import/file`, { method: "POST", body: fd });
      } else {
        res = await authFetch(`${API}/openapi/import/text`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(JSON.parse(pasteText)),
        });
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Import failed"); }
      const data = await res.json();
      setResult(data);
      const a = {}; data.generated_tests.forEach(t => { a[t.id] = true; }); setSelected(a);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function sendToTestVerse() {
    const tests = result.generated_tests.filter(t => selected[t.id]);
    if (!tests.length) return;
    setImporting(true);
    try {
      await Promise.all(tests.map(t =>
        authFetch(`${API}/run`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: t.url, method: t.method, headers: t.headers, body: t.body ? JSON.stringify(t.body) : undefined, name: t.name, tags: t.tags }),
        })
      ));
      setImportDone(true);
    } catch (e) { setError("Failed to run tests: " + e.message); }
    finally { setImporting(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      {/* BG */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -150, left: "30%", width: 600, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: -100, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📄</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.7px", background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                OpenAPI / Swagger Import
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: "#4b5563", marginTop: 3 }}>Import any OpenAPI 3.x or Swagger 2.0 spec and instantly generate test cases.</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "28px 28px 24px", marginBottom: 24 }}>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4, width: "fit-content" }}>
            {[{ id: "url", label: "From URL", icon: "🔗" }, { id: "file", label: "Upload File", icon: "📁" }, { id: "paste", label: "Paste JSON", icon: "📋" }].map(({ id, label, icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 7, border: "none", cursor: "pointer",
                background: tab === id ? "rgba(99,102,241,0.25)" : "transparent",
                color: tab === id ? "#818cf8" : "#6b7280",
                fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                borderBottom: tab === id ? "2px solid #6366f1" : "2px solid transparent",
              }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* URL */}
          {tab === "url" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                  Spec URL <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://petstore3.swagger.io/api/v3/openapi.json" style={INPUT_STYLE}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#4b5563", fontWeight: 600 }}>Try:</span>
                {POPULAR.map(p => (
                  <button key={p.url} onClick={() => setUrl(p.url)} style={{ fontSize: 11, padding: "5px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, color: "#9ca3af", cursor: "pointer" }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; e.currentTarget.style.color = "#818cf8"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#9ca3af"; }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File */}
          {tab === "file" && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
              onClick={() => document.getElementById("oapi-file").click()}
              style={{
                border: `2px dashed ${dragOver ? "rgba(99,102,241,0.6)" : file ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 14, padding: "48px 20px", textAlign: "center",
                background: dragOver ? "rgba(99,102,241,0.05)" : file ? "rgba(16,185,129,0.05)" : "transparent",
                cursor: "pointer", transition: "all 0.2s",
              }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{file ? "✅" : "📂"}</div>
              {file ? (
                <div>
                  <div style={{ fontWeight: 700, color: "#34d399" }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, color: "#9ca3af" }}>Click or drag & drop your spec file</div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>.json · .yaml · .yml</div>
                </div>
              )}
              <input id="oapi-file" type="file" accept=".json,.yaml,.yml" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
            </div>
          )}

          {/* Paste */}
          {tab === "paste" && (
            <textarea value={pasteText} onChange={e => setPaste(e.target.value)}
              placeholder="Paste raw OpenAPI JSON here..." rows={10}
              style={{ ...INPUT_STYLE, fontFamily: "'Fira Code', monospace", fontSize: "0.82rem", resize: "vertical", lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
          )}

          {/* Base URL */}
          {tab !== "paste" && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                Base URL Override <span style={{ color: "#374151", fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <input type="url" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://api.yourapp.com" style={INPUT_STYLE}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#f87171", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={doImport} disabled={loading || !canImport} style={{
            marginTop: 20, width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: loading || !canImport ? "rgba(99,102,241,0.25)" : "linear-gradient(135deg, #6366f1, #818cf8)",
            color: "#fff", fontWeight: 700, fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif",
            cursor: loading || !canImport ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: loading || !canImport ? "none" : "0 4px 20px rgba(99,102,241,0.35)", transition: "all 0.2s",
          }}>
            {loading ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Parsing spec...</> : <>⚡ Generate Tests</>}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>

            {/* Summary */}
            <div style={{ padding: "20px 28px", background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08))", borderBottom: "1px solid rgba(99,102,241,0.15)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>{result.spec_title}</div>
                <div style={{ fontSize: 13, color: "#818cf8", marginTop: 3 }}>v{result.spec_version} · {result.total_endpoints} endpoints found</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{selectedCount} selected</span>
                {[{ label: "All", fn: selectAll }, { label: "None", fn: deselectAll }].map(({ label, fn }) => (
                  <button key={label} onClick={fn} style={{ fontSize: 11, padding: "5px 11px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#9ca3af", cursor: "pointer" }}>{label}</button>
                ))}
                <button onClick={sendToTestVerse} disabled={!selectedCount || importing || importDone} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "none",
                  background: importDone ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.85)",
                  color: importDone ? "#34d399" : "#fff", fontSize: 13, fontWeight: 700,
                  cursor: !selectedCount || importing || importDone ? "not-allowed" : "pointer",
                  opacity: !selectedCount ? 0.5 : 1,
                }}>
                  {importDone ? "✅ Sent!" : importing ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />Running...</> : <>▶ Run {selectedCount} Test{selectedCount !== 1 ? "s" : ""}</>}
                </button>
              </div>
            </div>

            {result.warnings?.length > 0 && (
              <div style={{ padding: "10px 28px", background: "rgba(245,158,11,0.05)", borderBottom: "1px solid rgba(245,158,11,0.12)" }}>
                {result.warnings.map((w, i) => <p key={i} style={{ margin: "2px 0", fontSize: 12, color: "#fbbf24" }}>⚠️ {w}</p>)}
              </div>
            )}

            {/* Test rows */}
            {result.generated_tests.map((test, i) => (
              <div key={test.id} style={{ borderBottom: i < result.generated_tests.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", cursor: "pointer" }}
                  onClick={() => toggle(test.id)}>
                  <div onClick={e => { e.stopPropagation(); toggleSelect(test.id); }}
                    style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected[test.id] ? "#6366f1" : "rgba(255,255,255,0.15)"}`, background: selected[test.id] ? "#6366f1" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                    {selected[test.id] && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                  </div>
                  <MethodBadge method={test.method} />
                  <code style={{ fontSize: 13, color: "#c4b5fd", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{test.url}</code>
                  <span style={{ fontSize: 11, padding: "3px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, color: "#6b7280", flexShrink: 0 }}>{test.expected_status}</span>
                  <span style={{ color: "#4b5563", fontSize: 16, flexShrink: 0, display: "inline-block", transition: "transform 0.2s", transform: expanded[test.id] ? "rotate(180deg)" : "none" }}>▾</span>
                </div>
                <div style={{ paddingLeft: 64, paddingRight: 24, paddingBottom: 8 }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{test.name}</div>
                </div>
                {expanded[test.id] && (
                  <div style={{ paddingLeft: 64, paddingRight: 24, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    {test.description && test.description !== test.name && <p style={{ margin: 0, fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>{test.description}</p>}
                    {[{ label: "Headers", data: test.headers }, test.body && { label: "Body", data: test.body }].filter(Boolean).map(({ label, data }) => (
                      <div key={label}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
                        <pre style={{ margin: 0, padding: "12px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 12, color: "#94a3b8", overflowX: "auto", fontFamily: "monospace" }}>{JSON.stringify(data, null, 2)}</pre>
                      </div>
                    ))}
                    {test.tags?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {test.tags.map(tag => <span key={tag} style={{ fontSize: 11, padding: "3px 10px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 999, color: "#a78bfa" }}>{tag}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}