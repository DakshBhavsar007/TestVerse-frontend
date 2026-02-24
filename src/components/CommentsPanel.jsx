/**
 * CommentsPanel.jsx — Phase 8B
 * Comments & annotations on test results
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const CHECK_LABELS = {
  speed: "⚡ Speed", ssl: "🔒 SSL", seo: "🔍 SEO",
  accessibility: "♿ Accessibility", security_headers: "🛡️ Security Headers",
  core_web_vitals: "📊 Core Web Vitals", html_validation: "🔧 HTML Validation",
  content_quality: "📝 Content Quality", cookies_gdpr: "🍪 Cookies/GDPR",
  pwa: "📱 PWA", functionality: "⚙️ Functionality",
  broken_links: "🔗 Broken Links", js_errors: "🐛 JS Errors",
  images: "🖼️ Images", mobile: "📱 Mobile",
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ email }) {
  const letter = (email || "?")[0].toUpperCase();
  const colors = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];
  const color = colors[letter.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>{letter}</div>
  );
}

export default function CommentsPanel({ testId }) {
  const { token, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [annotationKey, setAnnotationKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchComments = useCallback(async () => {
    if (!testId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/collab/test/${testId}/comments`, { headers });
      const data = await res.json();
      if (data.success) setComments(data.comments);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [testId, token]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const submitComment = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/collab/test/${testId}/comments`, {
        method: "POST", headers,
        body: JSON.stringify({ text: text.trim(), annotation_key: annotationKey || null }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => [...prev, data.comment]);
        setText(""); setAnnotationKey("");
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const saveEdit = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await fetch(`${API}/collab/comments/${commentId}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ text: editText.trim() }),
      });
      setComments(prev => prev.map(c => c.comment_id === commentId ? { ...c, text: editText.trim(), updated_at: new Date().toISOString() } : c));
      setEditingId(null);
    } catch (e) { console.error(e); }
  };

  const deleteComment = async (commentId) => {
    try {
      await fetch(`${API}/collab/comments/${commentId}`, { method: "DELETE", headers });
      setComments(prev => prev.filter(c => c.comment_id !== commentId));
    } catch (e) { console.error(e); }
  };

  const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px" };
  const input = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
    outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
  };
  const btn = (variant = "primary") => ({
    padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
    ...(variant === "primary"
      ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }
      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }),
  });

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <span style={{ fontSize: 16 }}>💬</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Comments & Annotations
        </h3>
        {comments.length > 0 && (
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(99,102,241,0.15)", color: "#818cf8", fontWeight: 600 }}>
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#4b5563", fontSize: 13 }}>Loading comments…</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#374151", fontSize: 13 }}>
          No comments yet. Be the first to annotate this test result.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
          {comments.map(c => (
            <div key={c.comment_id} style={{ display: "flex", gap: 10 }}>
              <Avatar email={c.user_email} />
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#c7d2fe" }}>{c.user_email}</span>
                    {c.annotation_key && (
                      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(99,102,241,0.15)", color: "#818cf8", fontWeight: 600 }}>
                        {CHECK_LABELS[c.annotation_key] || c.annotation_key}
                      </span>
                    )}
                    {c.updated_at && <span style={{ fontSize: 10, color: "#4b5563" }}>edited</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#374151" }}>{timeAgo(c.created_at)}</span>
                    {c.user_id === user?.sub && (
                      <>
                        <button onClick={() => { setEditingId(c.comment_id); setEditText(c.text); }}
                          style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: 11, padding: 0 }}>Edit</button>
                        <button onClick={() => deleteComment(c.comment_id)}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, padding: 0, opacity: 0.6 }}>Delete</button>
                      </>
                    )}
                  </div>
                </div>

                {editingId === c.comment_id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2} style={input} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => saveEdit(c.comment_id)} style={btn()}>Save</button>
                      <button onClick={() => setEditingId(null)} style={btn("ghost")}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>{c.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New comment form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Avatar email={user?.email} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={text} onChange={e => setText(e.target.value)} rows={2}
              placeholder="Add a comment or annotation…" style={input}
              onKeyDown={e => { if (e.key === "Enter" && e.metaKey) submitComment(); }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={annotationKey} onChange={e => setAnnotationKey(e.target.value)}
                style={{ ...input, padding: "6px 10px", flex: 1, cursor: "pointer" }}>
                <option value="">📌 Pin to check (optional)</option>
                {Object.entries(CHECK_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button onClick={submitComment} disabled={!text.trim() || submitting}
                style={{ ...btn(), opacity: !text.trim() || submitting ? 0.5 : 1, whiteSpace: "nowrap" }}>
                {submitting ? "Posting…" : "Post ↵"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
