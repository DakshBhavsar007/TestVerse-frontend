import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const NAV = [
  ["Dashboard", "/dashboard"], ["History", "/history"], ["Trends", "/trends"],
  ["Diff", "/diff"], ["Schedules", "/schedules"], ["Teams", "/teams"],
  ["Slack", "/slack"], ["API Keys", "/apikeys"], ["Bulk Test", "/bulk"],
  ["Branding", "/whitelabel"], ["Analytics", "/analytics"],
  ["Roles", "/roles"], ["Alerts", "/notifications"], ["Templates", "/templates"],
  ["Monitors", "/monitoring"], ["Reporting", "/reporting"], ["Billing", "/billing"],
  ["Compliance", "/compliance"], ["Dev Tools", "/devtools"], ["New Test", "/"],
];

function Navbar({ user, logout, active }) {
  const navigate = useNavigate();
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>TestVerse</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#6b7280", marginRight: 4 }}>{user?.email}</span>
        {NAV.map(([label, path]) => (
          <button key={label} onClick={() => navigate(path)} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 500,
            background: active === label ? "rgba(99,102,241,0.15)" : "transparent",
            border: active === label ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: active === label ? "#818cf8" : "#9ca3af",
          }}>{label}</button>
        ))}
        <button onClick={() => { logout(); navigate("/login"); }} style={{ padding: "5px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>Logout</button>
      </div>
    </nav>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 };
const btn = (active) => ({ padding: "8px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: 600, border: "none", background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)", color: active ? "#fff" : "#9ca3af" });
const input = { width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box", outline: "none" };
const label = { fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6 };

const CRON_PRESETS = [
  { label: "Daily 9am", value: "0 9 * * *" },
  { label: "Weekly Mon", value: "0 9 * * 1" },
  { label: "Monthly 1st", value: "0 9 1 * *" },
];

export default function Reporting() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("export");
  const [summary, setSummary] = useState(null);
  const [summaryDays, setSummaryDays] = useState(30);
  const [dashboards, setDashboards] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Export state
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportDays, setExportDays] = useState(30);
  const [exportUrl, setExportUrl] = useState("");
  const [exporting, setExporting] = useState(false);

  // New scheduled report form
  const [reportForm, setReportForm] = useState({ name: "", cron: "0 9 * * 1", format: "csv", delivery: "email", destination: "" });
  const [savingReport, setSavingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [sumRes, dashRes, schRes] = await Promise.all([
        authFetch(`${API}/reporting/summary?days=${summaryDays}`),
        authFetch(`${API}/reporting/dashboards`),
        authFetch(`${API}/reporting/scheduled-reports`),
      ]);
      if (sumRes.ok) setSummary((await sumRes.json()).summary);
      if (dashRes.ok) setDashboards((await dashRes.json()).dashboards || []);
      if (schRes.ok) setScheduledReports((await schRes.json()).reports || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ days: exportDays });
      if (exportUrl) params.set("url_filter", exportUrl);
      const res = await authFetch(`${API}/reporting/export/${exportFormat}?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `testverse_export_${new Date().toISOString().slice(0,10)}.${exportFormat}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) { console.error(e); }
    setExporting(false);
  }

  async function saveScheduledReport() {
    if (!reportForm.name || !reportForm.destination) return;
    setSavingReport(true);
    setReportMsg("");
    try {
      const res = await authFetch(`${API}/reporting/scheduled-reports`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportForm),
      });
      if (res.ok) {
        setReportMsg("✓ Scheduled report created!");
        setReportForm({ name: "", cron: "0 9 * * 1", format: "csv", delivery: "email", destination: "" });
        loadAll();
      } else {
        const d = await res.json();
        setReportMsg("✗ " + (d.detail || "Failed"));
      }
    } catch (e) { setReportMsg("✗ " + e.message); }
    setSavingReport(false);
  }

  async function deleteScheduledReport(id) {
    await authFetch(`${API}/reporting/scheduled-reports/${id}`, { method: "DELETE" });
    setScheduledReports(prev => prev.filter(r => r.report_id !== id));
  }

  async function deleteDashboard(id) {
    await authFetch(`${API}/reporting/dashboards/${id}`, { method: "DELETE" });
    setDashboards(prev => prev.filter(d => d.dashboard_id !== id));
  }

  const scoreColor = (s) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans','Inter',sans-serif", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
      </div>

      <Navbar user={user} logout={logout} active="Reporting" />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 600 }}>ADVANCED REPORTING</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, background: "linear-gradient(135deg,#fff 40%,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Reports & Exports</h1>
          <p style={{ color: "#6b7280", marginTop: 8, fontSize: 15 }}>Export test data, build custom dashboards, and schedule automated report delivery.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {[["export", "📤 Export Data"], ["summary", "📊 Summary"], ["dashboards", "🗂 Dashboards"], ["schedule", "📅 Schedule"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={btn(tab === t)}>{l}</button>
          ))}
        </div>

        {loading && <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}><div style={{ width: 36, height: 36, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />Loading...</div>}

        {/* Export Tab */}
        {!loading && tab === "export" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={card}>
              <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>📤 Export Test Data</h2>
              <div style={{ marginBottom: 16 }}>
                <span style={label}>Format</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {["csv", "json"].map(f => (
                    <button key={f} onClick={() => setExportFormat(f)} style={{ ...btn(exportFormat === f), flex: 1 }}>{f.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={label}>Time Range (days)</span>
                <select value={exportDays} onChange={e => setExportDays(e.target.value)} style={{ ...input, cursor: "pointer" }}>
                  {[7, 14, 30, 60, 90, 180, 365].map(d => <option key={d} value={d}>Last {d} days</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <span style={label}>Filter by URL (optional)</span>
                <input placeholder="e.g. example.com" value={exportUrl} onChange={e => setExportUrl(e.target.value)} style={input} />
              </div>
              <button onClick={handleExport} disabled={exporting} style={{ width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.7 : 1 }}>
                {exporting ? "Downloading..." : `⬇ Download ${exportFormat.toUpperCase()}`}
              </button>
            </div>

            <div style={card}>
              <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>📋 Export Info</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  ["📄 CSV Format", "Flat spreadsheet with all test metrics. Opens directly in Excel or Google Sheets."],
                  ["🔧 JSON Format", "Full structured data with all fields including arrays (broken links, JS errors)."],
                  ["🔒 Your data only", "Exports include only tests run under your account."],
                  ["📦 Up to 5,000 rows", "Pro/Enterprise plans support larger exports."],
                ].map(([title, desc]) => (
                  <div key={title} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {!loading && tab === "summary" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Period:</span>
              {[7, 14, 30, 90].map(d => (
                <button key={d} onClick={async () => { setSummaryDays(d); const r = await authFetch(`${API}/reporting/summary?days=${d}`); if (r.ok) setSummary((await r.json()).summary); }} style={btn(summaryDays === d)}>
                  {d} days
                </button>
              ))}
            </div>

            {summary && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  ["Tests Run", summary.total_tests, "🧪"],
                  ["Unique URLs", summary.unique_urls, "🌐"],
                  ["Avg Score", summary.avg_score != null ? `${summary.avg_score}/100` : "—", "📊"],
                  ["Failure Rate", summary.failure_rate != null ? `${summary.failure_rate}%` : "—", "⚠️"],
                ].map(([lbl, val, icon]) => (
                  <div key={lbl} style={{ ...card, textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#6366f1" }}>{val ?? "—"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {summary?.top_failures?.length > 0 && (
                <div style={card}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>🔴 Top Failing URLs</h3>
                  {summary.top_failures.map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 13, color: "#9ca3af", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.url}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginLeft: 12 }}>{f.count}×</span>
                    </div>
                  ))}
                </div>
              )}
              {summary?.ssl_warnings?.length > 0 && (
                <div style={card}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>🔒 SSL Expiring Soon</h3>
                  {summary.ssl_warnings.map((w, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 13, color: "#9ca3af", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.url}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: w.days_remaining < 14 ? "#ef4444" : "#f59e0b", marginLeft: 12 }}>{w.days_remaining}d left</span>
                    </div>
                  ))}
                </div>
              )}
              {(!summary?.top_failures?.length && !summary?.ssl_warnings?.length) && (
                <div style={{ ...card, gridColumn: "1/-1", textAlign: "center", padding: 40, color: "#6b7280" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>No failures or SSL warnings in this period</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboards Tab */}
        {!loading && tab === "dashboards" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🗂 Custom Dashboards</h2>
              <button onClick={() => navigate("/dashboard")} style={{ ...btn(false), fontSize: 12 }}>+ Open Dashboard Builder</button>
            </div>
            {dashboards.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🗂</div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>No saved dashboards yet</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Save custom widget layouts from your main dashboard to access them here.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 16 }}>
                {dashboards.map(d => (
                  <div key={d.dashboard_id} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{d.name}</div>
                        {d.is_default && <span style={{ fontSize: 11, background: "rgba(99,102,241,0.2)", color: "#818cf8", padding: "2px 8px", borderRadius: 20 }}>Default</span>}
                      </div>
                      <button onClick={() => deleteDashboard(d.dashboard_id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: 4 }}>🗑</button>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>{d.widget_count} widget{d.widget_count !== 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 11, color: "#4b5563" }}>Created {d.created_at?.slice(0, 10)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {!loading && tab === "schedule" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={card}>
              <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>📅 New Scheduled Report</h2>
              <div style={{ marginBottom: 14 }}>
                <span style={label}>Report Name</span>
                <input placeholder="Weekly Team Summary" value={reportForm.name} onChange={e => setReportForm(p => ({ ...p, name: e.target.value }))} style={input} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <span style={label}>Schedule (cron)</span>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {CRON_PRESETS.map(p => (
                    <button key={p.value} onClick={() => setReportForm(prev => ({ ...prev, cron: p.value }))} style={{ ...btn(reportForm.cron === p.value), fontSize: 11, padding: "5px 10px" }}>{p.label}</button>
                  ))}
                </div>
                <input value={reportForm.cron} onChange={e => setReportForm(p => ({ ...p, cron: e.target.value }))} style={input} placeholder="0 9 * * 1" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <span style={label}>Format</span>
                  <select value={reportForm.format} onChange={e => setReportForm(p => ({ ...p, format: e.target.value }))} style={{ ...input, cursor: "pointer" }}>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
                <div>
                  <span style={label}>Delivery</span>
                  <select value={reportForm.delivery} onChange={e => setReportForm(p => ({ ...p, delivery: e.target.value }))} style={{ ...input, cursor: "pointer" }}>
                    <option value="email">Email</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <span style={label}>{reportForm.delivery === "email" ? "Email Address" : "Webhook URL"}</span>
                <input placeholder={reportForm.delivery === "email" ? "team@company.com" : "https://hooks.slack.com/..."} value={reportForm.destination} onChange={e => setReportForm(p => ({ ...p, destination: e.target.value }))} style={input} />
              </div>
              {reportMsg && <div style={{ marginBottom: 14, fontSize: 13, color: reportMsg.startsWith("✓") ? "#10b981" : "#ef4444" }}>{reportMsg}</div>}
              <button onClick={saveScheduledReport} disabled={savingReport || !reportForm.name || !reportForm.destination} style={{ width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", opacity: savingReport ? 0.7 : 1 }}>
                {savingReport ? "Saving..." : "📅 Schedule Report"}
              </button>
            </div>

            <div style={card}>
              <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>📋 Active Scheduled Reports</h2>
              {scheduledReports.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#6b7280", fontSize: 13 }}>No scheduled reports yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {scheduledReports.map(r => (
                    <div key={r.report_id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{r.name}</div>
                        <button onClick={() => deleteScheduledReport(r.report_id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: 2 }}>✕</button>
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                        <span>⏱ {r.cron}</span>
                        <span>📄 {r.format.toUpperCase()}</span>
                        <span>{r.delivery === "email" ? "✉️" : "🔗"} {r.destination}</span>
                        {r.last_sent && <span>Last: {r.last_sent.slice(0,10)}</span>}
                        {!r.last_sent && <span style={{ color: "#4b5563" }}>Never sent</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
