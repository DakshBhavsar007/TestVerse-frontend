/**
 * ApprovalPanel.jsx — Phase 8B
 * Test approval workflows — request review, approve/reject
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STATUS_CONFIG = {
  pending:    { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)",  icon: "⏳", label: "Pending Review" },
  approved:   { color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.25)",  icon: "✅", label: "Approved" },
  rejected:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)",   icon: "❌", label: "Rejected" },
  superseded: { color: "#6b7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)", icon: "🔄", label: "Superseded" },
};

export default function ApprovalPanel({ testId }) {
  const { token, user } = useAuth();
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewers, setReviewers] = useState("");
  const [note, setNote] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchApproval = useCallback(async () => {
    if (!testId || !token) return;
    try {
      const res = await fetch(`${API}/collab/test/${testId}/approval`, { headers });
      const data = await res.json();
      if (data.success) setApproval(data.approval);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [testId, token]);

  useEffect(() => { fetchApproval(); }, [fetchApproval]);

  const requestApproval = async () => {
    const emails = reviewers.split(",").map(e => e.trim()).filter(Boolean);
    if (!emails.length) return;
    setRequesting(true);
    try {
      const res = await fetch(`${API}/collab/test/${testId}/approval/request`, {
        method: "POST", headers,
        body: JSON.stringify({ reviewers: emails, note: note.trim() || null }),
      });
      const data = await res.json();
      if (data.success) { setApproval(data.approval); setShowRequestForm(false); setReviewers(""); setNote(""); }
    } catch (e) { console.error(e); }
    finally { setRequesting(false); }
  };

  const decide = async (decision) => {
    if (!approval) return;
    setDeciding(true);
    try {
      const res = await fetch(`${API}/collab/approval/${approval.approval_id}/decide`, {
        method: "POST", headers,
        body: JSON.stringify({ decision, note: decisionNote.trim() || null }),
      });
      const data = await res.json();
      if (data.success) { setDecisionNote(""); fetchApproval(); }
    } catch (e) { console.error(e); }
    finally { setDeciding(false); }
  };

  const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px" };
  const input = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  const userEmail = user?.email || "";
  const isReviewer = approval?.reviewers?.includes(userEmail);
  const alreadyDecided = approval?.decisions?.some(d => d.reviewer_email === userEmail);
  const cfg = approval ? (STATUS_CONFIG[approval.status] || STATUS_CONFIG.pending) : null;

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Approval Workflow
          </h3>
        </div>
        {!approval && !showRequestForm && !loading && (
          <button onClick={() => setShowRequestForm(true)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8",
          }}>
            + Request Review
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#4b5563", fontSize: 13 }}>Loading…</div>
      ) : !approval && !showRequestForm ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>No approval requested yet.</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#374151" }}>Request a review before deploying based on this test.</p>
        </div>
      ) : showRequestForm ? (
        /* ── Request form ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6 }}>
              REVIEWER EMAILS <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input type="text" value={reviewers} onChange={e => setReviewers(e.target.value)}
              placeholder="jane@company.com, bob@company.com" style={input} />
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#4b5563" }}>Separate multiple emails with commas</p>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6 }}>NOTE (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Please review before we deploy to production…" style={input} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={requestApproval} disabled={!reviewers.trim() || requesting}
              style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
                opacity: !reviewers.trim() || requesting ? 0.5 : 1 }}>
              {requesting ? "Sending…" : "Send Request"}
            </button>
            <button onClick={() => setShowRequestForm(false)}
              style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── Approval status ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Status badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px",
            background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{cfg.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                  Requested by {approval.requested_by_email} · {timeAgo(approval.created_at)}
                </div>
              </div>
            </div>
            {approval.status === "pending" && (
              <button onClick={() => setShowRequestForm(true)}
                style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280", cursor: "pointer" }}>
                Re-request
              </button>
            )}
          </div>

          {/* Note */}
          {approval.note && (
            <div style={{ fontSize: 13, color: "#9ca3af", background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px" }}>
              "{approval.note}"
            </div>
          )}

          {/* Reviewers progress */}
          <div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Reviewers</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {approval.reviewers?.map(email => {
                const dec = approval.decisions?.find(d => d.reviewer_email === email);
                const decCfg = dec ? STATUS_CONFIG[dec.decision] : null;
                return (
                  <div key={email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>{email}</span>
                    {dec ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, fontWeight: 600,
                          background: decCfg.bg, color: decCfg.color, border: `1px solid ${decCfg.border}` }}>
                          {decCfg.icon} {dec.decision}
                        </span>
                        <span style={{ fontSize: 10, color: "#4b5563" }}>{timeAgo(dec.decided_at)}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "#4b5563" }}>⏳ awaiting</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decision panel for current reviewer */}
          {isReviewer && !alreadyDecided && approval.status === "pending" && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>Your Decision</div>
              <input type="text" value={decisionNote} onChange={e => setDecisionNote(e.target.value)}
                placeholder="Add a note (optional)…" style={{ ...input, marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => decide("approved")} disabled={deciding}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                    background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                  ✅ Approve
                </button>
                <button onClick={() => decide("rejected")} disabled={deciding}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                    background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                  ❌ Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
