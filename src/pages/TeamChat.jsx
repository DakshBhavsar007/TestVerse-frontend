import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const WS_URL = API.replace("http", "ws");

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 65%)`;
}

export default function TeamChat({ team, members, onSettingsChanged }) {
    const { user, authFetch } = useAuth();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const ws = useRef(null);
    const bottomRef = useRef(null);

    const isOwner = team.owner_id === user?.id || team.owner_email === user?.email;
    const myMember = members.find(m => m.email === user?.email);
    const isAdmin = myMember?.role === "admin" || myMember?.role === "owner" || isOwner;
    const canChat = !team.admins_only_chat || isAdmin;

    useEffect(() => {
        setMessages([]);
        setError("");
        authFetch(`${API}/chat/${team.team_id}/messages`)
            .then(r => r.json())
            .then(d => setMessages(d.messages || []))
            .catch(console.error);

        const socket = new WebSocket(`${WS_URL}/chat/${team.team_id}/ws/${encodeURIComponent(user.email)}`);
        ws.current = socket;

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.error) {
                setError(data.error);
                setTimeout(() => setError(""), 5000);
            } else if (data.msg_id) {
                setMessages(prev => [...prev, data]);
            }
        };

        return () => socket.close();
    }, [team.team_id, user.email, authFetch]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = (e) => {
        e.preventDefault();
        if (!text.trim() || !ws.current || !canChat) return;
        ws.current.send(JSON.stringify({ text, user_name: user?.name || user?.email.split("@")[0] }));
        setText("");
    };

    const toggleAdminsOnly = async () => {
        if (!isOwner) return;
        try {
            const r = await authFetch(`${API}/teams/${team.team_id}/settings`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ admins_only_chat: !team.admins_only_chat })
            });
            if (r.ok) {
                const d = await r.json();
                onSettingsChanged(d.admins_only_chat);
            }
        } catch { }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: 500, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>

            {/* Chat header */}
            <div style={{ padding: "12px 20px", background: "rgba(99,102,241,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>Team Chat</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>{members.length} member{members.length !== 1 ? 's' : ''}</div>
                </div>
                {isOwner && (
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#e2e8f0", cursor: "pointer" }}>
                        <input type="checkbox" checked={!!team.admins_only_chat} onChange={toggleAdminsOnly} />
                        Only Admins Can Chat
                    </label>
                )}
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: 40 }}>No messages yet. Start the conversation!</div>
                )}
                {messages.map(m => {
                    const isMe = m.user_email === user?.email;
                    return (
                        <div key={m.msg_id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                            {!isMe && <div style={{ fontSize: 11, fontWeight: 600, color: stringToColor(m.user_email), marginBottom: 4, marginLeft: 2 }}>{m.user_name}</div>}
                            <div style={{
                                background: isMe ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.08)",
                                padding: "10px 14px", borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                                color: "#e2e8f0", fontSize: 14, maxWidth: "80%", wordBreak: "break-word",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                            }}>
                                {m.text}
                            </div>
                            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Error toaster */}
            {error && (
                <div style={{ background: "rgba(239,68,68,0.9)", color: "#fff", fontSize: 12, padding: "8px", textAlign: "center", fontWeight: 600 }}>
                    {error}
                </div>
            )}

            {/* Input area */}
            <form onSubmit={send} style={{ display: "flex", padding: "12px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <input
                    value={text} onChange={e => setText(e.target.value)}
                    placeholder={canChat ? "Type a message..." : "Only admins can send messages"}
                    disabled={!canChat}
                    style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", outline: "none", fontSize: 14 }}
                />
                <button type="submit" disabled={!canChat || !text.trim()} style={{
                    marginLeft: 8, padding: "0 20px", borderRadius: 10, background: (!canChat || !text.trim()) ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff", border: "none", fontWeight: 700, cursor: (!canChat || !text.trim()) ? "not-allowed" : "pointer", opacity: (!canChat || !text.trim()) ? 0.6 : 1
                }}>
                    Send
                </button>
            </form>
        </div>
    );
}
