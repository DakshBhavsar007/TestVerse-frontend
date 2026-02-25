import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";


const scoreColor = (s) => {
  if (s == null) return "#6b7280";
  if (s >= 80) return "#10b981";
  if (s >= 60) return "#f59e0b";
  if (s >= 40) return "#f97316";
  return "#ef4444";
};

const statusIcon = (s) => ({ pending: "⏳", running: "🔄", completed: "✅", failed: "❌" }[s] || "⏳");

export default function BulkTest() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [urlInput, setUrlInput]   = useState("");
  const [label, setLabel]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");

  const [activeBatch, setActiveBatch] = useState(null);
  const [batches, setBatches]         = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  const pollRef = useRef(null);

  // Load past batches
  useEffect(() => {
    authFetch(`${API}/bulk`)
      .then(r => r.json()).then(d => setBatches(d.batches || []))
      .catch(() => {}).finally(() => setLoadingBatches(false));
  }, [authFetch]);

  // Poll active batch
  useEffect(() => {
    if (!activeBatch) return;
    if (activeBatch.status === "completed") return;

    pollRef.current = setInterval(async () => {
      try {
        const r = await authFetch(`${API}/bulk/${activeBatch.batch_id}`);
        const d = await r.json();
        setActiveBatch(d);
        if (d.status === "completed") {
          clearInterval(pollRef.current);
          setBatches(prev => {
            const exists = prev.find(b => b.batch_id === d.batch_id);
            if (exists) return prev.map(b => b.batch_id === d.batch_id ? { ...b, status: "completed" } : b);
            return [{ batch_id: d.batch_id, label: d.label, total: d.total, status: d.status, created_at: d.created_at }, ...prev];
          });
        }
      } catch (_) {}
    }, 2000);

    return () => clearInterval(pollRef.current);
  }, [activeBatch?.batch_id, activeBatch?.status, authFetch]);

  const handleSubmit = async () => {
    const urls = urlInput.split("\n").map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) { setError("Enter at least one URL"); return; }
    if (urls.length > 20) { setError("Maximum 20 URLs per batch"); return; }

    setSubmitting(true); setError("");
    try {
      const r = await authFetch(`${API}/bulk/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, label: label.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed to start batch");

      // Load full batch detail
      const br = await authFetch(`${API}/bulk/${d.batch_id}`);
      const bd = await br.json();
      setActiveBatch(bd);
      setUrlInput(""); setLabel("");
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const loadBatch = async (batch_id) => {
    try {
      const r = await authFetch(`${API}/bulk/${batch_id}`);
      const d = await r.json();
      setActiveBatch(d);
    } catch (_) {}
  };

  const progress = activeBatch?.progress;
  const pct = progress?.pct ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Bulk URL Testing</h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Test up to 20 URLs simultaneously — results update live</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

          {/* Left — input */}
          <div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px", marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>URLs to Test</div>
              <input type="text" placeholder="Batch label (optional)" value={label}
                onChange={e => setLabel(e.target.value)}
                style={{ width: "100%", padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
              <textarea
                placeholder={"https://example.com\nhttps://staging.example.com\nhttps://blog.example.com"}
                value={urlInput} onChange={e => setUrlInput(e.target.value)}
                rows={8}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "monospace", boxSizing: "border-box" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontSize: 12, color: "#374151" }}>
                  {urlInput.split("\n").filter(u => u.trim()).length} / 20 URLs
                </span>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Starting…" : "Run Batch →"}
                </button>
              </div>
              {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</div>}
            </div>

            {/* Past batches */}
            {!loadingBatches && batches.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Past Batches</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {batches.map(b => (
                    <div key={b.batch_id} onClick={() => loadBatch(b.batch_id)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{b.label}</div>
                        <div style={{ fontSize: 11, color: "#374151" }}>{b.total} URLs · {(b.created_at || "").slice(0, 16).replace("T", " ")}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: b.status === "completed" ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)", color: b.status === "completed" ? "#10b981" : "#818cf8", fontWeight: 600 }}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — live results */}
          <div>
            {!activeBatch ? (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <p style={{ color: "#374151", fontSize: 14 }}>Results will appear here once you run a batch</p>
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px", position: "sticky", top: 80 }}>
                {/* Batch header */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{activeBatch.label}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? "#10b981" : "#818cf8" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 3, transition: "width 0.5s ease", boxShadow: pct < 100 ? "0 0 10px rgba(99,102,241,0.5)" : "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    {[
                      { label: "Done", val: progress?.completed, color: "#10b981" },
                      { label: "Running", val: progress?.running, color: "#6366f1" },
                      { label: "Failed", val: progress?.failed, color: "#ef4444" },
                    ].map(({ label, val, color }) => (
                      <span key={label} style={{ fontSize: 11, color }}>
                        <strong>{val ?? 0}</strong> {label}
                      </span>
                    ))}
                    {progress?.avg_score != null && (
                      <span style={{ fontSize: 11, color: scoreColor(progress.avg_score), marginLeft: "auto" }}>
                        Avg <strong>{progress.avg_score}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Per-URL rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 480, overflowY: "auto" }}>
                  {(activeBatch.statuses || []).map(s => {
                    const color = scoreColor(s.score);
                    return (
                      <div key={s.test_id}
                        onClick={() => s.status === "completed" && navigate(`/result/${s.test_id}`)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", cursor: s.status === "completed" ? "pointer" : "default", transition: "background 0.15s" }}
                        onMouseEnter={e => { if (s.status === "completed") e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{statusIcon(s.status)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {(s.url || "").replace(/^https?:\/\//, "")}
                          </div>
                          {s.error && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 1 }}>{s.error.slice(0, 50)}</div>}
                        </div>
                        {s.score != null && (
                          <div style={{ fontSize: 16, fontWeight: 900, color, flexShrink: 0, letterSpacing: "-0.5px" }}>{s.score}</div>
                        )}
                        {s.status === "running" && (
                          <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid #6366f1", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
