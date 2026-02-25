import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const ROLE_COLORS = {
  owner: { text: "#818cf8", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)" },
  admin: { text: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  viewer: { text: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
};

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.viewer;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`, textTransform: "uppercase", letterSpacing: "0.4px" }}>
      {role}
    </span>
  );
}

function Avatar({ email, size = 36 }) {
  const letter = (email || "?")[0].toUpperCase();
  const hue = [...(email || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},55%,35%)`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff" }}>
      {letter}
    </div>
  );
}

export default function Teams() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam]       = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Create team form
  const [creating, setCreating]   = useState(false);
  const [teamName, setTeamName]   = useState("");
  const [createErr, setCreateErr] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState("viewer");
  const [inviteErr, setInviteErr]     = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null); // email to delete

  const isOwner = team && team.owner_id === user?.sub;
  const isAdmin = members.some(m => m.email === user?.email && (m.role === "admin" || m.role === "owner"));

  useEffect(() => {
    authFetch(`${API}/teams/mine`)
      .then(r => r.json())
      .then(d => { setTeam(d.team); setMembers(d.members || []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [authFetch]);

  const handleCreate = async () => {
    if (!teamName.trim()) { setCreateErr("Team name is required"); return; }
    setCreateLoading(true); setCreateErr("");
    try {
      const r = await authFetch(`${API}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed to create team");
      setTeam(d.team);
      setMembers([{ email: user?.email, role: "owner", accepted: true }]);
      setCreating(false); setTeamName("");
    } catch (e) { setCreateErr(e.message); }
    finally { setCreateLoading(false); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { setInviteErr("Email is required"); return; }
    setInviteLoading(true); setInviteErr(""); setInviteSuccess("");
    try {
      const r = await authFetch(`${API}/teams/${team.team_id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Invite failed");
      setMembers(prev => [...prev, d.member]);
      setInviteEmail(""); setInviteSuccess(`✓ ${inviteEmail} added to team`);
      setTimeout(() => setInviteSuccess(""), 3000);
    } catch (e) { setInviteErr(e.message); }
    finally { setInviteLoading(false); }
  };

  const handleRemove = async (email) => {
    try {
      const r = await authFetch(`${API}/teams/${team.team_id}/members/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail); }
      setMembers(prev => prev.filter(m => m.email !== email));
    } catch (e) { setError(e.message); }
    setDeleteConfirm(null);
  };

  const handleRoleChange = async (email, newRole) => {
    try {
      const r = await authFetch(`${API}/teams/${team.team_id}/members/${encodeURIComponent(email)}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail); }
      setMembers(prev => prev.map(m => m.email === email ? { ...m, role: newRole } : m));
    } catch (e) { setError(e.message); }
  };

  const handleDeleteTeam = async () => {
    try {
      const r = await authFetch(`${API}/teams/${team.team_id}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail); }
      setTeam(null); setMembers([]);
    } catch (e) { setError(e.message); }
  };

  const navBtn = (label, path, active = false) => (
    <button key={label} onClick={() => navigate(path)} style={{
      padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500,
      background: active ? "rgba(99,102,241,0.15)" : "transparent",
      border: active ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
      color: active ? "#818cf8" : "#9ca3af",
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" }} />
      </div>


      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Team</h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>Invite colleagues to collaborate on your TestVerse workspace</p>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 18px", color: "#f87171", fontSize: 14, marginBottom: 20 }}>
            {error}
            <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#4b5563", fontSize: 14 }}>Loading team…</p>
          </div>
        )}

        {/* No team yet */}
        {!loading && !team && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "48px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>👥</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "#e2e8f0" }}>No team yet</h2>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "0 0 28px" }}>Create a team to invite colleagues and share your testing workspace.</p>

            {!creating ? (
              <button onClick={() => setCreating(true)}
                style={{ padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Create Team →
              </button>
            ) : (
              <div style={{ maxWidth: 360, margin: "0 auto", textAlign: "left" }}>
                <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>Team Name</label>
                <input
                  autoFocus
                  type="text" placeholder="e.g. Acme QA Team" value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
                {createErr && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{createErr}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleCreate} disabled={createLoading}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: createLoading ? 0.7 : 1 }}>
                    {createLoading ? "Creating…" : "Create Team"}
                  </button>
                  <button onClick={() => { setCreating(false); setTeamName(""); setCreateErr(""); }}
                    style={{ padding: "10px 16px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280", fontSize: 14, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team exists */}
        {!loading && team && (
          <>
            {/* Team info card */}
            <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 20, padding: "24px 28px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Team</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.5px" }}>{team.name}</div>
                <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>
                  {members.length} member{members.length !== 1 ? "s" : ""} · Created {(team.created_at || "").slice(0, 10)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => navigate("/slack")}
                  style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  ⚙️ Slack Settings
                </button>
                {isOwner && (
                  <button onClick={handleDeleteTeam}
                    style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Delete Team
                  </button>
                )}
              </div>
            </div>

            {/* Invite form — admin/owner only */}
            {(isOwner || isAdmin) && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px", marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>Invite Member</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="email" placeholder="colleague@company.com" value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleInvite()}
                    style={{ flex: 2, minWidth: 200, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none" }} />
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    style={{ flex: 1, minWidth: 120, padding: "10px 12px", borderRadius: 10, background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", cursor: "pointer" }}>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={handleInvite} disabled={inviteLoading}
                    style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: inviteLoading ? 0.7 : 1, flexShrink: 0 }}>
                    {inviteLoading ? "Inviting…" : "Invite →"}
                  </button>
                </div>
                {inviteErr && <div style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{inviteErr}</div>}
                {inviteSuccess && <div style={{ color: "#10b981", fontSize: 13, marginTop: 8 }}>{inviteSuccess}</div>}
                <div style={{ fontSize: 12, color: "#374151", marginTop: 10 }}>
                  <strong style={{ color: "#6b7280" }}>Viewer</strong> — can see tests &nbsp;·&nbsp; <strong style={{ color: "#f59e0b" }}>Admin</strong> — can invite members and run tests
                </div>
              </div>
            )}

            {/* Members list */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 48px", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(99,102,241,0.06)" }}>
                {["Member", "Role", "Status", ""].map((h, i) => (
                  <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
                ))}
              </div>

              {members.length === 0 && (
                <div style={{ padding: "32px", textAlign: "center", color: "#374151", fontSize: 14 }}>No members yet</div>
              )}

              {members.map((m, i) => {
                const isSelf = m.email === user?.email;
                const canEdit = (isOwner || isAdmin) && !isSelf && m.role !== "owner";
                return (
                  <div key={m.email} style={{
                    display: "grid", gridTemplateColumns: "1fr 100px 100px 48px",
                    padding: "14px 20px", alignItems: "center",
                    borderBottom: i < members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: isSelf ? "rgba(99,102,241,0.04)" : "transparent",
                    transition: "background 0.15s",
                  }}>
                    {/* Email + avatar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar email={m.email} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
                          {m.email}
                          {isSelf && <span style={{ fontSize: 11, color: "#6366f1", marginLeft: 8, fontWeight: 600 }}>you</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>
                          Joined {(m.invited_at || "").slice(0, 10)}
                        </div>
                      </div>
                    </div>

                    {/* Role — editable for admin/owner */}
                    <div>
                      {canEdit ? (
                        <select value={m.role} onChange={e => handleRoleChange(m.email, e.target.value)}
                          style={{ background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 12, padding: "4px 8px", cursor: "pointer", outline: "none" }}>
                          <option value="viewer">Viewer</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <RoleBadge role={m.role} />
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        background: m.accepted ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                        color: m.accepted ? "#10b981" : "#f59e0b",
                        border: `1px solid ${m.accepted ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                      }}>
                        {m.accepted ? "Active" : "Pending"}
                      </span>
                    </div>

                    {/* Remove button */}
                    <div>
                      {canEdit && (
                        deleteConfirm === m.email ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => handleRemove(m.email)}
                              style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
                              Yes
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                              style={{ padding: "3px 8px", borderRadius: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280", fontSize: 11, cursor: "pointer" }}>
                              No
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(m.email)}
                            style={{ padding: "4px 8px", borderRadius: 6, background: "transparent", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 12, cursor: "pointer", opacity: 0.7 }}
                            title="Remove member">
                            ✕
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}