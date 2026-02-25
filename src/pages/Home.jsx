import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// ─── Animated background grid ───────────────────────────────────────────────
function GridBackground() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0,
      background: "#06060f",
      overflow: "hidden", pointerEvents: "none"
    }}>
      {/* Grid lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />
      {/* Radial glow */}
      <div style={{
        position: "absolute",
        top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "900px", height: "600px",
        background: "radial-gradient(ellipse at center, rgba(99,102,241,0.13) 0%, rgba(167,139,250,0.06) 40%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      {/* Accent orbs */}
      <div style={{
        position: "absolute", top: "10%", right: "15%",
        width: 300, height: 300,
        background: "radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)",
        filter: "blur(60px)",
        animation: "floatOrb 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "20%", left: "10%",
        width: 250, height: 250,
        background: "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)",
        filter: "blur(60px)",
        animation: "floatOrb 10s ease-in-out infinite reverse",
      }} />

      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

// ─── Stat counter ────────────────────────────────────────────────────────────
function StatCounter({ end, suffix, label }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let timer;
    let observer;

    // Smoothly animate towards new end value
    const animateTo = (targetEnd, startFrom) => {
      let current = startFrom;
      const diff = targetEnd - current;
      const step = diff / 30; // 30 frames
      let frame = 0;

      clearInterval(timer);

      if (diff === 0) {
        setCount(targetEnd);
        return;
      }

      timer = setInterval(() => {
        frame++;
        current += step;
        if (frame >= 30) {
          setCount(targetEnd);
          clearInterval(timer);
          // If we want fake live ticks...
          if (targetEnd > 1000) {
            timer = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3) + 1), 3500);
          }
        } else {
          setCount(Math.floor(current));
        }
      }, 16);
    };

    observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        animateTo(end, count === 0 ? 0 : count);
      }
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    // If we're already non-zero, we might just want to animate there directly if end changes
    if (count > 0) {
      animateTo(end, count);
    }

    return () => {
      if (observer) observer.disconnect();
      clearInterval(timer);
    };
  }, [end]); // Re-run if end changes

  // Dynamic font size logic to prevent cutoffs
  const chars = count.toLocaleString().length + (suffix || "").length;
  const fontSize = chars > 8 ? "1.8rem" : "2.5rem";

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{
        fontSize: fontSize, fontWeight: 900, lineHeight: 1.3, paddingBottom: 2,
        background: "linear-gradient(135deg, #fff 40%, #a78bfa)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        fontFamily: "'Syne', sans-serif",
        letterSpacing: "-1.5px",
        whiteSpace: "nowrap",
        overflow: "visible",
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 4, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(20,20,40,0.9)" : "rgba(14,14,28,0.8)",
        border: `1px solid ${hovered ? color + "44" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 20, padding: "28px 24px",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? `0 20px 60px ${color}18` : "none",
        cursor: "default",
        animationDelay: delay,
        animation: "riseUp 0.6s ease both",
        position: "relative", overflow: "hidden",
      }}
    >
      {hovered && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          borderRadius: "20px 20px 0 0",
        }} />
      )}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.3rem", marginBottom: 16,
        transition: "all 0.3s",
        transform: hovered ? "scale(1.1)" : "scale(1)",
      }}>
        {icon}
      </div>
      <div style={{ fontWeight: 700, fontSize: "1rem", color: "#e2e8f0", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

// ─── Main Home component ──────────────────────────────────────────────────────
export default function Home() {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState("basic");
  const [loginData, setLoginData] = useState({ url: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [realStats, setRealStats] = useState(null);
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  // Fetch real-time stats from dashboard
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
        const res = await authFetch(`${API}/dashboard/stats`);
        if (res.ok) {
          const data = await res.json();
          setRealStats(data);
        }
      } catch (e) {
        // silently fall back to defaults
      }
    };
    fetchStats();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRun = async () => {
    const targetUrl = tab === "basic" ? url : loginData.url;
    if (!targetUrl) return;
    setLoading(true);
    try {
      const payload = { url: targetUrl };
      if (tab === "login") {
        if (!loginData.username || !loginData.password) {
          alert("Username and password are required for login automation");
          setLoading(false);
          return;
        }
        payload.username = loginData.username;
        payload.password = loginData.password;
      }
      const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
      const res = await authFetch(`${API}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText}`);
      }
      const data = await res.json();
      if (data.test_id) {
        navigate(`/result/${data.test_id}`);
      } else {
        alert("Failed to start test — no test_id returned");
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: "🌐", title: "Uptime Monitor", desc: "24/7 availability tracking with instant alerting when your site goes down.", color: "#6366f1" },
    { icon: "⚡", title: "Speed Analysis", desc: "Core Web Vitals, LCP, CLS, FID — full performance breakdown in seconds.", color: "#22d3ee" },
    { icon: "🔒", title: "SSL Check", desc: "Certificate validity, expiry warnings, and HTTPS configuration audits.", color: "#10b981" },
    { icon: "🔗", title: "Broken Links", desc: "Crawl every page and surface 404s, redirects, and dead-end links.", color: "#f59e0b" },
    { icon: "📱", title: "Mobile Friendly", desc: "Responsive design testing across viewport sizes and touch targets.", color: "#a78bfa" },
    { icon: "⚙️", title: "JS Errors", desc: "Runtime error detection and console warning capture at scale.", color: "#ef4444" },
  ];

  return (
    <>
      <GridBackground />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes riseUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .run-btn:hover { filter: brightness(1.15) !important; transform: translateY(-2px) scale(1.02) !important; }
        .run-btn:active { transform: scale(0.98) !important; }
        .tab-pill:hover { color: #c4b5fd !important; }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", padding: "100px 24px 60px", maxWidth: 900, margin: "0 auto" }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
            padding: "6px 18px", borderRadius: 999, marginBottom: 36,
            animation: "riseUp 0.5s ease both",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block", position: "relative" }}>
              <span style={{
                position: "absolute", inset: -2, borderRadius: "50%",
                border: "2px solid #10b981", animation: "pulse-ring 2s ease infinite"
              }} />
            </span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#818cf8", letterSpacing: "0.05em" }}>
              AI-POWERED AUTOMATED TESTING
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 900, lineHeight: 1.1,
            letterSpacing: "-1.5px",
            marginBottom: 24,
            maxWidth: 800,
            margin: "0 auto 24px",
            animation: "riseUp 0.6s ease 0.1s both",
          }}>
            <span style={{ color: "#f1f5f9" }}>Analyze your </span>
            <span style={{
              background: "linear-gradient(135deg, #818cf8, #c4b5fd 40%, #22d3ee)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundSize: "200% auto",
              animation: "shimmer 4s linear infinite",
            }}>
              website's health
            </span>
            <span style={{ color: "#f1f5f9" }}> in seconds.</span>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: "1.15rem", color: "#64748b", maxWidth: 500,
            margin: "0 auto 48px", lineHeight: 1.65, fontWeight: 400,
            animation: "riseUp 0.6s ease 0.2s both",
          }}>
            Expert-level audits for uptime, speed, security, and mobile performance.
            <br />No setup required.
          </p>

          {/* ── INPUT CARD ──────────────────────────────────────────── */}
          <div style={{ position: "relative", maxWidth: 740, margin: "0 auto", zIndex: 10 }}>
            {/* Glowing orb behind card */}
            <div style={{
              position: "absolute", inset: -20, zIndex: -1,
              background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(167,139,250,0.5), rgba(34,211,238,0.5))",
              filter: "blur(40px)", opacity: focused ? 0.6 : 0.2,
              transition: "opacity 0.6s ease", borderRadius: 40,
            }} />

            <div style={{
              background: "linear-gradient(145deg, rgba(20,20,38,0.95), rgba(14,14,28,0.85))", backdropFilter: "blur(24px)",
              border: `1px solid ${focused ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 24, padding: 28,
              boxShadow: focused ? "0 0 80px rgba(99,102,241,0.2)" : "0 20px 60px rgba(0,0,0,0.4)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", animation: "riseUp 0.6s ease 0.3s both",
            }}>
              {/* Tab switcher */}
              <div style={{
                display: "flex", gap: 4,
                background: "rgba(255,255,255,0.04)",
                padding: 4, borderRadius: 12, width: "fit-content", marginBottom: 24,
              }}>
                {["basic", "login"].map(t => (
                  <button
                    key={t}
                    className="tab-pill"
                    onClick={() => setTab(t)}
                    style={{
                      padding: "9px 22px", borderRadius: 9, border: "none",
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.875rem",
                      cursor: "pointer", transition: "all 0.2s",
                      background: tab === t ? "linear-gradient(135deg, #6366f1, #818cf8)" : "transparent",
                      color: tab === t ? "#fff" : "#6b7280",
                      boxShadow: tab === t ? "0 4px 16px rgba(99,102,241,0.35)" : "none",
                    }}
                  >
                    {t === "basic" ? "Basic Audit" : "Login Automation"}
                  </button>
                ))}
              </div>

              {tab === "basic" ? (
                /* Basic URL input */
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{
                      position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                      fontSize: "1rem", opacity: 0.4, pointerEvents: "none",
                    }}>🔍</div>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onKeyDown={e => e.key === "Enter" && handleRun()}
                      style={{
                        boxSizing: "border-box", width: "100%", padding: "16px 20px 16px 44px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 14, fontSize: "1rem",
                        color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif",
                        outline: "none", transition: "border-color 0.2s",
                      }}
                      onMouseOver={e => e.target.style.borderColor = "rgba(99,102,241,0.3)"}
                      onMouseOut={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                  </div>
                  <button
                    className="run-btn"
                    onClick={handleRun}
                    disabled={!url || loading}
                    style={{
                      padding: "16px 28px", borderRadius: 14, border: "none",
                      background: "linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #6366f1 100%)",
                      backgroundSize: "200% auto",
                      color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: !url || loading ? 0.7 : 1,
                      display: "flex", alignItems: "center", gap: 8,
                      whiteSpace: "nowrap", transition: "all 0.2s",
                      boxShadow: "0 4px 24px rgba(99,102,241,0.4)",
                      animation: "shimmer 3s linear infinite",
                    }}
                  >
                    {loading ? (
                      <>
                        <span style={{
                          width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                          borderTop: "2px solid #fff", borderRadius: "50%",
                          animation: "spin 0.8s linear infinite", display: "inline-block"
                        }} />
                        Running...
                      </>
                    ) : (
                      <> Run Test ⚡</>
                    )}
                  </button>
                </div>
              ) : (
                /* Login automation form */
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { key: "url", label: "Website URL", placeholder: "https://example.com/login", type: "url" },
                    { key: "username", label: "Username / Email", placeholder: "user@example.com", type: "text" },
                    { key: "password", label: "Password", placeholder: "••••••••", type: "password" },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6b7280", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={loginData[key]}
                        onChange={e => setLoginData(d => ({ ...d, [key]: e.target.value }))}
                        onFocus={e => {
                          setFocused(true);
                          e.target.style.borderColor = "rgba(99,102,241,0.6)";
                          e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                          e.target.style.background = "rgba(255,255,255,0.06)";
                        }}
                        onBlur={e => {
                          setFocused(false);
                          e.target.style.borderColor = "rgba(255,255,255,0.08)";
                          e.target.style.boxShadow = "none";
                          e.target.style.background = "rgba(255,255,255,0.04)";
                        }}
                        onMouseOver={e => {
                          if (document.activeElement !== e.target)
                            e.target.style.borderColor = "rgba(99,102,241,0.3)";
                        }}
                        onMouseOut={e => {
                          if (document.activeElement !== e.target)
                            e.target.style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                        style={{
                          boxSizing: "border-box", width: "100%", padding: "13px 16px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12, fontSize: "0.95rem",
                          color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif",
                          outline: "none",
                          transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                        }}
                      />
                    </div>
                  ))}
                  <button
                    className="run-btn"
                    onClick={handleRun}
                    disabled={!loginData.url || loading}
                    style={{
                      boxSizing: "border-box", width: "100%",
                      padding: "15px", borderRadius: 14, border: "none",
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                      color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: !loginData.url || loading ? 0.7 : 1,
                      boxShadow: "0 4px 24px rgba(99,102,241,0.35)", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <span style={{
                          width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                          borderTop: "2px solid #fff", borderRadius: "50%",
                          animation: "spin 0.8s linear infinite", display: "inline-block"
                        }} />
                        Running...
                      </>
                    ) : (
                      <>Run Login Test ⚡</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── FEATURE CHIPS ────────────────────────────────────────── */}
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10,
            marginTop: 32, animation: "riseUp 0.6s ease 0.4s both",
          }}>
            {[
              { icon: "🌐", label: "Uptime Monitor" },
              { icon: "⚡", label: "Speed Analysis" },
              { icon: "🔒", label: "SSL Check" },
              { icon: "🔗", label: "Broken Links" },
              { icon: "📱", label: "Mobile Friendly" },
              { icon: "⚙️", label: "JS Errors" },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 18px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 999, fontSize: "0.82rem", color: "#9ca3af",
                cursor: "default", transition: "all 0.2s",
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.color = "#c4b5fd"; e.currentTarget.style.background = "rgba(99,102,241,0.07)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              >
                <span>{icon}</span> {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── STATS STRIP ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: 840, margin: "0 auto 80px", padding: "0 24px" }}>
          {realStats && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: "0.7rem", fontWeight: 700, color: "#10b981",
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#10b981",
                  boxShadow: "0 0 6px #10b981",
                  animation: "pulse 2s ease-in-out infinite",
                }} />
                Live
              </span>
            </div>
          )}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 1, background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20,
          }}>
            {[
              {
                end: realStats ? realStats.total_tests : 2400000,
                suffix: "+",
                label: "Tests Run",
                live: !!realStats,
              },
              {
                end: realStats ? realStats.uptime_accuracy : 98,
                suffix: "%",
                label: "Uptime Accuracy",
                live: !!realStats,
              },
              {
                end: realStats ? realStats.avg_response_ms : 50,
                suffix: "ms",
                label: "Avg Response",
                live: !!realStats,
              },
              {
                end: realStats ? realStats.sites_monitored : 12000,
                suffix: "+",
                label: "Sites Monitored",
                live: !!realStats,
              },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "32px 20px",
                background: "rgba(10,10,20,0.7)",
                textAlign: "center",
              }}>
                <StatCounter {...s} />
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURE GRID ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{
              fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em",
              color: "#6366f1", textTransform: "uppercase", marginBottom: 14,
            }}>Everything you need</div>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900,
              color: "#f1f5f9", letterSpacing: "-1px", lineHeight: 1.1,
            }}>
              Full-stack site intelligence
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}>
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={`${i * 0.07}s`} />
            ))}
          </div>
        </div>

        {/* ── CTA STRIP ────────────────────────────────────────────────── */}
        <div style={{ padding: "0 24px 100px" }}>
          <div style={{
            maxWidth: 700, margin: "0 auto", textAlign: "center",
            background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(167,139,250,0.05))",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 28, padding: "60px 40px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -60, right: -60,
              width: 200, height: 200,
              background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)",
            }} />
            <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#818cf8", textTransform: "uppercase", marginBottom: 16 }}>
              Start free today
            </div>
            <h3 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "2.2rem", fontWeight: 900, color: "#f1f5f9",
              letterSpacing: "-1px", marginBottom: 16,
            }}>
              Your site deserves better.
            </h3>
            <p style={{ color: "#6b7280", marginBottom: 32, fontSize: "1rem" }}>
              Run your first audit in under 30 seconds. No credit card required.
            </p>
            <button
              className="run-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{
                padding: "16px 36px", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "#fff", fontWeight: 700, fontSize: "1rem",
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                boxShadow: "0 8px 32px rgba(99,102,241,0.4)", transition: "all 0.2s",
              }}
            >
              Run a free audit ↑
            </button>
          </div>
        </div>

      </div>
    </>
  );
}