import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

// ─── Nav structure ─────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { to: "/dashboard", icon: "▦", label: "Dashboard" },
      { to: "/history", icon: "◷", label: "History" },
      { to: "/trends", icon: "↗", label: "Trends" },
      { to: "/diff", icon: "◫", label: "Difference" },
      { to: "/activity", icon: "〰", label: "Activity" },
      { to: "/ai", icon: "✨", label: "AI Insights" },
    ],
  },
  {
    label: "Testing",
    items: [
      { to: "/schedules", icon: "⊡", label: "Schedules" },
      { to: "/bulk", icon: "⊞", label: "Bulk Test" },
      { to: "/templates", icon: "▤", label: "Templates" },
      { to: "/monitoring", icon: "◉", label: "Monitors" },
      { to: "/openapi-import", icon: "⚡", label: "OpenAPI API" },
    ],
  },
  {
    label: "Ops & CI",
    items: [
      { to: "/notifications", icon: "🔔", label: "Alerts" },
      { to: "/cicd/settings", icon: "⚙", label: "CI/CD Settings" },
      { to: "/cicd/triggers", icon: "▶", label: "CI/CD Triggers" },
      { to: "/reporting", icon: "📊", label: "Reporting" },
      { to: "/compliance", icon: "✓", label: "Compliance" },
    ],
  },
  {
    label: "Team",
    items: [
      { to: "/teams", icon: "⊛", label: "Teams" },
      { to: "/roles", icon: "◈", label: "Roles" },
      { to: "/slack", icon: "◎", label: "Slack" },
    ],
  },
  {
    label: "Config",
    items: [
      { to: "/apikeys", icon: "⟡", label: "API Keys" },
      { to: "/analytics", icon: "◬", label: "Analytics" },
      { to: "/whitelabel", icon: "◇", label: "Branding" },
      { to: "/billing", icon: "◆", label: "Billing" },
      { to: "/devtools", icon: "🔧", label: "Dev Tools" },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

// ─── Command palette modal ──────────────────────────────────────────────────
function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = query.length < 1
    ? ALL_ITEMS
    : ALL_ITEMS.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(4,4,12,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "14vh",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(560px, 92vw)",
          background: "rgba(12,12,24,0.98)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          overflow: "hidden",
          animation: "cmdDrop 0.2s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Search row */}
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: 12 }}>
          <span style={{ fontSize: "1.1rem", opacity: 0.4 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Jump to..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "#e2e8f0", fontSize: "1rem", fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <kbd style={{
            fontSize: "0.65rem", padding: "3px 7px", borderRadius: 6,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#6b7280", fontFamily: "monospace",
          }}>ESC</kbd>
        </div>
        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "8px 10px" }}>
          {filtered.map(item => (
            <button
              key={item.to}
              onClick={() => { navigate(item.to); onClose(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 12px", borderRadius: 10, border: "none",
                background: "transparent", color: "#c4b5fd", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 500,
                transition: "background 0.15s",
                textAlign: "left",
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(99,102,241,0.12)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(99,102,241,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.85rem", flexShrink: 0,
              }}>{item.icon}</span>
              {item.label}
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#4b5563" }}>{item.to}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 16 }}>
          {[["↵", "Select"], ["↑↓", "Navigate"], ["ESC", "Close"]].map(([k, v]) => (
            <span key={k} style={{ display: "flex", gap: 5, alignItems: "center", fontSize: "0.72rem", color: "#4b5563" }}>
              <kbd style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontFamily: "monospace" }}>{k}</kbd>
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── User avatar dropdown ───────────────────────────────────────────────────
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const initials = (user?.email || "U").slice(0, 2).toUpperCase();
  const email = user?.email || "user@example.com";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(99,102,241,0.4)",
          background: "linear-gradient(135deg, #6366f1, #a78bfa)",
          color: "#fff", fontWeight: 800, fontSize: "0.72rem",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.25)" : "none",
        }}
      >
        {initials}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 12px)", right: 0,
          width: 220,
          background: "rgba(12,12,24,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          animation: "cmdDrop 0.18s ease both",
          zIndex: 1000,
        }}>
          {/* Profile header */}
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: 2 }}>Signed in as</div>
            <div style={{ fontSize: "0.85rem", color: "#e2e8f0", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
          </div>

          {/* Menu items */}
          {[
            { icon: "◈", label: "Profile", to: "/profile" },
            { icon: "⟡", label: "API Keys", to: "/apikeys" },
            { icon: "◇", label: "Billing", to: "/billing" },
          ].map(item => (
            <button key={item.label}
              onClick={() => {
                if (item.to) {
                  navigate(item.to);
                  setOpen(false);
                }
              }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", border: "none", background: "transparent",
                color: "#9ca3af", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem", transition: "all 0.15s", textAlign: "left",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
            >
              <span style={{ opacity: 0.6 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />

          <button
            onClick={() => {
              onLogout();
              navigate("/login");
            }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 16px", border: "none", background: "transparent",
              color: "#ef4444", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.875rem", transition: "background 0.15s", textAlign: "left",
            }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
          >
            <span>⊗</span> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Scrolling nav strip with groups ────────────────────────────────────────
function NavStrip({ location }) {
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [activeGroupOpen, setActiveGroupOpen] = useState(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setActiveGroupOpen(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }} ref={dropRef}>
      {NAV_GROUPS.map(group => {
        const isAnyActive = group.items.some(i => location.pathname === i.to || location.pathname.startsWith(i.to + "/"));
        const isOpen = activeGroupOpen === group.label;

        return (
          <div key={group.label} style={{ position: "relative" }}>
            <button
              onClick={() => setActiveGroupOpen(isOpen ? null : group.label)}
              onMouseEnter={() => setHoveredGroup(group.label)}
              onMouseLeave={() => setHoveredGroup(null)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 13px", borderRadius: 10, border: "none",
                background: isAnyActive
                  ? "rgba(99,102,241,0.15)"
                  : isOpen || hoveredGroup === group.label
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
                color: isAnyActive ? "#c4b5fd" : "#6b7280",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.82rem", fontWeight: 600,
                transition: "all 0.18s",
                borderBottom: isAnyActive ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
              }}
            >
              {group.label}
              <span style={{
                fontSize: "0.6rem", opacity: 0.6,
                transition: "transform 0.2s",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                display: "inline-block",
              }}>▾</span>
            </button>

            {/* Dropdown */}
            {isOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", left: 0,
                background: "rgba(12,12,24,0.98)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, overflow: "hidden",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                minWidth: 180,
                animation: "cmdDrop 0.18s ease both",
                zIndex: 500,
              }}>
                {group.items.map(item => {
                  const active = location.pathname === item.to;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setActiveGroupOpen(null)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px",
                        color: active ? "#c4b5fd" : "#9ca3af",
                        textDecoration: "none",
                        fontSize: "0.875rem", fontWeight: active ? 600 : 400,
                        background: active ? "rgba(99,102,241,0.1)" : "transparent",
                        transition: "all 0.15s",
                        borderLeft: active ? "2px solid #6366f1" : "2px solid transparent",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                      onMouseOver={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#e2e8f0"; } }}
                      onMouseOut={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; } }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", flexShrink: 0,
                        color: active ? "#818cf8" : "#6b7280",
                      }}>{item.icon}</span>
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN NAVBAR ─────────────────────────────────────────────────────────────
export default function Navbar({ user, onLogout }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes cmdDrop {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes navSlide {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .new-test-btn:hover {
          filter: brightness(1.12) !important;
          transform: translateY(-1px) scale(1.03) !important;
          box-shadow: 0 8px 28px rgba(99,102,241,0.5) !important;
        }
        .new-test-btn:active { transform: scale(0.97) !important; }
        .search-pill:hover { border-color: rgba(99,102,241,0.35) !important; background: rgba(99,102,241,0.06) !important; }
      `}</style>

      {/* ── Navbar shell ──────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, width: "100%", zIndex: 999, boxSizing: "border-box",
        height: 64,
        background: scrolled
          ? "rgba(6,6,14,0.92)"
          : "rgba(6,6,14,0.75)",
        backdropFilter: "blur(24px) saturate(180%)",
        borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}`,
        boxShadow: scrolled ? "0 4px 40px rgba(0,0,0,0.4)" : "none",
        transition: "all 0.3s ease",
        display: "flex", alignItems: "center",
        padding: "0 20px",
        gap: 12,
        animation: "navSlide 0.4s ease both",
      }}>

        {/* ── Logo ───────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 9,
            background: "none", border: "none", cursor: "pointer",
            padding: "4px 6px", borderRadius: 10,
            transition: "background 0.2s", flexShrink: 0,
          }}
          onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
          onMouseOut={e => e.currentTarget.style.background = "none"}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg, #6366f1, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
            flexShrink: 0,
          }}>⚡</div>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: "1.1rem",
            background: "linear-gradient(135deg, #fff 40%, #a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-0.3px",
          }}>TestVerse</span>
        </button>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

        {/* ── Nav groups ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <NavStrip location={location} />
        </div>

        {/* ── Right side ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>

          {/* Command palette search pill */}
          <button
            className="search-pill"
            onClick={() => setCmdOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 13px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#4b5563", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            <span style={{ opacity: 0.5 }}>🔍</span>
            <span>Search...</span>
            <kbd style={{
              fontSize: "0.62rem", padding: "2px 7px", borderRadius: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "#374151", fontFamily: "monospace",
              display: "flex", alignItems: "center", gap: 2,
            }}>⌘K</kbd>
          </button>

          {/* New Test CTA */}
          <button
            className="new-test-btn"
            onClick={() => navigate("/")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              color: "#fff", fontWeight: 700, fontSize: "0.82rem",
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>+</span> New Test
          </button>

          {/* User avatar */}
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      </nav>

      {/* Command palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
