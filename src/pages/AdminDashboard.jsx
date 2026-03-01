import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const CARD = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px" };
const BTN_DEL = { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 700 };
const BTN_SAVE = { background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 700 };

const PLAN_COLORS = {
    free: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", border: "rgba(100,116,139,0.3)" },
    pro: { bg: "rgba(99,102,241,0.15)", text: "#818cf8", border: "rgba(99,102,241,0.3)" },
    enterprise: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", border: "rgba(245,158,11,0.3)" },
};

export default function AdminDashboard() {
    const { authFetch, user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [billingUsers, setBillingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");
    const [planChanging, setPlanChanging] = useState(null); // user_id being changed

    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        setLoading(true); setError("");
        if (user?.email !== "admin@testverse.com") { navigate("/"); return; }
        try {
            const roleRes = await authFetch(`${API}/rbac/my-role`);
            if (!roleRes.ok) { navigate("/"); return; }
            const roleData = await roleRes.json();
            if (roleData.role !== "admin") { navigate("/"); return; }

            if (activeTab === "overview") {
                const r = await authFetch(`${API}/admin/overview`);
                setStats(await r.json());
            } else if (activeTab === "users") {
                const r = await authFetch(`${API}/admin/users`);
                setUsers((await r.json()).users || []);
            } else if (activeTab === "teams") {
                const r = await authFetch(`${API}/admin/teams`);
                setTeams((await r.json()).teams || []);
            } else if (activeTab === "billing") {
                const r = await authFetch(`${API}/admin/billing/users`);
                setBillingUsers((await r.json()).users || []);
            }
        } catch { setError("Admin access denied or data failed to load."); }
        finally { setLoading(false); }
    };

    const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3500); };

    const handleEditUserClick = (u) => { setEditUser(u.id); setEditForm({ name: u.name || "", role: u.role || "developer" }); };
    const handleSaveUser = async (id) => {
        try {
            const r = await authFetch(`${API}/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(editForm) });
            if (!r.ok) throw new Error("Update failed");
            setUsers(prev => prev.map(u => u.id === id ? { ...u, ...editForm } : u));
            setEditUser(null); showMsg("User updated.");
        } catch (e) { setError(e.message); }
    };
    const handleDeleteUser = async (id, email) => {
        if (email === user?.email) { setError("Cannot delete yourself."); return; }
        if (!confirm(`Delete ${email}?`)) return;
        try {
            const r = await authFetch(`${API}/admin/users/${id}`, { method: "DELETE" });
            if (!r.ok) throw new Error("Delete failed");
            setUsers(prev => prev.filter(u => u.id !== id)); showMsg("User deleted.");
        } catch (e) { setError(e.message); }
    };
    const handleToggleActive = async (u) => {
        if (u.email === user?.email) { setError("Cannot deactivate yourself."); return; }
        const newStatus = u.is_active === false;
        if (!confirm(`${newStatus ? "Activate" : "Deactivate"} ${u.email}?`)) return;
        try {
            await authFetch(`${API}/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ is_active: newStatus }) });
            setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, is_active: newStatus } : usr));
            showMsg(`User ${newStatus ? "activated" : "deactivated"}.`);
        } catch (e) { setError(e.message); }
    };
    const handleDeleteTeam = async (t_id, name) => {
        if (!confirm(`Delete team '${name}'?`)) return;
        try {
            await authFetch(`${API}/admin/teams/${t_id}`, { method: "DELETE" });
            setTeams(prev => prev.filter(t => t.team_id !== t_id)); showMsg("Team deleted.");
        } catch (e) { setError(e.message); }
    };

    // ── Billing: change any user's plan ────────────────────────────────────────
    const handleChangePlan = async (userId, email, newPlan) => {
        if (!confirm(`Change ${email}'s plan to ${newPlan.toUpperCase()}?`)) return;
        setPlanChanging(userId);
        try {
            const r = await authFetch(`${API}/admin/billing/change-plan`, {
                method: "POST",
                body: JSON.stringify({ user_id: userId, plan: newPlan }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.detail || "Failed");
            setBillingUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan, plan_label: { free: "Free", pro: "Pro", enterprise: "Enterprise" }[newPlan] } : u));
            showMsg(`✅ ${d.message}`);
        } catch (e) { setError(e.message); }
        finally { setPlanChanging(null); }
    };

    const tabStyle = (tab) => ({
        padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        background: activeTab === tab ? "rgba(99,102,241,0.15)" : "transparent",
        color: activeTab === tab ? "#818cf8" : "#9ca3af",
        border: activeTab === tab ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
        transition: "all 0.15s",
    });

    return (
        <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", padding: "40px 32px" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap');
        tr:hover td { background: rgba(255,255,255,0.02); }
        select { font-family: inherit; }
      `}</style>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: "#f8fafc" }}>👑 System Admin</h1>
                        <p style={{ color: "#9ca3af", margin: "4px 0 0" }}>Manage all TestVerse users, teams, and billing</p>
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "8px 14px" }}>
                        Logged in as <strong style={{ color: "#818cf8" }}>{user?.email}</strong>
                    </div>
                </div>

                {error && <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, marginBottom: 16 }}>{error}</div>}
                {msg && <div style={{ padding: "12px 16px", background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, marginBottom: 16 }}>{msg}</div>}

                {/* Tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16, flexWrap: "wrap" }}>
                    <button style={tabStyle("overview")} onClick={() => setActiveTab("overview")}>📊 Overview</button>
                    <button style={tabStyle("users")} onClick={() => setActiveTab("users")}>👥 Users Console</button>
                    <button style={tabStyle("teams")} onClick={() => setActiveTab("teams")}>⊛ Teams Console</button>
                    <button style={tabStyle("billing")} onClick={() => setActiveTab("billing")}>💳 Billing Manager</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
                        <div style={{ width: 36, height: 36, margin: "0 auto 14px", border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
                        Loading system data...
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <div>
                        {/* OVERVIEW */}
                        {activeTab === "overview" && stats && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                                {Object.entries(stats).map(([k, v]) => (
                                    <div key={k} style={{ ...CARD, textAlign: "center", borderTop: "3px solid #6366f1" }}>
                                        <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 8 }}>{v}</div>
                                        <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{k.replace(/_/g, " ")}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* USERS */}
                        {activeTab === "users" && (
                            <div style={CARD}>
                                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>{users.length} registered users</div>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                                <th style={{ padding: "10px 12px" }}>Email</th>
                                                <th style={{ padding: "10px 12px" }}>Name</th>
                                                <th style={{ padding: "10px 12px" }}>System Role</th>
                                                <th style={{ padding: "10px 12px" }}>Last Login</th>
                                                <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.1s" }}>
                                                    <td style={{ padding: "12px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: u.is_active === false ? "#ef4444" : "#10b981", flexShrink: 0 }} />
                                                            <span style={{ opacity: u.is_active === false ? 0.5 : 1, fontWeight: 600, fontSize: 13 }}>{u.email}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "12px" }}>
                                                        {editUser === u.id
                                                            ? <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "4px 8px", borderRadius: 6, fontSize: 13 }} />
                                                            : <span style={{ color: "#94a3b8" }}>{u.name || "—"}</span>}
                                                    </td>
                                                    <td style={{ padding: "12px" }}>
                                                        {editUser === u.id
                                                            ? <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "4px 8px", borderRadius: 6, fontSize: 13 }}>
                                                                <option value="admin">Admin</option>
                                                                <option value="developer">Developer</option>
                                                                <option value="viewer">Viewer</option>
                                                            </select>
                                                            : <span style={{ color: u.role === "admin" ? "#f59e0b" : "#6366f1", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{u.role}</span>}
                                                    </td>
                                                    <td style={{ padding: "12px", fontSize: 11, color: "#6b7280" }}>
                                                        {u.last_login ? new Date(u.last_login).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Never"}
                                                    </td>
                                                    <td style={{ padding: "12px", textAlign: "right" }}>
                                                        {u.email === user?.email
                                                            ? <span style={{ color: "#6b7280", fontSize: 12, padding: "6px 14px" }}>You</span>
                                                            : editUser === u.id
                                                                ? <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                                    <button style={BTN_SAVE} onClick={() => handleSaveUser(u.id)}>Save</button>
                                                                    <button style={{ ...BTN_DEL, background: "transparent", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }} onClick={() => setEditUser(null)}>Cancel</button>
                                                                </div>
                                                                : <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                                    <button style={{ ...BTN_SAVE, background: "rgba(99,102,241,0.15)", color: "#818cf8" }} onClick={() => handleEditUserClick(u)}>Edit</button>
                                                                    <button style={{ ...BTN_SAVE, background: u.is_active === false ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: u.is_active === false ? "#10b981" : "#f59e0b" }} onClick={() => handleToggleActive(u)}>{u.is_active === false ? "Activate" : "Suspend"}</button>
                                                                    <button style={BTN_DEL} onClick={() => handleDeleteUser(u.id, u.email)}>Delete</button>
                                                                </div>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TEAMS */}
                        {activeTab === "teams" && (
                            <div style={CARD}>
                                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>{teams.length} teams</div>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                            <th style={{ padding: "10px 12px" }}>Team Name</th>
                                            <th style={{ padding: "10px 12px" }}>Owner</th>
                                            <th style={{ padding: "10px 12px" }}>Members</th>
                                            <th style={{ padding: "10px 12px" }}>Created</th>
                                            <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teams.map(t => (
                                            <tr key={t.team_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>{t.name}</td>
                                                <td style={{ padding: "12px", color: "#9ca3af", fontSize: 13 }}>{t.owner_email || t.owner_id}</td>
                                                <td style={{ padding: "12px" }}>{t.members_count}</td>
                                                <td style={{ padding: "12px", fontSize: 12, color: "#6b7280" }}>{t.created_at?.slice(0, 10)}</td>
                                                <td style={{ padding: "12px", textAlign: "right" }}>
                                                    <button style={BTN_DEL} onClick={() => handleDeleteTeam(t.team_id, t.name)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── BILLING MANAGER ─────────────────────────────────────────────── */}
                        {activeTab === "billing" && (
                            <div>
                                {/* Header cards */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                                    {["free", "pro", "enterprise"].map(p => {
                                        const count = billingUsers.filter(u => u.plan === p).length;
                                        const pc = PLAN_COLORS[p];
                                        return (
                                            <div key={p} style={{ background: pc.bg, border: `1px solid ${pc.border}`, borderRadius: 14, padding: "18px 22px" }}>
                                                <div style={{ fontSize: 28, fontWeight: 900, color: pc.text }}>{count}</div>
                                                <div style={{ fontSize: 12, color: pc.text, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>
                                                    {p === "free" ? "Free" : p === "pro" ? "Pro ($29/mo)" : "Enterprise ($99/mo)"} users
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={CARD}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: 17, color: "#f1f5f9" }}>All User Plans</div>
                                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{billingUsers.length} users — click a plan badge to change it</div>
                                        </div>
                                        <button onClick={loadData} style={{ ...BTN_SAVE, padding: "8px 16px", fontSize: 13 }}>🔄 Refresh</button>
                                    </div>

                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                                    <th style={{ padding: "10px 12px", textAlign: "left" }}>User</th>
                                                    <th style={{ padding: "10px 12px", textAlign: "left" }}>Email</th>
                                                    <th style={{ padding: "10px 12px", textAlign: "left" }}>Status</th>
                                                    <th style={{ padding: "10px 12px", textAlign: "left" }}>Current Plan</th>
                                                    <th style={{ padding: "10px 12px", textAlign: "left" }}>Last Changed</th>
                                                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Change Plan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {billingUsers.map(u => {
                                                    const pc = PLAN_COLORS[u.plan] || PLAN_COLORS.free;
                                                    const isChanging = planChanging === u.id;
                                                    return (
                                                        <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.1s" }}>
                                                            <td style={{ padding: "12px", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
                                                                {u.name || u.email.split("@")[0]}
                                                            </td>
                                                            <td style={{ padding: "12px", fontSize: 12, color: "#6b7280" }}>{u.email}</td>
                                                            <td style={{ padding: "12px" }}>
                                                                <span style={{
                                                                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                                                                    background: u.is_active ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                                                    color: u.is_active ? "#10b981" : "#ef4444",
                                                                    textTransform: "uppercase",
                                                                }}>{u.is_active ? "Active" : "Suspended"}</span>
                                                            </td>
                                                            <td style={{ padding: "12px" }}>
                                                                <span style={{
                                                                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                                                                    background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`,
                                                                    textTransform: "uppercase", letterSpacing: "0.06em",
                                                                }}>{u.plan_label}</span>
                                                            </td>
                                                            <td style={{ padding: "12px", fontSize: 11, color: "#475569" }}>
                                                                {u.plan_changed_at ? new Date(u.plan_changed_at).toLocaleString([], { month: "short", day: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                                                            </td>
                                                            <td style={{ padding: "12px", textAlign: "right" }}>
                                                                {isChanging
                                                                    ? <span style={{ fontSize: 12, color: "#6b7280" }}>Saving…</span>
                                                                    : <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                                        {["free", "pro", "enterprise"].filter(p => p !== u.plan).map(p => {
                                                                            const c = PLAN_COLORS[p];
                                                                            return (
                                                                                <button key={p}
                                                                                    onClick={() => handleChangePlan(u.id, u.email, p)}
                                                                                    style={{
                                                                                        background: c.bg, border: `1px solid ${c.border}`,
                                                                                        color: c.text, fontSize: 11, fontWeight: 700, padding: "4px 10px",
                                                                                        borderRadius: 8, cursor: "pointer", textTransform: "capitalize",
                                                                                        transition: "all 0.15s",
                                                                                    }}
                                                                                    onMouseOver={e => e.currentTarget.style.opacity = "0.75"}
                                                                                    onMouseOut={e => e.currentTarget.style.opacity = "1"}
                                                                                >→ {p}</button>
                                                                            );
                                                                        })}
                                                                    </div>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
