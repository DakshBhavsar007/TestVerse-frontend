import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";


const ROLE_META = {
  admin:     { icon: "👑", label: "Admin",     color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  desc: "Full system access including billing, team management, and configuration." },
  developer: { icon: "💻", label: "Developer", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", desc: "Run tests, manage schedules, create API keys, and configure integrations." },
  viewer:    { icon: "👁", label: "Viewer",    color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.25)", desc: "Read-only access to test results and reports. Cannot run tests or modify settings." },
};

export default function RoleManagement() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [myRole, setMyRole]         = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs]   = useState([]);
  const [allPerms, setAllPerms]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    Promise.all([
      authFetch(`${API}/rbac/my-role`).then(r => r.json()),
      authFetch(`${API}/rbac/permissions-list`).then(r => r.json()),
    ]).then(async ([roleData, permsData]) => {
      setMyRole(roleData.role);
      setPermissions(roleData.permissions || []);
      setAllPerms(permsData.permissions || []);

      if ((roleData.permissions || []).includes("view_audit_logs")) {
        const auditData = await authFetch(`${API}/rbac/audit-logs?limit=15`).then(r => r.json());
        setAuditLogs(auditData.logs || []);
      }
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [authFetch]);

  const meta = myRole ? ROLE_META[myRole] : null;

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            🛡️ Role Management
          </h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Manage permissions and access control for your workspace</p>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : (<>

          {/* My Role Card */}
          {meta && (
            <div style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 16, padding: "24px 28px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 36 }}>{meta.icon}</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: meta.color, textTransform: "capitalize" }}>{myRole}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Your current role</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#e2e8f0" }}>{permissions.length}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>permissions granted</div>
              </div>
            </div>
          )}

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

          {/* Permissions reference table */}
          {allPerms.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px", marginBottom: 24, overflowX: "auto" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>📋 Permissions Reference</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Permission", "Admin 👑", "Developer 💻", "Viewer 👁"].map(h => (
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

          {/* Role cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {Object.entries(ROLE_META).map(([role, m]) => (
              <div key={role} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 14, padding: "20px 22px" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{m.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: m.color, marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>

          {/* Audit Logs (admin only) */}
          {auditLogs.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>📝 Recent Audit Activity</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {auditLogs.map(log => (
                  <div key={log.log_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 16px" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{log.user_email}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                        {log.action.replace(/_/g, " ")}
                        {log.resource_type ? ` · ${log.resource_type}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#374151" }}>{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>)}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
