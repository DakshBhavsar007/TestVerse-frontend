import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const ROLE_META = {
  admin:     { icon: "👑", label: "Admin",     color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  desc: "Full system access including billing, team management, and configuration." },
  developer: { icon: "💻", label: "Developer", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", desc: "Run tests, manage schedules, create API keys, and configure integrations." },
  viewer:    { icon: "👁️",  label: "Viewer",    color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.25)", desc: "Read-only access to test results and reports. Cannot run tests or modify settings." },
};

// ── Role badge pill ────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.viewer;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 999,
      background: m.bg, border: `1px solid ${m.border}`,
      fontSize: 11, fontWeight: 700, color: m.color,
      textTransform: "capitalize", letterSpacing: "0.03em",
    }}>
      {m.icon} {m.label}
    </span>
  );
}

// ── Role selector dropdown ─────────────────────────────────────────────────────
function RoleSelector({ currentRole, userId, onAssign, disabled, selfId }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const isSelf = userId === selfId;

  const handleSelect = async (role) => {
    if (role === currentRole || isSelf) return;
    setSaving(true);
    setOpen(false);
    await onAssign(userId, role);
    setSaving(false);
  };

  if (disabled) return <RoleBadge role={currentRole} />;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => !saving && !isSelf && setOpen(o => !o)}
        disabled={saving || isSelf}
        title={isSelf ? "You cannot change your own role" : "Change role"}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 999, border: "1px solid",
          borderColor: ROLE_META[currentRole]?.border || "rgba(255,255,255,0.1)",
          background: ROLE_META[currentRole]?.bg || "transparent",
          color: ROLE_META[currentRole]?.color || "#9ca3af",
          fontSize: 11, fontWeight: 700, cursor: saving || isSelf ? "not-allowed" : "pointer",
          opacity: saving || isSelf ? 0.6 : 1,
          textTransform: "capitalize", letterSpacing: "0.03em",
          transition: "all 0.15s",
        }}
      >
        {saving ? (
          <>
            <span style={{ width: 10, height: 10, border: "1.5px solid currentColor", borderTop: "1.5px solid transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            Saving…
          </>
        ) : (
          <>
            {ROLE_META[currentRole]?.icon} {ROLE_META[currentRole]?.label}
            {!isSelf && <span style={{ fontSize: 9, marginLeft: 2 }}>▼</span>}
          </>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: "#0f1120", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, overflow: "hidden", zIndex: 99,
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            minWidth: 180, animation: "dropIn 0.15s ease",
          }}>
            {Object.entries(ROLE_META).map(([role, m]) => (
              <button
                key={role}
                onClick={() => handleSelect(role)}
                disabled={role === currentRole}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 16px", border: "none", cursor: role === currentRole ? "default" : "pointer",
                  background: role === currentRole ? "rgba(255,255,255,0.04)" : "transparent",
                  transition: "background 0.15s", textAlign: "left",
                }}
                onMouseOver={e => { if (role !== currentRole) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseOut={e => { if (role !== currentRole) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: role === currentRole ? m.color : "#e2e8f0" }}>
                    {m.label}
                    {role === currentRole && <span style={{ fontSize: 10, color: "#4b5563", marginLeft: 6 }}>current</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#4b5563", marginTop: 1 }}>{m.desc.split(".")[0]}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Toast notification ─────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "13px 20px", borderRadius: 12,
      background: type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
      border: `1px solid ${type === "success" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}`,
      color: type === "success" ? "#34d399" : "#f87171",
      fontSize: 13, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "slideUp 0.25s ease",
    }}>
      <span style={{ fontSize: 16 }}>{type === "success" ? "✅" : "❌"}</span>
      {message}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RoleManagement() {
  const { authFetch, user } = useAuth();

  const [myRole, setMyRole]         = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [allPerms, setAllPerms]     = useState([]);
  const [members, setMembers]       = useState([]);
  const [auditLogs, setAuditLogs]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [toast, setToast]           = useState(null);
  const [activeTab, setActiveTab]   = useState("overview"); // overview | team | audit

  const selfId = user?.id || user?.sub;

  const fetchAll = useCallback(async () => {
    try {
      const [roleData, permsData] = await Promise.all([
        authFetch(`${API}/rbac/my-role`).then(r => r.json()),
        authFetch(`${API}/rbac/permissions-list`).then(r => r.json()),
      ]);
      setMyRole(roleData.role);
      setPermissions(roleData.permissions || []);
      setAllPerms(permsData.permissions || []);

      const canViewTeam = (roleData.permissions || []).includes("view_team");
      const canViewAudit = (roleData.permissions || []).includes("view_audit_logs");

      if (canViewTeam) {
        const membersData = await authFetch(`${API}/rbac/team-members`).then(r => r.json());
        setMembers(membersData.members || []);
      }
      if (canViewAudit) {
        const auditData = await authFetch(`${API}/rbac/audit-logs?limit=20`).then(r => r.json());
        setAuditLogs(auditData.logs || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAssignRole = async (userId, newRole) => {
    try {
      const res = await authFetch(`${API}/rbac/assign-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to assign role");

      // Optimistically update local state
      setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
      setToast({ message: data.message || `Role changed to ${newRole}`, type: "success" });

      // Refresh audit logs
      if (permissions.includes("view_audit_logs")) {
        const auditData = await authFetch(`${API}/rbac/audit-logs?limit=20`).then(r => r.json());
        setAuditLogs(auditData.logs || []);
      }
    } catch (e) {
      setToast({ message: e.message, type: "error" });
    }
  };

  const meta = myRole ? ROLE_META[myRole] : null;
  const canAssign = permissions.includes("change_roles");
  const canViewTeam = permissions.includes("manage_team") || myRole === "admin" || myRole === "developer";
  const canViewAudit = permissions.includes("view_audit_logs");

  const tabs = [
    { id: "overview", label: "Overview" },
    canViewTeam && { id: "team", label: `Team Members ${members.length ? `(${members.length})` : ""}` },
    canViewAudit && { id: "audit", label: "Audit Log" },
  ].filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            🛡️ Role Management
          </h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Manage permissions and access control for your workspace</p>
        </div>

        {error && (
          <div style={{ color: "#f87171", fontSize: 13, marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : (
          <>
            {/* My Role Card */}
            {meta && (
              <div style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 16, padding: "24px 28px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 36 }}>{meta.icon}</div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: meta.color, textTransform: "capitalize" }}>{myRole}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Your current role</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 32 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#e2e8f0" }}>{permissions.length}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>permissions granted</div>
                  </div>
                  {canViewTeam && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: "#e2e8f0" }}>{members.length}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>team members</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabs */}
            {tabs.length > 1 && (
              <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 4 }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
                      background: activeTab === tab.id ? "rgba(99,102,241,0.2)" : "transparent",
                      color: activeTab === tab.id ? "#818cf8" : "#6b7280",
                      fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                      borderBottom: activeTab === tab.id ? "2px solid #6366f1" : "2px solid transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <>
                {/* Your Permissions */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px", marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>⚡ Your Permissions</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {permissions.length === 0 && <div style={{ color: "#374151", fontSize: 13 }}>No permissions assigned.</div>}
                    {permissions.map(perm => (
                      <div key={perm} style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#818cf8" }}>
                          {perm.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permissions Reference Table */}
                {allPerms.length > 0 && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px", marginBottom: 24, overflowX: "auto" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>📋 Permissions Reference</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          {["Permission", "Admin 👑", "Developer 💻", "Viewer 👁️"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allPerms.map((p, i) => (
                          <tr key={p.name} style={{ borderBottom: i < allPerms.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                            <td style={{ padding: "9px 12px", color: "#9ca3af" }}>{p.name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</td>
                            {[p.admin, p.developer, p.viewer].map((has, j) => (
                              <td key={j} style={{ padding: "9px 12px" }}>
                                <span style={{ fontSize: 15 }}>{has ? "✅" : "—"}</span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Role Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {Object.entries(ROLE_META).map(([role, m]) => (
                    <div key={role} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 14, padding: "20px 22px" }}>
                      <div style={{ fontSize: 24, marginBottom: 10 }}>{m.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: m.color, marginBottom: 6 }}>{m.label}</div>
                      <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── TEAM MEMBERS TAB ── */}
            {activeTab === "team" && canViewTeam && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>👥 Team Members</div>
                  {canAssign && (
                    <div style={{ fontSize: 11, color: "#4b5563", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                      Click a role badge to change it
                    </div>
                  )}
                </div>

                {members.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#374151", fontSize: 14 }}>
                    No team members found.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {/* Header row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, padding: "6px 12px", marginBottom: 4 }}>
                      {["Member", "Joined", "Role"].map(h => (
                        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
                      ))}
                    </div>

                    {members.map((m, i) => {
                      const isSelf = m.user_id === selfId;
                      return (
                        <div key={m.user_id} style={{
                          display: "grid", gridTemplateColumns: "1fr 1fr auto",
                          gap: 16, alignItems: "center",
                          padding: "13px 12px",
                          background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                          borderRadius: 10,
                          border: isSelf ? "1px solid rgba(99,102,241,0.15)" : "1px solid transparent",
                          transition: "background 0.15s",
                        }}
                          onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                          onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent"}
                        >
                          {/* Member info */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                              background: `hsl(${m.email.charCodeAt(0) * 7 % 360}, 50%, 25%)`,
                              border: "1px solid rgba(255,255,255,0.1)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 700, color: "#e2e8f0",
                            }}>
                              {(m.name || m.email || "?")[0].toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {m.name || m.email}
                                {isSelf && <span style={{ marginLeft: 6, fontSize: 10, color: "#6366f1", background: "rgba(99,102,241,0.15)", padding: "2px 6px", borderRadius: 4 }}>you</span>}
                              </div>
                              <div style={{ fontSize: 11, color: "#4b5563", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</div>
                            </div>
                          </div>

                          {/* Joined date */}
                          <div style={{ fontSize: 12, color: "#4b5563" }}>
                            {m.joined_at ? new Date(m.joined_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}
                          </div>

                          {/* Role selector */}
                          <RoleSelector
                            currentRole={m.role}
                            userId={m.user_id}
                            onAssign={handleAssignRole}
                            disabled={!canAssign}
                            selfId={selfId}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── AUDIT LOG TAB ── */}
            {activeTab === "audit" && canViewAudit && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>📝 Recent Audit Activity</div>
                {auditLogs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#374151", fontSize: 14 }}>No audit events yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {auditLogs.map(log => {
                      const isRoleChange = log.action === "role_assigned";
                      return (
                        <div key={log.log_id} style={{
                          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
                          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 10, padding: "12px 16px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ fontSize: 18, flexShrink: 0 }}>
                              {isRoleChange ? "🔄" : "📌"}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{log.user_email}</div>
                              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                                {log.action.replace(/_/g, " ")}
                                {isRoleChange && log.details?.from_role && log.details?.to_role && (
                                  <span>
                                    {" · "}
                                    <RoleBadge role={log.details.from_role} />
                                    <span style={{ margin: "0 4px", color: "#374151" }}>→</span>
                                    <RoleBadge role={log.details.to_role} />
                                  </span>
                                )}
                                {log.resource_type && !isRoleChange ? ` · ${log.resource_type}` : ""}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: "#374151", flexShrink: 0, paddingTop: 2 }}>
                            {new Date(log.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
