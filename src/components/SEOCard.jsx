import { Search } from "lucide-react";

const statusColor = (s) =>
  s === "pass" ? "text-success" : s === "warning" ? "text-warning" : s === "fail" ? "text-error" : "text-base-content/40";

const severityBadge = (s) =>
  s === "error" ? "badge-error" : s === "warning" ? "badge-warning" : "badge-info";

export default function SEOCard({ data }) {
  if (!data) return <SkeletonCard icon={<Search size={16} />} label="SEO Analysis" />;

  const { status, score, issues = [], data: d = {} } = data;

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body py-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-semibold">
            <Search size={16} /> SEO Analysis
          </div>
          <div className="flex items-center gap-2">
            {score != null && (
              <span className={`text-lg font-bold ${statusColor(status)}`}>{score}/100</span>
            )}
            <StatusBadge status={status} />
          </div>
        </div>

        {d.title && (
          <div className="text-sm mb-1">
            <span className="text-base-content/50">Title: </span>
            <span className="font-medium">{d.title}</span>
          </div>
        )}
        {d.meta_description && (
          <div className="text-sm mb-2 text-base-content/70 line-clamp-2">{d.meta_description}</div>
        )}

        <div className="flex flex-wrap gap-2 mb-2 text-xs">
          {d.h1_count != null && <span className="badge badge-ghost">H1: {d.h1_count}</span>}
          {d.h2_count != null && <span className="badge badge-ghost">H2: {d.h2_count}</span>}
          {d.canonical && <span className="badge badge-ghost">Canonical ✓</span>}
          {d.sitemap && <span className="badge badge-ghost">Sitemap ✓</span>}
          {d.robots_txt && <span className="badge badge-ghost">robots.txt ✓</span>}
          {d.og_tags?.title && <span className="badge badge-ghost">OG Tags ✓</span>}
        </div>

        {issues.length > 0 && (
          <ul className="space-y-1 mt-1">
            {issues.map((iss, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className={`badge badge-sm ${severityBadge(iss.severity)} shrink-0 mt-0.5`}>{iss.severity}</span>
                <span>{iss.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { pass: "badge-success", warning: "badge-warning", fail: "badge-error", error: "badge-ghost" };
  return <span className={`badge badge-sm ${map[status] || "badge-ghost"}`}>{status || "pending"}</span>;
}

function SkeletonCard({ icon, label }) {
  return (
    <div className="card bg-base-100 shadow animate-pulse">
      <div className="card-body py-4 px-5">
        <div className="flex items-center gap-2 font-semibold text-base-content/40">
          {icon} {label}
        </div>
        <div className="h-3 bg-base-300 rounded w-3/4 mt-3" />
        <div className="h-3 bg-base-300 rounded w-1/2 mt-2" />
      </div>
    </div>
  );
}
