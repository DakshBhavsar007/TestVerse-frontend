import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const EVENT_META = {
  comment_added:       { icon: "💬", label: "Added a comment",       color: "#818cf8" },
  comment_deleted:     { icon: "🗑️",  label: "Deleted a comment",     color: "#f87171" },
  test_approved:       { icon: "✅", label: "Approved test",          color: "#34d399" },
  test_rejected:       { icon: "❌", label: "Rejected test",          color: "#f87171" },
  approval_requested:  { icon: "🔔", label: "Requested approval",     color: "#fbbf24" },
  test_run:            { icon: "🧪", label: "Ran a test",             color: "#60a5fa" },
  test_deleted:        { icon: "🗑️",  label: "Deleted a test",        color: "#f87171" },
  schedule_created:    { icon: "📅", label: "Created a schedule",     color: "#a78bfa" },
  monitor_created:     { icon: "📡", label: "Created a monitor",      color: "#34d399" },
  role_assigned:       { icon: "🔄", label: "Role changed",           color: "#f59e0b" },
  plan_change:         { icon: "💳", label: "Changed plan",           color: "#f59e0b" },
  default:             { icon: "📌", label: "Activity",               color: "#6b7280" },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function groupByDay(events) {
  const groups = {};
  events.forEach(e => {
    const day = new Date(e.timestamp).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  });
  return groups;
}

function Avatar({ name, size = 34 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const hue = (name || "?").charCodeAt(0) * 7 % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},45%,28%)`, border: "2px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, color: "#e2e8f0", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function ActivityFeed() {
  const { authFetch, user } = useAuth();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("mine"); // mine | team
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (feedTab = tab, pageNum = 1) => {
    setLoading(true);
    try {
      const endpoint = feedTab === "team"
        ? `${API}/collab/activity/team?limit=30&page=${pageNum}`
        : `${API}/collab/activity/mine?limit=30&page=${pageNum}`;
      const r = await authFetch(endpoint);
      if (r.ok) {
        const d = await r.json();
        const incoming = d.events || d.activities || [];
        setEvents(pageNum === 1 ? incoming : prev => [...prev, ...incoming]);
        setHasMore(incoming.length === 30);
      }
    } catch {}
    finally { setLoading(false); }
  }, [authFetch, tab]);

  useEffect(() => { setPage(1); load(tab, 1); }, [tab]);

  // Resolve display name for an event:
  // Backend should store user_name, but fall back to user_email or "Unknown"
  // If the event belongs to the current user, use their name from auth context
  const resolveUserName = (event) => {
    if (event.user_name && event.user_name !== "unknown") return event.user_name;
    if (event.user_email) {
      // Check if it matches current user
      if (user?.email && event.user_email === user.email) return user.name || user.email;
      return event.user_email.split("@")[0]; // use email prefix as fallback
    }
    if (event.user_id && user?.id && event.user_id === user.id) return user.name || user.email || "You";
    return "Unknown";
  };

  const grouped = groupByDay(events);

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -80, left: "25%", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.05) 0%,transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, letterSpacing: "-0.7px", background: "linear-gradient(135deg,#e2e8f0 0%,#94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Activity Feed
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#4b5563" }}>Track all collaboration activity across your tests</p>
        </div>

        {/* Tabs + count */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 4 }}>
            {[{ id: "mine", label: "My Activity" }, { id: "team", label: "Team Feed" }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "8px 20px", borderRadius: 7, border: "none", cursor: "pointer",
                background: tab === t.id ? "rgba(99,102,241,0.25)" : "transparent",
                color: tab === t.id ? "#818cf8" : "#6b7280",
                fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "#374151" }}>{events.length} event{events.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Feed */}
        {loading && events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ color: "#4b5563", fontSize: 14 }}>Loading activity...</div>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ color: "#4b5563", fontSize: 14 }}>No activity yet. Run a test or add a comment to get started.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {Object.entries(grouped).map(([day, dayEvents]) => (
              <div key={day}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {day}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {dayEvents.map(event => {
                    const meta = EVENT_META[event.action] || EVENT_META[event.type] || EVENT_META.default;
                    const name = resolveUserName(event);
                    const isCurrentUser = name === (user?.name || user?.email?.split("@")[0]);
                    const shortId = (event.entity_id || event.resource_id || event.test_id || "").slice(0, 8);

                    return (
                      <div key={event._id || event.activity_id || event.log_id || Math.random()} style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 12, transition: "background 0.15s",
                      }}
                        onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                        onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      >
                        <Avatar name={name} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: isCurrentUser ? "#818cf8" : "#e2e8f0" }}>{name}</span>
                            <span style={{ fontSize: 16 }}>{meta.icon}</span>
                            <span style={{ fontSize: 13, color: "#9ca3af" }}>{meta.label}</span>
                            {shortId && (
                              <span style={{ fontSize: 11, padding: "2px 7px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 5, color: "#a78bfa", fontFamily: "monospace" }}>
                                {shortId}…
                              </span>
                            )}
                          </div>
                          {event.details?.comment && (
                            <div style={{ marginTop: 5, padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, fontSize: 12, color: "#9ca3af", fontStyle: "italic", maxWidth: 560 }}>
                              "{event.details.comment.length > 120 ? event.details.comment.slice(0, 120) + "…" : event.details.comment}"
                            </div>
                          )}
                          {event.details?.message && !event.details?.comment && (
                            <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>{event.details.message}</div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#374151", flexShrink: 0 }}>{timeAgo(event.timestamp)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {hasMore && (
              <button onClick={() => { const next = page + 1; setPage(next); load(tab, next); }} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {loading ? "Loading..." : "Load more"}
              </button>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
