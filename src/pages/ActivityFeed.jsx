/**
 * ActivityFeed.jsx — Phase 8B
 * Full-page activity feed / audit log
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const ACTION_CONFIG = {
  comment_added:       { icon: "💬", color: "#6366f1", label: "Added a comment" },
  comment_deleted:     { icon: "🗑️", color: "#6b7280", label: "Deleted a comment" },
  approval_requested:  { icon: "📋", color: "#f59e0b", label: "Requested approval" },
  approval_approved:   { icon: "✅", color: "#10b981", label: "Approved a test" },
  approval_rejected:   { icon: "❌", color: "#ef4444", label: "Rejected a test" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Avatar({ email }) {
  const letter = (email || "?")[0].toUpperCase();
  const colors = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];
  const color = colors[letter.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>{letter}</div>
  );
}

function ActivityItem({ activity }) {
  const cfg = ACTION_CONFIG[activity.action] || { icon: "📌", color: "#6b7280", label: activity.action };
  return (
    <div style={{
      display: "flex", gap: 12, padding: "14px 16px",
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12, transition: "border-color 0.2s",
    }}>
      <Avatar email={activity.user_email} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#c7d2fe" }}>{activity.user_email}</span>
          <span style={{ fontSize: 18 }}>{cfg.icon}</span>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{cfg.label}</span>
          {activity.entity_id && (
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8,
              background: "rgba(99,102,241,0.1)", color: "#818cf8", fontFamily: "monospace" }}>
              {activity.entity_id.slice(0, 8)}…
            </span>
          )}
        </div>
        {activity.detail && (
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#4b5563", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {activity.detail}
          </p>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#374151", whiteSpace: "nowrap", alignSelf: "flex-start", marginTop: 2 }}>
        {timeAgo(activity.timestamp)}
      </div>
    </div>
  );
}

export default function ActivityFeed() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("mine"); // "mine" | "team"
  const [total, setTotal] = useState(0);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchFeed = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const url = view === "team"
        ? `${API}/collab/activity/team?limit=100`
        : `${API}/collab/activity?limit=50`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) { setActivities(data.activities); setTotal(data.total); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token, view]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  // Group by date
  const grouped = activities.reduce((acc, a) => {
    const date = new Date(a.timestamp).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!acc[date]) acc[date] = [];
    acc[date].push(a);
    return acc;
  }, {});

  const tabBtn = (v) => ({
    padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
    border: view === v ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)",
    background: view === v ? "rgba(99,102,241,0.15)" : "transparent",
    color: view === v ? "#818cf8" : "#6b7280",
    transition: "all 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans', 'Inter', sans-serif", color: "#e2e8f0" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -300, right: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>TestVerse</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["dashboard", "history", "schedules", "teams"].map(p => (
            <button key={p} onClick={() => navigate(`/${p}`)}
              style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500, textTransform: "capitalize" }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <span style={{ fontSize: 13, color: "#4b5563" }}>{user?.email}</span>
          <button onClick={() => { logout(); navigate("/login"); }}
            style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Activity Feed
          </h1>
          <p style={{ fontSize: 14, color: "#4b5563", margin: "6px 0 0" }}>Track all collaboration activity across your tests</p>
        </div>

        {/* Tabs + stats */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={tabBtn("mine")} onClick={() => setView("mine")}>My Activity</button>
            <button style={tabBtn("team")} onClick={() => setView("team")}>Team Feed</button>
          </div>
          <span style={{ fontSize: 12, color: "#374151" }}>{total} events</span>
        </div>

        {/* Feed */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#4b5563", fontSize: 14 }}>Loading activity…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#4b5563" }}>No activity yet</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#374151" }}>Activity will appear here as you comment and review tests.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#4b5563", fontWeight: 600 }}>{date}</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map(a => <ActivityItem key={a.activity_id} activity={a} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
