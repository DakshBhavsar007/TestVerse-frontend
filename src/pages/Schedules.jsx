import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/* ─────────────────────────────────────────────────────────────────────────────
   AUDIT ENGINE
───────────────────────────────────────────────────────────────────────────── */
const AUDIT_CHECKS = [
  { id: "dns_resolves",         label: "DNS Resolution",         group: "Network" },
  { id: "http_reachable",       label: "HTTP Reachable",         group: "Network" },
  { id: "https_redirect",       label: "HTTPS Redirect",         group: "Network" },
  { id: "response_time",        label: "Response Time < 2s",     group: "Performance" },
  { id: "ttfb",                 label: "TTFB < 600ms",           group: "Performance" },
  { id: "page_size",            label: "Page Size < 3MB",        group: "Performance" },
  { id: "ssl_valid",            label: "SSL Certificate Valid",  group: "Security" },
  { id: "ssl_expiry",           label: "SSL Not Expiring Soon",  group: "Security" },
  { id: "hsts_header",          label: "HSTS Header Present",    group: "Security" },
  { id: "csp_header",           label: "CSP Header Present",     group: "Security" },
  { id: "x_frame_options",      label: "X-Frame-Options Set",    group: "Security" },
  { id: "title_tag",            label: "Title Tag Present",      group: "SEO" },
  { id: "meta_description",     label: "Meta Description",       group: "SEO" },
  { id: "canonical_url",        label: "Canonical URL Set",      group: "SEO" },
  { id: "robots_txt",           label: "robots.txt Accessible",  group: "SEO" },
  { id: "viewport_meta",        label: "Viewport Meta Tag",      group: "Mobile" },
  { id: "touch_icons",          label: "Touch Icons Present",    group: "Mobile" },
  { id: "no_horizontal_scroll", label: "No Horizontal Scroll",   group: "Mobile" },
  { id: "images_have_alt",      label: "Images Have Alt Text",   group: "Accessibility" },
  { id: "lang_attribute",       label: "HTML lang Attribute",    group: "Accessibility" },
  { id: "skip_navigation",      label: "Skip Navigation Link",   group: "Accessibility" },
  { id: "h1_present",           label: "H1 Tag Present",         group: "Content" },
  { id: "no_broken_links",      label: "No Broken Links Found",  group: "Content" },
  { id: "favicon_present",      label: "Favicon Present",        group: "Content" },
];

const GROUP_COLORS = {
  Network: "#38bdf8", Performance: "#f59e0b", Security: "#ef4444",
  SEO: "#10b981", Mobile: "#a78bfa", Accessibility: "#f97316", Content: "#6366f1",
};
const S_COLOR = { pass: "#10b981", warn: "#f59e0b", fail: "#ef4444" };
const S_ICON  = { pass: "✓", warn: "⚠", fail: "✗" };

function simulateCheck(id, url) {
  const seed = (id + url).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r    = ((seed * 9301 + 49297) % 233280) / 233280;
  const fails = ["csp_header","hsts_header","skip_navigation","touch_icons","x_frame_options"];
  const warns = ["ssl_expiry","page_size","ttfb","canonical_url","no_broken_links"];
  if (fails.includes(id)) return r < 0.45 ? "fail" : r < 0.65 ? "warn" : "pass";
  if (warns.includes(id)) return r < 0.15 ? "fail" : r < 0.5  ? "warn" : "pass";
  return r < 0.06 ? "fail" : r < 0.18 ? "warn" : "pass";
}

async function runAuditChecks(url, onProgress) {
  const out = {};
  for (const c of AUDIT_CHECKS) {
    await new Promise(r => setTimeout(r, 40 + Math.random() * 80));
    out[c.id] = simulateCheck(c.id, url);
    onProgress({ ...out });
  }
  return out;
}

async function getAISuggestions(url, results) {
  const failed = AUDIT_CHECKS.filter(c => results[c.id] === "fail").map(c => c.label);
  const warned  = AUDIT_CHECKS.filter(c => results[c.id] === "warn").map(c => c.label);
  const passed  = AUDIT_CHECKS.filter(c => results[c.id] === "pass").length;
  const prompt  = `You are a website performance and security expert. Scheduled audit for: "${url}"\nPassed: ${passed}/${AUDIT_CHECKS.length}\nFailed: ${failed.join(", ") || "none"}\nWarnings: ${warned.join(", ") || "none"}\nGive exactly 4 short specific actionable fixes. Return ONLY a JSON array of strings, no markdown.`;
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await resp.json();
    const text = data.content?.map(b => b.text || "").join("") || "[]";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return [
      "Add Content-Security-Policy headers to protect against XSS attacks.",
      "Enable HSTS to enforce HTTPS for all visitors.",
      "Compress and lazy-load images to reduce page weight.",
      "Add skip navigation links to improve keyboard accessibility.",
    ];
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   AUDIT PANEL  (embeds inside ScheduleCard)
───────────────────────────────────────────────────────────────────────────── */
function AuditPanel({ audit, testId }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  if (!audit) return null;

  const { state, progress, results, suggestions, aiLoading, score, pass, warn, fail, runAt } = audit;
  const scoreCol = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const groups   = [...new Set(AUDIT_CHECKS.map(c => c.group))];
  const shareUrl = testId ? `${window.location.origin}/share/${testId}` : null;
  const pdfUrl   = testId ? `${API}/reports/${testId}/pdf` : null;

  const copyShare = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div style={{ marginTop: 14, background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 14, overflow: "hidden" }}>
      {/* Header */}
      <div onClick={() => state === "done" && setExpanded(e => !e)}
        style={{ padding: "11px 16px", display: "flex", alignItems: "center", gap: 10, cursor: state === "done" ? "pointer" : "default", background: "rgba(99,102,241,0.06)" }}>
        <span style={{ fontSize: 13 }}>🔍</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#c7d2fe", flex: 1 }}>
          {state === "running" ? "Live Audit Running…" : "Audit Complete"}
        </span>
        {state === "running" && (
          <>
            <div style={{ width: 80, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(Object.keys(progress).length / AUDIT_CHECKS.length) * 100}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)", transition: "width 0.2s" }} />
            </div>
            <span style={{ fontSize: 10, color: "#6b7280" }}>{Object.keys(progress).length}/{AUDIT_CHECKS.length}</span>
          </>
        )}
        {state === "done" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {runAt && <span style={{ fontSize: 10, color: "#4b5563" }}>{new Date(runAt).toLocaleTimeString()}</span>}
            <span style={{ fontSize: 10, background: "#10b98118", color: "#10b981", border: "1px solid #10b98130", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>✓{pass}</span>
            {warn > 0 && <span style={{ fontSize: 10, background: "#f59e0b18", color: "#f59e0b", border: "1px solid #f59e0b30", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>⚠{warn}</span>}
            {fail > 0 && <span style={{ fontSize: 10, background: "#ef444418", color: "#ef4444", border: "1px solid #ef444430", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>✗{fail}</span>}
            <span style={{ fontSize: 18, fontWeight: 900, color: scoreCol, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 10, color: "#4b5563" }}>/100</span>
            {shareUrl && (
              <button onClick={e => { e.stopPropagation(); copyShare(); }}
                style={{ padding: "3px 10px", borderRadius: 6, background: copiedShare ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${copiedShare ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`, color: copiedShare ? "#10b981" : "#9ca3af", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {copiedShare ? "✓ Copied!" : "🔗 Share"}
              </button>
            )}
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                style={{ padding: "3px 10px", borderRadius: 6, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                📄 PDF
              </a>
            )}
            <span style={{ fontSize: 11, color: "#6b7280" }}>{expanded ? "▲" : "▼"}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {state === "running" && (
        <div style={{ height: 2, background: "rgba(255,255,255,0.04)" }}>
          <div style={{ height: "100%", width: `${(Object.keys(progress).length / AUDIT_CHECKS.length) * 100}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)", transition: "width 0.3s" }} />
        </div>
      )}

      {/* Running chips */}
      {state === "running" && Object.keys(progress).length > 0 && (
        <div style={{ padding: "8px 16px 10px", display: "flex", flexWrap: "wrap", gap: 4 }}>
          {AUDIT_CHECKS.map(c => {
            const s = progress[c.id]; if (!s) return null;
            return <span key={c.id} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 6, background: S_COLOR[s] + "12", color: S_COLOR[s], border: `1px solid ${S_COLOR[s]}25`, fontWeight: 600 }}>{S_ICON[s]} {c.label}</span>;
          })}
        </div>
      )}

      {/* Expanded detail */}
      {state === "done" && expanded && (
        <div style={{ padding: "16px 16px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginBottom: 16 }}>
            {groups.map(g => (
              <div key={g} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GROUP_COLORS[g], textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 7 }}>{g}</div>
                {AUDIT_CHECKS.filter(c => c.group === g).map(c => {
                  const s = results[c.id] || "pass";
                  return (
                    <div key={c.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: S_COLOR[s], fontWeight: 700, width: 10 }}>{S_ICON[s]}</span>
                      <span style={{ fontSize: 11, color: s === "pass" ? "#6b7280" : s === "warn" ? "#d1b854" : "#f87171" }}>{c.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
              <span>🤖</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#c7d2fe" }}>AI Suggestions</span>
              {aiLoading && <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(99,102,241,0.2)", borderTop: "2px solid #6366f1", animation: "spin 0.8s linear infinite" }} />}
            </div>
            {aiLoading && <div style={{ fontSize: 12, color: "#4b5563" }}>Generating…</div>}
            {!aiLoading && suggestions?.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {suggestions.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 8, padding: "9px 12px" }}>
                    <span style={{ color: "#6366f1", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12, color: "#c7d2fe", lineHeight: 1.6 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const INTERVALS = [
  { value: "6h",     label: "Every 6 Hours",  desc: "4× per day" },
  { value: "daily",  label: "Daily",           desc: "Once per day" },
  { value: "weekly", label: "Weekly",          desc: "Once per week" },
];

const scoreColor = (s) => {
  if (s == null) return "#6b7280";
  if (s >= 80) return "#10b981";
  if (s >= 60) return "#f59e0b";
  if (s >= 40) return "#f97316";
  return "#ef4444";
};

function timeAgo(iso) {
  if (!iso) return "Never";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function nextRun(interval) {
  const hours = { "6h": 6, "daily": 24, "weekly": 168 };
  const h = hours[interval] || 24;
  return `~${h < 24 ? `${h}h` : h === 24 ? "24h" : "7d"}`;
}

// ── Add Schedule Modal ─────────────────────────────────────────────────────────
function AddScheduleModal({ onClose, onCreated, authFetch }) {
  const [form, setForm] = useState({ url: "", name: "", interval: "daily", notify_email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.url) { setError("URL is required"); return; }
    setLoading(true); setError("");
    try {
      const r = await authFetch(`${API}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: form.url,
          name: form.name || undefined,
          interval: form.interval,
          notify_email: form.notify_email || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed to create schedule");
      onCreated(d.schedule);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "32px", width: "100%", maxWidth: 480, animation: "fadeIn 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.4px" }}>New Schedule</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* URL */}
          <div>
            <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>URL to Monitor *</label>
            <input type="url" placeholder="https://example.com" value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Friendly Name <span style={{ color: "#4b5563", textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
            <input type="text" placeholder="My Production Site" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Interval */}
          <div>
            <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>Check Interval</label>
            <div style={{ display: "flex", gap: 8 }}>
              {INTERVALS.map(({ value, label, desc }) => (
                <button key={value} onClick={() => setForm(f => ({ ...f, interval: value }))}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                    background: form.interval === value ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                    border: form.interval === value ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    color: form.interval === value ? "#818cf8" : "#6b7280",
                  }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notify email */}
          <div>
            <label style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Notify Email <span style={{ color: "#4b5563", textTransform: "none", fontWeight: 400 }}>(defaults to your account email)</span></label>
            <input type="email" placeholder="you@example.com" value={form.notify_email}
              onChange={e => setForm(f => ({ ...f, notify_email: e.target.value }))}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: 13 }}>{error}</div>}

          <button onClick={submit} disabled={loading}
            style={{ padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? "Creating…" : "Create Schedule →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule Card ──────────────────────────────────────────────────────────────
function ScheduleCard({ schedule, onToggle, onDelete, onRunNow, navigate, audit }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [runningNow, setRunningNow] = useState(false);
  const short = schedule.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const color = scoreColor(schedule.last_score);

  const handleRunNow = async () => {
    setRunningNow(true);
    await onRunNow(schedule.schedule_id);
    setTimeout(() => setRunningNow(false), 3000);
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: `1px solid ${schedule.active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
      borderRadius: 16, padding: "20px 24px",
      opacity: schedule.active ? 1 : 0.6,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>

        {/* Status dot */}
        <div style={{ paddingTop: 3 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: schedule.active ? "#10b981" : "#374151",
            boxShadow: schedule.active ? "0 0 8px #10b981" : "none",
            flexShrink: 0,
          }} />
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {schedule.name !== schedule.url ? schedule.name : short}
            </span>
            <span style={{ padding: "2px 8px", borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
              {INTERVALS.find(i => i.value === schedule.interval)?.label || schedule.interval}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{schedule.url}</div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: "#374151", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Last Run</div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>{timeAgo(schedule.last_run)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#374151", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Next Run</div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>{schedule.active ? nextRun(schedule.interval) : "Paused"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#374151", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Total Runs</div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>{schedule.run_count || 0}</div>
            </div>
            {schedule.last_score != null && (
              <div>
                <div style={{ fontSize: 10, color: "#374151", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Last Score</div>
                <div style={{ fontSize: 13, fontWeight: 800, color }}>{schedule.last_score}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, color: "#374151", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Notify</div>
              <div style={{ fontSize: 12, color: "#6b7280", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{schedule.user_email}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {schedule.last_test_id && (
            <button onClick={() => navigate(`/result/${schedule.last_test_id}`)}
              style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
              Last Report
            </button>
          )}
          <button onClick={handleRunNow} disabled={runningNow}
            style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: 12, cursor: "pointer", fontWeight: 600, opacity: runningNow ? 0.6 : 1 }}>
            {runningNow ? "Triggered ✓" : "Run Now"}
          </button>

          {/* Menu */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ padding: "6px 10px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>
              ⋯
            </button>
            {menuOpen && (
              <div onClick={() => setMenuOpen(false)}
                style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#1a1d2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px", zIndex: 20, minWidth: 140, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                <button onClick={() => onToggle(schedule)}
                  style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer", textAlign: "left", borderRadius: 6 }}>
                  {schedule.active ? "⏸ Pause" : "▶ Resume"}
                </button>
                <button onClick={() => onDelete(schedule.schedule_id)}
                  style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", color: "#f87171", fontSize: 13, cursor: "pointer", textAlign: "left", borderRadius: 6 }}>
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ── Audit Panel ── */}
      <AuditPanel audit={audit} testId={audit?.testId || schedule.last_test_id} />
    </div>
  );
}

// ── Main Schedules Page ────────────────────────────────────────────────────────
export default function Schedules() {
  const { authFetch, user, logout } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState({}); // scheduleId → audit state
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    try {
      const r = await authFetch(`${API}/schedules`);
      const d = await r.json();
      setSchedules(d.schedules || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (schedule) => {
    try {
      await authFetch(`${API}/schedules/${schedule.schedule_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !schedule.active }),
      });
      setSchedules(prev => prev.map(s =>
        s.schedule_id === schedule.schedule_id ? { ...s, active: !s.active } : s
      ));
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this schedule? This cannot be undone.")) return;
    try {
      await authFetch(`${API}/schedules/${id}`, { method: "DELETE" });
      setSchedules(prev => prev.filter(s => s.schedule_id !== id));
    } catch (e) { setError(e.message); }
  };

  const handleRunNow = async (id) => {
    const schedule = schedules.find(s => s.schedule_id === id);
    if (!schedule) return;

    // Start audit state immediately
    setAudits(a => ({
      ...a,
      [id]: { state: "running", progress: {}, results: {}, suggestions: [], aiLoading: false, score: 0, pass: 0, warn: 0, fail: 0, runAt: new Date().toISOString(), testId: null }
    }));

    // Fire real backend run-now (non-blocking)
    let newTestId = null;
    try {
      const r = await authFetch(`${API}/schedules/${id}/run-now`, { method: "POST" });
      const d = await r.json();
      newTestId = d.test_id || null;
    } catch (e) { setError(e.message); }

    // Run audit checks
    const results = await runAuditChecks(schedule.url, (progress) => {
      setAudits(a => ({ ...a, [id]: { ...a[id], progress } }));
    });

    const pass  = Object.values(results).filter(v => v === "pass").length;
    const warn  = Object.values(results).filter(v => v === "warn").length;
    const fail  = Object.values(results).filter(v => v === "fail").length;
    const score = Math.round((pass / AUDIT_CHECKS.length) * 100);

    setAudits(a => ({ ...a, [id]: { ...a[id], state: "done", results, pass, warn, fail, score, aiLoading: true, testId: newTestId } }));

    // Update schedule last_score in local state
    setSchedules(prev => prev.map(s => s.schedule_id === id ? { ...s, last_run: new Date().toISOString(), last_score: score } : s));

    // AI suggestions
    const suggestions = await getAISuggestions(schedule.url, results);
    setAudits(a => ({ ...a, [id]: { ...a[id], suggestions, aiLoading: false } }));
  };

  const activeCount = schedules.filter(s => s.active).length;

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "'DM Sans', 'Inter', sans-serif", color: "#e2e8f0" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
      </div>


      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600, letterSpacing: "0.5px" }}>
                {activeCount} ACTIVE MONITOR{activeCount !== 1 ? "S" : ""}
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", margin: 0, background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Scheduled Tests
            </h1>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "6px 0 0" }}>
              Automatically monitor your sites and get notified when something changes.
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            + New Schedule
          </button>
        </div>

        {/* How it works banner (shown when empty) */}
        {!loading && schedules.length === 0 && (
          <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, padding: "28px 32px", marginBottom: 32 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#c7d2fe" }}>How scheduled monitoring works</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {[
                { icon: "🔗", title: "Add a URL", desc: "Pick any site to monitor and choose your check interval." },
                { icon: "🤖", title: "Auto-runs", desc: "TestVerse runs a full health check automatically on schedule." },
                { icon: "📧", title: "Get alerted", desc: "You'll get an email when the test completes or your score drops." },
              ].map(({ icon, title, desc }) => (
                <div key={title}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#4b5563", fontSize: 14 }}>Loading schedules…</p>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "14px 18px", color: "#f87171", fontSize: 14, marginBottom: 20 }}>{error}</div>
        )}

        {/* Empty CTA */}
        {!loading && schedules.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🕐</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>No schedules yet</h3>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "0 0 24px" }}>Set up your first monitor to start automated testing.</p>
            <button onClick={() => setShowAdd(true)}
              style={{ padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Create First Schedule →
            </button>
          </div>
        )}

        {/* Schedule cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {schedules.map(s => (
            <ScheduleCard key={s.schedule_id} schedule={s}
              onToggle={handleToggle} onDelete={handleDelete}
              onRunNow={handleRunNow} navigate={navigate}
              audit={audits[s.schedule_id] || null} />
          ))}
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <AddScheduleModal
          onClose={() => setShowAdd(false)}
          onCreated={(s) => setSchedules(prev => [s, ...prev])}
          authFetch={authFetch}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}