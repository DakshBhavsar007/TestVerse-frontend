import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";


const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 };

const PLAN_COLORS = { free: "#6b7280", pro: "#6366f1", enterprise: "#f59e0b" };
const PLAN_ICONS  = { free: "🪶", pro: "⚡", enterprise: "🏢" };

function UsageBar({ label, used, limit, unlimited }) {
  const pct = unlimited ? 0 : Math.min((used / limit) * 100, 100);
  const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#6366f1";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: "#9ca3af", fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color: unlimited ? "#10b981" : pct > 90 ? "#ef4444" : "#e2e8f0" }}>
          {unlimited ? "∞ Unlimited" : `${used} / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
        </div>
      )}
    </div>
  );
}

export default function Billing() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [allPlans, setAllPlans] = useState({});
  const [history, setHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [planRes, plansRes, histRes, invRes] = await Promise.all([
        authFetch(`${API}/billing/my-plan`),
        authFetch(`${API}/billing/plans`),
        authFetch(`${API}/billing/usage-history`),
        authFetch(`${API}/billing/invoices`),
      ]);
      if (planRes.ok) setPlan(await planRes.json());
      if (plansRes.ok) setAllPlans((await plansRes.json()).plans || {});
      if (histRes.ok) setHistory((await histRes.json()).history || []);
      if (invRes.ok) setInvoices((await invRes.json()).invoices || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function changePlan(planName) {
    setChanging(true);
    setMsg("");
    try {
      const res = await authFetch(`${API}/billing/change-plan`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      });
      const data = await res.json();
      if (res.ok) { setMsg("✓ Plan updated!"); loadAll(); }
      else setMsg("✗ " + (data.detail || "Failed"));
    } catch (e) { setMsg("✗ " + e.message); }
    setChanging(false);
    setConfirmPlan(null);
  }

  const usageLabels = {
    tests_this_month: "Tests this month",
    schedules: "Scheduled tests",
    api_keys: "API keys",
    monitors: "Uptime monitors",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 20, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>BILLING & USAGE</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, background: "linear-gradient(135deg,#fff 40%,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Plan & Billing</h1>
          <p style={{ color: "#6b7280", marginTop: 8, fontSize: 15 }}>Manage your subscription, monitor usage, and view billing history.</p>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}><div style={{ width: 36, height: 36, border: "3px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />Loading...</div>}

        {!loading && plan && (
          <>
            {/* Current Plan Banner */}
            <div style={{ ...card, marginBottom: 24, background: `linear-gradient(135deg, rgba(${plan.plan === "enterprise" ? "245,158,11" : plan.plan === "pro" ? "99,102,241" : "107,114,128"},0.1), rgba(0,0,0,0))`, borderColor: `rgba(${plan.plan === "enterprise" ? "245,158,11" : plan.plan === "pro" ? "99,102,241" : "107,114,128"},0.3)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>CURRENT PLAN</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{PLAN_ICONS[plan.plan]}</span>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: PLAN_COLORS[plan.plan] }}>{allPlans[plan.plan]?.name || plan.plan}</div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>{plan.billing_period} · {allPlans[plan.plan]?.price_usd === 0 ? "Free" : `$${allPlans[plan.plan]?.price_usd}/month`}</div>
                    </div>
                  </div>
                </div>
                {msg && <div style={{ fontSize: 13, color: msg.startsWith("✓") ? "#10b981" : "#ef4444", fontWeight: 600 }}>{msg}</div>}
              </div>
            </div>

            {/* Usage */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              <div style={card}>
                <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>📊 Current Usage</h3>
                {Object.entries(plan.usage || {}).map(([key, u]) => (
                  <UsageBar key={key} label={usageLabels[key] || key} used={u.used} limit={u.limit} unlimited={u.unlimited} />
                ))}
                {Object.keys(plan.usage || {}).length === 0 && <div style={{ color: "#6b7280", fontSize: 13 }}>No usage data yet this month.</div>}
              </div>

              <div style={card}>
                <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>📈 Monthly Tests</h3>
                {history.length === 0 ? (
                  <div style={{ color: "#6b7280", fontSize: 13 }}>No usage history yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {history.map(h => {
                      const limit = allPlans[plan.plan]?.limits?.tests_per_month;
                      const pct = limit > 0 ? Math.min((h.tests_run / limit) * 100, 100) : 0;
                      return (
                        <div key={h.month_key}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: "#9ca3af" }}>{h.month}</span>
                            <span style={{ fontWeight: 700 }}>{h.tests_run} tests</span>
                          </div>
                          <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#6366f1", borderRadius: 99 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Plan Selector */}
            <div style={{ ...card, marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>🔄 Change Plan</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {Object.entries(allPlans).map(([key, p]) => {
                  const isActive = plan.plan === key;
                  const color = PLAN_COLORS[key];
                  return (
                    <div key={key} style={{ border: `2px solid ${isActive ? color : "rgba(255,255,255,0.08)"}`, borderRadius: 14, padding: 20, background: isActive ? `rgba(${key === "enterprise" ? "245,158,11" : key === "pro" ? "99,102,241" : "107,114,128"},0.08)` : "transparent", position: "relative" }}>
                      {isActive && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: color, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>CURRENT</div>}
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{PLAN_ICONS[key]}</div>
                      <div style={{ fontWeight: 800, fontSize: 18, color, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{p.price_usd === 0 ? "Free" : `$${p.price_usd}`}<span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>{p.price_usd > 0 ? "/mo" : ""}</span></div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                        {p.limits.tests_per_month === -1 ? "Unlimited tests" : `${p.limits.tests_per_month} tests/month`}<br />
                        {p.limits.team_members === -1 ? "Unlimited members" : `${p.limits.team_members} team member${p.limits.team_members !== 1 ? "s" : ""}`}<br />
                        {p.limits.monitors === -1 ? "Unlimited monitors" : `${p.limits.monitors} uptime monitor${p.limits.monitors !== 1 ? "s" : ""}`}
                      </div>
                      {!isActive && (
                        confirmPlan === key ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => changePlan(key)} disabled={changing} style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: color, color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Confirm</button>
                            <button onClick={() => setConfirmPlan(null)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "none", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmPlan(key)} style={{ width: "100%", padding: "9px 0", borderRadius: 8, background: "transparent", border: `1px solid ${color}`, color, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                            {plan.plan === "enterprise" || (plan.plan === "pro" && key === "free") ? "Downgrade" : "Upgrade"} to {p.name}
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices */}
            <div style={card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>🧾 Billing Events</h3>
              {invoices.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: 13 }}>No billing events yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {invoices.map(inv => (
                    <div key={inv.event_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.type === "plan_change" ? `Plan changed: ${inv.from_plan} → ${inv.to_plan}` : inv.type}</div>
                        <div style={{ fontSize: 11, color: "#4b5563" }}>{inv.timestamp?.slice(0, 16).replace("T", " ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
