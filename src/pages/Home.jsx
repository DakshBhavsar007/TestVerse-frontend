import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Shield, Zap, Search, ChevronDown, ChevronUp, Lock, Smartphone, Bug, Wand2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { startBasicTest, startLoginTest } from '../api';
import { useAuth } from '../hooks/useAuth';

// ── Smart selector inference ──────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s\-+()]{7,}$/;

function inferUsernameSelector(value) {
  if (!value) return { selector: '', hint: '' };
  if (EMAIL_RE.test(value))
    return { selector: 'input[type="email"]', hint: 'Detected email address' };
  if (PHONE_RE.test(value))
    return { selector: 'input[type="tel"]', hint: 'Detected phone number' };
  if (value.includes('@'))
    return { selector: 'input[type="email"], input[name="email"]', hint: 'Looks like an email' };
  if (value.toLowerCase().startsWith('admin') || value.toLowerCase().startsWith('root'))
    return { selector: 'input[name="username"], input[id="username"]', hint: 'Detected admin username' };
  // Generic username
  return {
    selector: 'input[name="username"], input[name="user"], input[type="text"]',
    hint: 'Detected username'
  };
}

function inferLoginUrl(mainUrl, value) {
  if (!mainUrl) return '';
  try {
    const base = new URL(mainUrl.startsWith('http') ? mainUrl : `https://${mainUrl}`);
    const origin = base.origin;
    // common login path patterns
    const paths = ['/login', '/auth', '/signin', '/sign-in', '/account/login'];
    // if login_url already matches one of these, don't override
    if (value && paths.some(p => value.includes(p))) return value;
    return origin + '/login';
  } catch {
    return '';
  }
}

// ── Selector hint badge ───────────────────────────────────────────────────────

const SelectorHint = ({ selector, hint }) => {
  if (!selector) return null;
  return (
    <div className="selector-hint">
      <Wand2 size={11} />
      <span className="selector-hint-label">{hint} →</span>
      <code className="selector-hint-code">{selector}</code>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const Home = () => {
  const [url, setUrl] = useState('');
  const [testType, setTestType] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { user, logout } = useAuth();

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    login_url: '',
    username_selector: '',
    password_selector: '',
    submit_selector: ''
  });

  // Auto-inferred hints (display only, not overriding manual input)
  const [autoSelectors, setAutoSelectors] = useState({
    username_selector: { selector: '', hint: '' },
  });

  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ── Re-infer whenever username or url changes ─────────────────────────────
  useEffect(() => {
    const inferred = inferUsernameSelector(loginData.username);
    setAutoSelectors({ username_selector: inferred });

    // Auto-fill login_url only if user hasn't typed one yet
    if (!loginData.login_url && url) {
      const suggested = inferLoginUrl(url, loginData.login_url);
      if (suggested) {
        setLoginData(prev => ({ ...prev, login_url: suggested }));
      }
    }
  }, [loginData.username, url]);

  // ── Effective selectors: use manual if filled, else auto ─────────────────
  const effectiveUsernameSelector =
    loginData.username_selector || autoSelectors.username_selector.selector;
  const effectivePasswordSelector =
    loginData.password_selector || 'input[type="password"]';

  const handleStartTest = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError('');
    try {
      let response;
      if (testType === 'basic') {
        response = await startBasicTest(url);
      } else {
        response = await startLoginTest({
          url,
          username: loginData.username,
          password: loginData.password,
          login_url: loginData.login_url || undefined,
          username_selector: effectiveUsernameSelector || undefined,
          password_selector: effectivePasswordSelector || undefined,
          submit_selector: loginData.submit_selector || undefined,
        });
      }
      if (response.data.success) {
        navigate(`/result/${response.data.test_id}`);
      }
      // Also handle 202 Accepted where success field may be missing
      else if (response.status === 202 || response.data.test_id) {
        const testId = response.data.test_id || response.data.data?.test_id;
        if (testId) navigate(`/result/${testId}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start test. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page slide-in">
      {/* Navbar — matches History/Result style */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px", color: "#e2e8f0" }}>TestVerse</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Dashboard</button>
          <button onClick={() => navigate("/history")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>History</button>
          <button onClick={() => navigate("/schedules")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Schedules</button>
          <button onClick={() => navigate("/teams")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Teams</button>
          <button onClick={() => navigate("/slack")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Slack</button>
          <button onClick={() => navigate("/apikeys")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>API Keys</button>
          <button onClick={() => navigate("/bulk")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Bulk Test</button>
          <button onClick={() => navigate("/whitelabel")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Branding</button>
          <button onClick={() => navigate("/analytics")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Analytics</button>
          <button onClick={() => navigate("/roles")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Roles</button>
          <button onClick={() => navigate("/notifications")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Alerts</button>
          <button onClick={() => navigate("/templates")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Templates</button>
          <button onClick={() => navigate("/monitoring")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Monitors</button>
          <button onClick={() => navigate("/reporting")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Reporting</button>
          <button onClick={() => navigate("/billing")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Billing</button>
          <button onClick={() => navigate("/compliance")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Compliance</button>
          <button onClick={() => navigate("/devtools")} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Dev Tools</button>
          <span style={{ fontSize: 13, color: "#4b5563" }}>{user?.email}</span>
          <button onClick={() => { logout(); navigate("/login"); }} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>Logout</button>
        </div>
      </nav>
      <div style={{ height: 60 }} />{/* spacer so hero isn't hidden behind fixed nav */}
      <div className="hero">
        <div className="hero-badge">
          <div className="dot"></div>
          AI-Powered Automated Testing
        </div>
        <h1>Analyze your website's <br />health in seconds.</h1>
        <p>Expert-level audits for uptime, speed, security, and mobile performance. No setup required.</p>

        <form onSubmit={handleStartTest} className="card-glass" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="tabs" style={{ margin: '0 0 24px 0' }}>
            <button type="button" className={`tab ${testType === 'basic' ? 'active' : ''}`} onClick={() => setTestType('basic')}>
              Basic Audit
            </button>
            <button type="button" className={`tab ${testType === 'login' ? 'active' : ''}`} onClick={() => setTestType('login')}>
              Login Automation
            </button>
          </div>

          <div className="url-input-wrap">
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Starting...' : 'Run Test'}
              <Zap size={18} />
            </button>
          </div>

          {testType === 'login' && (
            <div className="fade-in" style={{ marginTop: '24px', textAlign: 'left' }}>
              <div className="form-row">
                {/* Username field with smart detection */}
                <div className="form-group">
                  <label className="form-label">Username / Email</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="admin@example.com"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required={testType === 'login'}
                  />
                  {/* Show inferred selector hint if no manual override */}
                  {!loginData.username_selector && autoSelectors.username_selector.selector && (
                    <SelectorHint
                      selector={autoSelectors.username_selector.selector}
                      hint={autoSelectors.username_selector.hint}
                    />
                  )}
                  {/* Show manual override confirmation */}
                  {loginData.username_selector && (
                    <div className="selector-hint selector-hint-manual">
                      <CheckCircle2 size={11} />
                      <span className="selector-hint-label">Manual selector →</span>
                      <code className="selector-hint-code">{loginData.username_selector}</code>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required={testType === 'login'}
                      style={{ paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password selector is always auto-detected */}
                  <div className="selector-hint">
                    <Wand2 size={11} />
                    <span className="selector-hint-label">Auto-detected →</span>
                    <code className="selector-hint-code">input[type="password"]</code>
                  </div>
                </div>
              </div>

              {/* Advanced selectors */}
              <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Advanced Selectors (Optional)
              </div>

              {showAdvanced && (
                <div className="advanced-section slide-in">
                  <div className="form-group">
                    <label className="form-label">Login Page URL (if different)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://example.com/login"
                      value={loginData.login_url}
                      onChange={(e) => setLoginData({ ...loginData, login_url: e.target.value })}
                    />
                    {loginData.login_url && (
                      <div className="selector-hint">
                        <CheckCircle2 size={11} />
                        <span className="selector-hint-label">Will navigate to this URL first</span>
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Username CSS Selector
                        <span className="label-optional">overrides auto-detect</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={autoSelectors.username_selector.selector || '#username'}
                        value={loginData.username_selector}
                        onChange={(e) => setLoginData({ ...loginData, username_selector: e.target.value })}
                      />
                      {!loginData.username_selector && autoSelectors.username_selector.selector && (
                        <div className="selector-hint">
                          <Wand2 size={11} />
                          <span className="selector-hint-label">Will use auto →</span>
                          <code className="selector-hint-code">{autoSelectors.username_selector.selector}</code>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Password CSS Selector
                        <span className="label-optional">overrides auto-detect</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder='input[type="password"]'
                        value={loginData.password_selector}
                        onChange={(e) => setLoginData({ ...loginData, password_selector: e.target.value })}
                      />
                      {!loginData.password_selector && (
                        <div className="selector-hint">
                          <Wand2 size={11} />
                          <span className="selector-hint-label">Will use auto →</span>
                          <code className="selector-hint-code">input[type="password"]</code>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Submit Button Selector
                      <span className="label-optional">optional</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder='button[type="submit"]'
                      value={loginData.submit_selector}
                      onChange={(e) => setLoginData({ ...loginData, submit_selector: e.target.value })}
                    />
                    {!loginData.submit_selector && (
                      <div className="selector-hint">
                        <Wand2 size={11} />
                        <span className="selector-hint-label">Will auto-detect submit button</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-hint" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} /> Passwords are never stored in the database.
              </div>
            </div>
          )}

          {error && <div className="alert alert-error" style={{ marginTop: '20px' }}>{error}</div>}
        </form>

        <div className="feature-chips">
          <div className="chip"><Globe size={14} /> Uptime Monitor</div>
          <div className="chip"><Zap size={14} /> Speed Analysis</div>
          <div className="chip"><Shield size={14} /> SSL Check</div>
          <div className="chip"><Search size={14} /> Broken Links</div>
          <div className="chip"><Smartphone size={14} /> Mobile Friendly</div>
          <div className="chip"><Bug size={14} /> JS Errors</div>
        </div>
      </div>
    </div>
  );
};

export default Home;