import { useState } from "react";
import { Eye, Shield, Zap, Lock, FileText, Smartphone, Settings, Globe } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────
const statusColors = {
  pass:    { text: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  warning: { text: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  fail:    { text: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
  error:   { text: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
};

const scoreToStatus = (score) => {
  if (score == null) return "error";
  if (score >= 80) return "pass";
  if (score >= 50) return "warning";
  return "fail";
};

function StatusPill({ status, label }) {
  const s = statusColors[status] || statusColors.error;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.text, border: `1px solid ${s.border}`, textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label || status}
    </span>
  );
}

function Badge({ children, type = "neutral" }) {
  const colors = {
    success: { bg: "rgba(16,185,129,0.1)", color: "#10b981", border: "rgba(16,185,129,0.2)" },
    warning: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.2)" },
    error:   { bg: "rgba(239,68,68,0.1)",  color: "#ef4444", border: "rgba(239,68,68,0.2)" },
    neutral: { bg: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "rgba(255,255,255,0.1)" },
  };
  const c = colors[type] || colors.neutral;
  return (
    <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
      background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {children}
    </span>
  );
}

function ScoreBar({ score }) {
  if (score == null) return null;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 2, transition: "width 1s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 32, textAlign: "right" }}>{score}</span>
    </div>
  );
}

function IssueList({ issues }) {
  if (!issues?.length) return null;
  return (
    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
      {issues.slice(0, 5).map((iss, i) => {
        const sev = iss.severity === "error" ? "error" : iss.severity === "warning" ? "warning" : "neutral";
        return (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Badge type={sev}>{iss.severity || "info"}</Badge>
            <span style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>{iss.message}</span>
          </div>
        );
      })}
      {issues.length > 5 && <span style={{ fontSize: 11, color: "#4b5563" }}>+{issues.length - 5} more issues</span>}
    </div>
  );
}

// ── Card shell with expand/collapse ───────────────────────────────────────────
function CardShell({ icon: Icon, label, status, score, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const s = statusColors[status] || statusColors.error;
  const hasContent = !!children;

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${open ? s.border : "rgba(255,255,255,0.06)"}`,
      borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s", marginBottom: 8 }}>
      <div onClick={() => hasContent && setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px",
          cursor: hasContent ? "pointer" : "default",
          background: open ? "rgba(255,255,255,0.02)" : "transparent",
          transition: "background 0.2s" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, border: `1px solid ${s.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", color: s.text, flexShrink: 0 }}>
          <Icon size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0" }}>{label}</div>
          {score != null && <ScoreBar score={score} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <StatusPill status={status} />
          {hasContent && (
            <span style={{ color: "#4b5563", fontSize: 16, transition: "transform 0.2s", display: "inline-block",
              transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
          )}
        </div>
      </div>

      {open && hasContent && (
        <div style={{ padding: "0 20px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ paddingTop: 14 }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function SkeletonCard({ icon: Icon, label }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 20px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{label}</div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2, marginTop: 8, width: "60%" }} />
      </div>
      <div style={{ width: 60, height: 22, borderRadius: 20, background: "rgba(255,255,255,0.04)" }} />
    </div>
  );
}

// ── Individual Cards ───────────────────────────────────────────────────────────
export function AccessibilityCard({ data }) {
  if (!data) return <SkeletonCard icon={Eye} label="Accessibility (WCAG)" />;
  const { status, score, issues = [], data: d = {} } = data;
  return (
    <CardShell icon={Eye} label="Accessibility (WCAG)" status={status || scoreToStatus(score)} score={score}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {d.images_missing_alt != null && <Badge type={d.images_missing_alt > 0 ? "warning" : "success"}>Alt missing: {d.images_missing_alt}</Badge>}
        {d.unlabeled_inputs != null && <Badge type={d.unlabeled_inputs > 0 ? "warning" : "success"}>Unlabeled inputs: {d.unlabeled_inputs}</Badge>}
        {d.lang_attribute && <Badge type="success">lang ✓</Badge>}
        {d.landmark_count != null && <Badge>Landmarks: {d.landmark_count}</Badge>}
        {d.has_skip_link && <Badge type="success">Skip link ✓</Badge>}
        {!d.images_missing_alt && !d.unlabeled_inputs && !d.lang_attribute && (
          <span style={{ fontSize: 13, color: "#6b7280" }}>No detailed data available</span>
        )}
      </div>
      <IssueList issues={issues} />
    </CardShell>
  );
}

export function SecurityHeadersCard({ data }) {
  if (!data) return <SkeletonCard icon={Shield} label="Security Headers" />;
  const { status, score, issues = [], present = {}, missing = [] } = data;
  return (
    <CardShell icon={Shield} label="Security Headers" status={status || scoreToStatus(score)} score={score}>
      {Object.keys(present).length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Present</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.keys(present).map(h => <Badge key={h} type="success">{h} ✓</Badge>)}
          </div>
        </div>
      )}
      {missing.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Missing</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {missing.map(h => <Badge key={h} type="error">{h} ✗</Badge>)}
          </div>
        </div>
      )}
      {Object.keys(present).length === 0 && missing.length === 0 && (
        <span style={{ fontSize: 13, color: "#6b7280" }}>No header data available</span>
      )}
      <IssueList issues={issues} />
    </CardShell>
  );
}

export function CoreWebVitalsCard({ data }) {
  if (!data) return <SkeletonCard icon={Zap} label="Core Web Vitals" />;
  const { status, score, issues = [], metrics = {} } = data;
  const vitals = [
    { label: "LCP", value: metrics.lcp_ms, unit: "ms", good: 2500, poor: 4000 },
    { label: "CLS", value: metrics.cls, unit: "", good: 0.1, poor: 0.25, decimals: 3 },
    { label: "FCP", value: metrics.fcp_ms, unit: "ms", good: 1800, poor: 3000 },
    { label: "TBT", value: metrics.tbt_ms, unit: "ms", good: 200, poor: 600 },
    { label: "TTFB", value: metrics.ttfb_ms, unit: "ms", good: 200, poor: 600 },
  ].filter(v => v.value != null);
  return (
    <CardShell icon={Zap} label="Core Web Vitals" status={status || scoreToStatus(score)} score={score}>
      {vitals.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
          {vitals.map(v => {
            const color = v.value <= v.good ? "#10b981" : v.value <= v.poor ? "#f59e0b" : "#ef4444";
            return (
              <div key={v.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{v.decimals ? v.value.toFixed(v.decimals) : Math.round(v.value)}{v.unit}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{v.label}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <span style={{ fontSize: 13, color: "#6b7280" }}>No metrics data available</span>
      )}
      <IssueList issues={issues} />
    </CardShell>
  );
}

export function CookiesGDPRCard({ data }) {
  if (!data) return <SkeletonCard icon={Lock} label="Cookies & GDPR" />;
  const { status, score, issues = [], data: d = {} } = data;
  return (
    <CardShell icon={Lock} label="Cookies & GDPR" status={status || scoreToStatus(score)} score={score}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {d.cookie_count != null && <Badge>Cookies: {d.cookie_count}</Badge>}
        {d.consent_banner_detected != null && <Badge type={d.consent_banner_detected ? "success" : "error"}>{d.consent_banner_detected ? "Consent Banner ✓" : "No Consent Banner"}</Badge>}
        {d.has_privacy_policy != null && <Badge type={d.has_privacy_policy ? "success" : "warning"}>{d.has_privacy_policy ? "Privacy Policy ✓" : "No Privacy Policy"}</Badge>}
        {d.third_party_scripts != null && <Badge>3rd party scripts: {d.third_party_scripts}</Badge>}
        {!d.cookie_count && d.consent_banner_detected == null && (
          <span style={{ fontSize: 13, color: "#6b7280" }}>No cookie data available</span>
        )}
      </div>
      <IssueList issues={issues} />
    </CardShell>
  );
}

export function HTMLValidationCard({ data }) {
  if (!data) return <SkeletonCard icon={Globe} label="HTML Validation" />;
  const { status, score, issues = [], data: d = {} } = data;
  return (
    <CardShell icon={Globe} label="HTML Validation" status={status || scoreToStatus(score)} score={score}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {d.has_doctype && <Badge type="success">DOCTYPE ✓</Badge>}
        {d.has_charset && <Badge type="success">Charset ✓</Badge>}
        {d.has_viewport && <Badge type="success">Viewport ✓</Badge>}
        {d.duplicate_ids?.length > 0 && <Badge type="error">Duplicate IDs: {d.duplicate_ids.length}</Badge>}
        {d.empty_links > 0 && <Badge type="warning">Empty links: {d.empty_links}</Badge>}
        {d.deprecated_tags?.length > 0 && <Badge type="warning">Deprecated tags: {d.deprecated_tags.length}</Badge>}
        {d.inline_style_count != null && <Badge>Inline styles: {d.inline_style_count}</Badge>}
        {!d.has_doctype && !d.has_charset && !d.has_viewport && (
          <span style={{ fontSize: 13, color: "#6b7280" }}>No validation data available</span>
        )}
      </div>
      <IssueList issues={issues} />
    </CardShell>
  );
}

export function ContentQualityCard({ data }) {
  if (!data) return <SkeletonCard icon={FileText} label="Content Quality" />;
  const { status, score, issues = [], data: d = {} } = data;
  return (
    <CardShell icon={FileText} label="Content Quality" status={status || scoreToStatus(score)} score={score}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {d.word_count != null && <Badge>Words: {d.word_count}</Badge>}
        {d.sentence_count != null && <Badge>Sentences: {d.sentence_count}</Badge>}
        {d.content_ratio_pct != null && <Badge>Content ratio: {d.content_ratio_pct}%</Badge>}
        {d.avg_sentence_length != null && <Badge>Avg sentence: {d.avg_sentence_length} words</Badge>}
      </div>
      {d.top_keywords?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Top Keywords</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {d.top_keywords.slice(0, 6).map(k => <Badge key={k.word}>{k.word} ({k.count})</Badge>)}
          </div>
        </div>
      )}
      {!d.word_count && !d.sentence_count && (
        <span style={{ fontSize: 13, color: "#6b7280" }}>No content data available</span>
      )}
      <IssueList issues={issues} />
    </CardShell>
  );
}

export function PWACard({ data }) {
  if (!data) return <SkeletonCard icon={Smartphone} label="PWA Readiness" />;
  const { status, score, issues = [], data: d = {} } = data;
  return (
    <CardShell icon={Smartphone} label="PWA Readiness" status={status || scoreToStatus(score)} score={score}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {d.https != null && <Badge type={d.https ? "success" : "error"}>{d.https ? "HTTPS ✓" : "No HTTPS"}</Badge>}
        {d.has_manifest != null && <Badge type={d.has_manifest ? "success" : "error"}>{d.has_manifest ? "Manifest ✓" : "No Manifest"}</Badge>}
        {d.has_service_worker != null && <Badge type={d.has_service_worker ? "success" : "warning"}>{d.has_service_worker ? "Service Worker ✓" : "No Service Worker"}</Badge>}
        {d.has_apple_touch_icon && <Badge type="success">Apple Icon ✓</Badge>}
        {d.has_theme_color && <Badge type="success">Theme Color ✓</Badge>}
        {d.manifest?.icons != null && <Badge>Icons: {d.manifest.icons}</Badge>}
        {d.https == null && d.has_manifest == null && (
          <span style={{ fontSize: 13, color: "#6b7280" }}>No PWA data available</span>
        )}
      </div>
      <IssueList issues={issues} />
    </CardShell>
  );
}

export function FunctionalityCard({ data }) {
  if (!data) return <SkeletonCard icon={Settings} label="Functionality Audit" />;
  const { status, score, issues = [], data: d = {} } = data;
  return (
    <CardShell icon={Settings} label="Functionality Audit" status={status || scoreToStatus(score)} score={score}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {d.form_count != null && <Badge>Forms: {d.form_count}</Badge>}
        {d.cta_count != null && <Badge>CTAs: {d.cta_count}</Badge>}
        {d.nav_link_count != null && <Badge>Nav links: {d.nav_link_count}</Badge>}
        {d.has_search && <Badge type="success">Search ✓</Badge>}
        {d.has_contact_info && <Badge type="success">Contact info ✓</Badge>}
        {d.social_links?.length > 0 && <Badge>Social: {d.social_links.length}</Badge>}
        {d.has_custom_404 != null && <Badge type={d.has_custom_404 ? "success" : "warning"}>{d.has_custom_404 ? "Custom 404 ✓" : "No custom 404"}</Badge>}
        {d.form_count == null && d.cta_count == null && (
          <span style={{ fontSize: 13, color: "#6b7280" }}>No functionality data available</span>
        )}
      </div>
      {d.cta_buttons?.length > 0 && (
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
          CTAs: {d.cta_buttons.slice(0, 4).map(c => c.text).join(", ")}
        </div>
      )}
      <IssueList issues={issues} />
    </CardShell>
  );
}