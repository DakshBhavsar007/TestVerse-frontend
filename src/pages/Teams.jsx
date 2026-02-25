import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import TeamChat from "./TeamChat";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const ROLE_COLORS = {
  owner: { text: "#818cf8", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)" },
  admin: { text: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  viewer: { text: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
};

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.viewer;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`, textTransform: "uppercase", letterSpacing: "0.4px"
    }}>
      {role}
    </span>
  );
}

function Avatar({ email, size = 36 }) {
  const letter = (email || "?")[0].toUpperCase();
  const hue = [...(email || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},55%,35%)`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff"
    }}>
      {letter}
    </div>
  );
}

export default function Teams() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [teamsData, setTeamsData] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [createErr, setCreateErr] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviteErr, setInviteErr] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadTeams();
  }, [authFetch]);

  const loadTeams = () => {
    authFetch(`${API}/teams/mine`)
      .then(r => r.json())
      .then(d => {
        setTeamsData(d.teams || []);
        if (d.teams && d.teams.length > 0 && !selectedTeamId) {
          setSelectedTeamId(d.teams[0].team.team_id);
        } else if (d.teams && d.teams.length === 0) {
          setSelectedTeamId(null);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  const currentData = teamsData.find(t => t.team.team_id === selectedTeamId);
  const team = currentData?.team;
  const members = currentData?.members || [];

  const isOwner = team && (team.owner_id === user?.id || team.owner_email === user?.email);
  const isAdmin = members.some(m => m.email === user?.email && (m.role === "admin" || m.role === "owner"));

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

      const newTeamData = {
        team: d.team,
        members: [{ email: user?.email, role: "owner", accepted: true }]
      };

      setTeamsData(prev => [...prev, newTeamData]);
      setSelectedTeamId(d.team.team_id);
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

      setTeamsData(prev => prev.map(t => {
        if (t.team.team_id === team.team_id) {
          return { ...t, members: [...t.members, d.member] };
        }
        return t;
      }));
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

      setTeamsData(prev => prev.map(t => {
        if (t.team.team_id === team.team_id) {
          return { ...t, members: t.members.filter(m => m.email !== email) };
        }
        return t;
      }));
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

      setTeamsData(prev => prev.map(t => {
        if (t.team.team_id === team.team_id) {
          return { ...t, members: t.members.map(m => m.email === email ? { ...m, role: newRole } : m) };
        }
        return t;
      }));
    } catch (e) { setError(e.message); }
  };

  const handleDeleteTeam = async () => {
    try {
      const r = await authFetch(`${API}/teams/${team.team_id}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail); }

      const newTeamsData = teamsData.filter(t => t.team.team_id !== team.team_id);
      setTeamsData(newTeamsData);
      setSelectedTeamId(newTeamsData.length > 0 ? newTeamsData[0].team.team_id : null);
    } catch (e) { setError(e.message); }
  };

  const currentMember = members.find(m => m.email === user?.email);
  const isPending = currentMember && currentMember.accepted === false;

  const handleRespondToInvite = async (accept) => {
    try {
      const r = await authFetch(`${API}/teams/${team.team_id}/members/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept })
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail); }

      if (accept) {
        setTeamsData(prev => prev.map(t => {
          if (t.team.team_id === team.team_id) {
            return {
              ...t,
              members: t.members.map(m => m.email === user?.email ? { ...m, accepted: true } : m)
            };
          }
          return t;
        }));
      } else {
        const newTeamsData = teamsData.filter(t => t.team.team_id !== team.team_id);
        setTeamsData(newTeamsData);
        setSelectedTeamId(newTeamsData.length > 0 ? newTeamsData[0].team.team_id : null);
      }
    } catch (e) { setError(e.message); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1, display: "flex", gap: 32 }}>

        {/* Sidebar: Teams List */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Groups</h1>
            <p style={{ color: "#4b5563", fontSize: 13, margin: "6px 0 0" }}>Your collaborative testing workspaces</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {teamsData.map(t => (
              <button key={t.team.team_id} onClick={() => setSelectedTeamId(t.team.team_id)} style={{
                textAlign: "left", padding: "14px", borderRadius: 12, border: "1px solid",
                borderColor: selectedTeamId === t.team.team_id ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.05)",
                background: selectedTeamId === t.team.team_id ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)",
                color: selectedTeamId === t.team.team_id ? "#818cf8" : "#e2e8f0", cursor: "pointer", transition: "all 0.15s"
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.team.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{t.members.length} members</div>
              </button>
            ))}
          </div>

          {!creating ? (
            <button onClick={() => setCreating(true)} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              + Create New Group
            </button>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", padding: "16px", borderRadius: 12 }}>
              <input autoFocus type="text" placeholder="e.g. Acme QA Team" value={teamName}
                onChange={e => setTeamName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()}
                style={{ width: "100%", padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
              {createErr && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>{createErr}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCreate} disabled={createLoading} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: createLoading ? 0.7 : 1 }}>Create</button>
                <button onClick={() => { setCreating(false); setTeamName(""); setCreateErr(""); }} style={{ padding: "8px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 18px", color: "#f87171", fontSize: 14, marginBottom: 20 }}>
              {error}
              <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            </div>
          ) : !team ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#6b7280" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Select a group or create one</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Top Row: Team Info & Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 16, padding: "20px 24px" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0" }}>{team.name}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Created {(team.created_at || "").slice(0, 10)}</div>
                </div>
                {isOwner && (
                  <button onClick={handleDeleteTeam} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Delete Group
                  </button>
                )}
              </div>

              {/* Pending Invite Banner */}
              {isPending && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: "16px 24px" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>You have been invited to this group</div>
                    <div style={{ fontSize: 13, color: "#d97706" }}>Accept this invitation to participate in the chat and view tasks.</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleRespondToInvite(true)} style={{ padding: "8px 20px", borderRadius: 8, background: "#f59e0b", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Accept</button>
                    <button onClick={() => handleRespondToInvite(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Reject</button>
                  </div>
                </div>
              )}

              {/* Chat and Members Split */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
                <TeamChat
                  team={team}
                  members={members}
                  onSettingsChanged={(val) => {
                    setTeamsData(prev => prev.map(t => {
                      if (t.team.team_id === team.team_id) {
                        return { ...t, team: { ...t.team, admins_only_chat: val } };
                      }
                      return t;
                    }));
                  }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {/* Invite Member */}
                  {(isOwner || isAdmin) && (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 12 }}>Invite Member</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        <input type="email" placeholder="colleague@company.com" value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleInvite()}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                          style={{ width: 100, padding: "8px", borderRadius: 8, background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 13, outline: "none" }}>
                          <option value="viewer">Viewer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={handleInvite} disabled={inviteLoading} style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Invite
                        </button>
                      </div>
                      {inviteErr && <div style={{ color: "#f87171", fontSize: 12 }}>{inviteErr}</div>}
                      {inviteSuccess && <div style={{ color: "#10b981", fontSize: 12 }}>{inviteSuccess}</div>}
                    </div>
                  )}

                  {/* Members List */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>Members ({members.length})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {members.map(m => {
                        const isSelf = m.email === user?.email;
                        const canEdit = (isOwner || isAdmin) && !isSelf && m.role !== "owner";
                        return (
                          <div key={m.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: isSelf ? "rgba(99,102,241,0.05)" : "rgba(255,255,255,0.02)", borderRadius: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                              <Avatar email={m.email} size={32} />
                              <div style={{ overflow: "hidden" }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {m.email}
                                </div>
                                <div style={{ fontSize: 11, color: "#6b7280" }}>{m.accepted ? "Active" : "Pending"}</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {canEdit ? (
                                <select value={m.role} onChange={e => handleRoleChange(m.email, e.target.value)}
                                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#e2e8f0", fontSize: 11, padding: "4px" }}>
                                  <option value="viewer">Viewer</option>
                                  <option value="admin">Admin</option>
                                </select>
                              ) : (
                                <RoleBadge role={m.role} />
                              )}

                              {canEdit && (
                                deleteConfirm === m.email ? (
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <button onClick={() => handleRemove(m.email)} style={{ padding: "4px", background: "rgba(239,68,68,0.2)", border: "none", color: "#f87171", cursor: "pointer", borderRadius: 4, fontSize: 10 }}>Yes</button>
                                    <button onClick={() => setDeleteConfirm(null)} style={{ padding: "4px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#9ca3af", cursor: "pointer", borderRadius: 4, fontSize: 10 }}>No</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteConfirm(m.email)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px", fontSize: 14 }} title="Remove">✕</button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}