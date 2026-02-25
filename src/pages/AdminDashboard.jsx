import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const CARD = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px" };
const BTN_DEL = { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 700 };
const BTN_SAVE = { background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 700 };

export default function AdminDashboard() {
    const { authFetch, user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");

    const [editUser, setEditUser] = useState(null); // ID of user being edited
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const roleRes = await authFetch(`${API}/rbac/my-role`);
            if (roleRes.ok) {
                const roleData = await roleRes.json();
                if (roleData.role !== "admin") {
                    navigate("/");
                    return;
                }
            } else {
                navigate("/");
                return;
            }

            if (activeTab === "overview") {
                const r = await authFetch(`${API}/admin/overview`);
                if (!r.ok) throw new Error(await r.text());
                setStats(await r.json());
            } else if (activeTab === "users") {
                const r = await authFetch(`${API}/admin/users`);
                if (!r.ok) throw new Error(await r.text());
                const d = await r.json();
                setUsers(d.users || []);
            } else if (activeTab === "teams") {
                const r = await authFetch(`${API}/admin/teams`);
                if (!r.ok) throw new Error(await r.text());
                const d = await r.json();
                setTeams(d.teams || []);
            }
        } catch (e) {
            setError("Admin access denied or data failed to load.");
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (text) => {
        setMsg(text);
        setTimeout(() => setMsg(""), 3000);
    };

    // User Actions
    const handleEditUserClick = (u) => {
        setEditUser(u.id);
        setEditForm({ name: u.name || "", role: u.role || "developer" });
    };

    const handleSaveUser = async (id) => {
        try {
            const r = await authFetch(`${API}/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });
            if (!r.ok) throw new Error("Update failed");
            setUsers(prev => prev.map(u => u.id === id ? { ...u, ...editForm } : u));
            setEditUser(null);
            showMsg("User updated.");
        } catch (e) { setError(e.message); }
    };

    const handleDeleteUser = async (id, email) => {
        if (email === user?.email) {
            setError("Cannot delete yourself.");
            return;
        }
        if (!confirm(`Are you sure you want to delete ${email}?`)) return;
        try {
            const r = await authFetch(`${API}/admin/users/${id}`, { method: "DELETE" });
            if (!r.ok) throw new Error("Delete failed");
            setUsers(prev => prev.filter(u => u.id !== id));
            showMsg("User deleted.");
        } catch (e) { setError(e.message); }
    };

    // Team Actions
    const handleDeleteTeam = async (t_id, name) => {
        if (!confirm(`Are you sure you want to delete team '${name}'?`)) return;
        try {
            const r = await authFetch(`${API}/admin/teams/${t_id}`, { method: "DELETE" });
            if (!r.ok) throw new Error("Delete failed");
            setTeams(prev => prev.filter(t => t.team_id !== t_id));
            showMsg("Team deleted.");
        } catch (e) { setError(e.message); }
    };

    const tabStyle = (tab) => ({
        padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        background: activeTab === tab ? "rgba(99,102,241,0.15)" : "transparent",
        color: activeTab === tab ? "#818cf8" : "#9ca3af",
        border: activeTab === tab ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent"
    });

    return (
        <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", padding: "40px" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: "#f8fafc" }}>System Admin</h1>
                        <p style={{ color: "#9ca3af", margin: "4px 0 0" }}>Manage all TestVerse users, groups, and permissions</p>
                    </div>
                </div>

                {error && <div style={{ padding: "12px", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, marginBottom: 20 }}>{error}</div>}
                {msg && <div style={{ padding: "12px", background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, marginBottom: 20 }}>{msg}</div>}

                <div style={{ display: "flex", gap: 10, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16 }}>
                    <button style={tabStyle("overview")} onClick={() => setActiveTab("overview")}>Overview</button>
                    <button style={tabStyle("users")} onClick={() => setActiveTab("users")}>Users Console</button>
                    <button style={tabStyle("teams")} onClick={() => setActiveTab("teams")}>Teams Console</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading system data...</div>
                ) : (
                    <div>
                        {/* OVERVIEW */}
                        {activeTab === "overview" && stats && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                                {Object.entries(stats).map(([k, v]) => (
                                    <div key={k} style={{ ...CARD, textAlign: "center", borderTop: "3px solid #6366f1" }}>
                                        <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 8 }}>{v}</div>
                                        <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
                                            {k.replace("_", " ")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* USERS */}
                        {activeTab === "users" && (
                            <div style={CARD}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontSize: 12, textTransform: "uppercase" }}>
                                            <th style={{ padding: "12px" }}>Email</th>
                                            <th style={{ padding: "12px" }}>Name</th>
                                            <th style={{ padding: "12px" }}>System Role</th>
                                            <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>{u.email}</td>
                                                <td style={{ padding: "12px" }}>
                                                    {editUser === u.id ? (
                                                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "4px 8px", borderRadius: 4 }} />
                                                    ) : (u.name || "—")}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {editUser === u.id ? (
                                                        <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={{ background: "#000", border: "1px solid #333", color: "#fff", padding: "4px 8px", borderRadius: 4 }}>
                                                            <option value="admin">Admin</option>
                                                            <option value="developer">Developer</option>
                                                            <option value="viewer">Viewer</option>
                                                        </select>
                                                    ) : (
                                                        <span style={{ color: u.role === "admin" ? "#f59e0b" : "#6366f1", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>{u.role}</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: "12px", textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                                    {editUser === u.id ? (
                                                        <>
                                                            <button style={BTN_SAVE} onClick={() => handleSaveUser(u.id)}>Save</button>
                                                            <button style={{ ...BTN_DEL, background: "transparent", color: "#9ca3af" }} onClick={() => setEditUser(null)}>Cancel</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button style={{ ...BTN_SAVE, background: "rgba(99,102,241,0.15)", color: "#818cf8" }} onClick={() => handleEditUserClick(u)}>Edit</button>
                                                            <button style={BTN_DEL} onClick={() => handleDeleteUser(u.id, u.email)}>Delete</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TEAMS */}
                        {activeTab === "teams" && (
                            <div style={CARD}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontSize: 12, textTransform: "uppercase" }}>
                                            <th style={{ padding: "12px" }}>Team Name</th>
                                            <th style={{ padding: "12px" }}>Owner Email</th>
                                            <th style={{ padding: "12px" }}>Members</th>
                                            <th style={{ padding: "12px" }}>Created</th>
                                            <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teams.map(t => (
                                            <tr key={t.team_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>{t.name}</td>
                                                <td style={{ padding: "12px", color: "#9ca3af" }}>{t.owner_email || t.owner_id}</td>
                                                <td style={{ padding: "12px" }}>{t.members_count}</td>
                                                <td style={{ padding: "12px", fontSize: 13 }}>{t.created_at.slice(0, 10)}</td>
                                                <td style={{ padding: "12px", textAlign: "right" }}>
                                                    <button style={BTN_DEL} onClick={() => handleDeleteTeam(t.team_id, t.name)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
}
